import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendNewsletterRequest {
  postId: string;
  title: string;
  content: string;
  excerpt?: string;
  featureImageUrl?: string;
  contentType: 'blog' | 'newsletter';
  visibility: 'public' | 'subscribers' | 'tiered';
  requiredMinTier?: string;
  slug: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      postId, 
      title, 
      content, 
      excerpt, 
      featureImageUrl, 
      contentType,
      visibility,
      requiredMinTier,
      slug 
    }: SendNewsletterRequest = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subscribers based on content visibility
    let subscribersQuery = supabase
      .from('newsletter_subscribers')
      .select('email, first_name, last_name')
      .eq('subscribed', true);

    // If it's tiered content, also check user subscriptions
    if (visibility === 'tiered' && requiredMinTier) {
      // For tiered content, we need to check both newsletter subscribers and paid subscribers
      const { data: paidSubscribers } = await supabase
        .from('subscribers')
        .select('email')
        .eq('subscribed', true);

      const tierHierarchy = ['basic', 'premium', 'enterprise'];
      const requiredTierIndex = tierHierarchy.indexOf(requiredMinTier);
      
      const validPaidSubscribers = paidSubscribers?.filter(sub => {
        const userTierIndex = sub.subscription_tier ? tierHierarchy.indexOf(sub.subscription_tier) : -1;
        return userTierIndex >= requiredTierIndex;
      }) || [];

      const validEmails = validPaidSubscribers.map(sub => sub.email);
      
      subscribersQuery = subscribersQuery.in('email', validEmails);
    }

    const { data: subscribers, error: subscribersError } = await subscribersQuery;

    if (subscribersError) {
      throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No subscribers found for this content type",
        sent: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create email HTML content
    const readOnlineUrl = `${Deno.env.get("SITE_URL") || "https://your-domain.com"}/content/${slug}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px; }
            .content { margin-bottom: 30px; }
            .footer { border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center; font-size: 14px; color: #666; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature-image { width: 100%; max-width: 500px; height: auto; border-radius: 8px; margin: 20px 0; }
            h1 { color: #2c3e50; margin-bottom: 10px; }
            .excerpt { font-size: 18px; color: #666; font-style: italic; margin-bottom: 20px; }
            .unsubscribe { font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
              ${excerpt ? `<p class="excerpt">${excerpt}</p>` : ''}
            </div>
            
            ${featureImageUrl ? `<img src="${featureImageUrl}" alt="${title}" class="feature-image">` : ''}
            
            <div class="content">
              ${content.replace(/\n/g, '<br>')}
            </div>
            
            <div style="text-align: center;">
              <a href="${readOnlineUrl}" class="button">Read Online</a>
            </div>
            
            <div class="footer">
              <p>Thank you for subscribing to our ${contentType}!</p>
              <p class="unsubscribe">
                If you no longer wish to receive these emails, you can 
                <a href="${readOnlineUrl}">manage your subscription preferences</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    let sentCount = 0;
    let errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      try {
        const emailPromises = batch.map(subscriber => {
          const personalizedSubject = `${title}`;
          
          return resend.emails.send({
            from: 'Newsletter <newsletter@your-domain.com>', // Update with your domain
            to: [subscriber.email],
            subject: personalizedSubject,
            html: emailHtml,
            headers: {
              'List-Unsubscribe': `<${readOnlineUrl}>`,
              'X-Newsletter-ID': postId,
            }
          });
        });

        const results = await Promise.allSettled(emailPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            sentCount++;
          } else {
            errors.push(`Failed to send to ${batch[index].email}: ${result.reason}`);
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Batch error:`, error);
        errors.push(`Batch ${i / batchSize + 1} failed: ${error.message}`);
      }
    }

    console.log(`Newsletter sent. Success: ${sentCount}, Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error("Send errors:", errors);
    }

    return new Response(JSON.stringify({
      message: `Newsletter sent successfully`,
      sent: sentCount,
      total: subscribers.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-newsletter function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send newsletter",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
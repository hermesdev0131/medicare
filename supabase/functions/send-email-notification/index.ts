import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  to: string;
  subject: string;
  type: 'email_change' | 'account_deactivation';
  data?: {
    oldEmail?: string;
    newEmail?: string;
    userName?: string;
  };
}

const getEmailTemplate = (type: string, data: any) => {
  switch (type) {
    case 'email_change':
      return {
        subject: "Email Address Change Notification",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Email Address Change Confirmation</h2>
            <p>Hello ${data.userName || 'User'},</p>
            <p>This is to confirm that your email address has been successfully changed from:</p>
            <p><strong>From:</strong> ${data.oldEmail}</p>
            <p><strong>To:</strong> ${data.newEmail}</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>The Training Department Team</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `
      };
    case 'account_deactivation':
      return {
        subject: "Account Deactivation Confirmation",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Account Deactivation Notice</h2>
            <p>Hello ${data.userName || 'User'},</p>
            <p>This is to confirm that your account has been deactivated as requested.</p>
            <p>Your account is now inactive and you will no longer be able to access our services.</p>
            <p>If you would like to reactivate your account in the future, please contact our support team.</p>
            <p>Best regards,<br>The Training Department Team</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `
      };
    default:
      throw new Error('Invalid email type');
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: EmailNotificationRequest = await req.json();

    const template = getEmailTemplate(type, data);

    const emailResponse = await resend.emails.send({
      from: "The Training Department <noreply@insurancetraininghq.com>",
      to: [to],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
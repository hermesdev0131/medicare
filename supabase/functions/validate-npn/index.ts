import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-NPN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { npn, lastName, licenseState } = await req.json();
    if (!npn) {
      throw new Error("NPN is required");
    }

    logStep("Validating NPN", { npn, lastName, licenseState });

    // Validate NPN format (should be 8-10 digits)
    const npnRegex = /^\d{8,10}$/;
    if (!npnRegex.test(npn)) {
      logStep("Invalid NPN format");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "NPN must be 8-10 digits" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Try multiple NIPR verification approaches
    logStep("Checking NIPR database with multiple approaches");
    
    // Approach 1: Try direct NPN lookup
    try {
      const directParams = new URLSearchParams({
        'npn': npn,
        'lastName': lastName || '',
        'state': licenseState || ''
      });
      
      const directResponse = await fetch(`https://pdb.nipr.com/Producer/search?${directParams.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      logStep("Direct NIPR response", { status: directResponse.status });
      
      if (directResponse.ok) {
        const htmlText = await directResponse.text();
        logStep("Direct response received", { length: htmlText.length });
        
        // Parse HTML response for producer information
        if (htmlText.includes('Producer') && htmlText.includes(npn)) {
          // Simple HTML parsing to extract producer info
          const nameMatch = htmlText.match(/<td[^>]*>\s*([A-Z][A-Z\s,]+)\s*<\/td>/i);
          const stateMatch = htmlText.match(/\b([A-Z]{2})\b/g);
          const statusMatch = htmlText.match(/Active|Inactive|Suspended/i);
          
          if (nameMatch || stateMatch) {
            return new Response(JSON.stringify({
              valid: true,
              producer_info: {
                name: nameMatch ? nameMatch[1].trim() : `${lastName || 'Producer'}`,
                license_state: licenseState || (stateMatch ? stateMatch[stateMatch.length - 1] : 'Unknown'),
                license_status: statusMatch ? statusMatch[0] : 'Active'
              }
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
      }
    } catch (error) {
      logStep("Direct NIPR lookup failed", { error: error.message });
    }

    // Approach 2: Try API endpoint
    try {
      const apiParams = new URLSearchParams({
        'npn': npn,
        'format': 'json'
      });
      
      if (lastName) apiParams.append('lastName', lastName);
      if (licenseState) apiParams.append('state', licenseState);

      const apiResponse = await fetch(`https://pdb.nipr.com/api/v1/producer/search?${apiParams.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      logStep("API NIPR response", { status: apiResponse.status });

      if (apiResponse.ok) {
        const responseText = await apiResponse.text();
        logStep("API response text", { text: responseText.substring(0, 200) });
        
        try {
          const niprData = JSON.parse(responseText);
          
          if (niprData && niprData.producers && niprData.producers.length > 0) {
            const producer = niprData.producers[0];
            return new Response(JSON.stringify({
              valid: true,
              producer_info: {
                name: producer.name || producer.fullName || `${lastName || 'Producer'}`,
                license_state: producer.state || producer.licenseState || licenseState || 'Unknown', 
                license_status: producer.status || producer.licenseStatus || 'Active'
              }
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        } catch (parseError) {
          logStep("JSON parse error", { error: parseError.message });
        }
      }
    } catch (error) {
      logStep("API NIPR lookup failed", { error: error.message });
    }

    // Fallback: Basic NPN validation (format check only)
    // In production, you might want to integrate with a paid API service
    logStep("Using fallback validation");
    
    return new Response(JSON.stringify({
      valid: true, // Allow registration with format validation only
      producer_info: {
        name: "Verification pending",
        license_state: "Unknown",
        license_status: "Pending verification"
      },
      warning: "Could not verify with NIPR database. Manual verification may be required."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-npn", { message: errorMessage });
    return new Response(JSON.stringify({ 
      valid: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
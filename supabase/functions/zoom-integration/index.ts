import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZoomWebinarRequest {
  action: 'create' | 'update' | 'get' | 'list' | 'register';
  webinarData?: {
    topic: string;
    start_time: string;
    duration: number;
    agenda?: string;
    passcode?: string;
  };
  webinarId?: string;
  registrantData?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface ZoomAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomWebinarResponse {
  id: number;
  uuid: string;
  topic: string;
  agenda: string;
  start_time: string;
  duration: number;
  join_url: string;
  registration_url: string;
  passcode?: string;
}

class ZoomAPI {
  private accountId: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(accountId: string, clientId: string, clientSecret: string) {
    this.accountId = accountId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getAccessToken(): Promise<string> {
    console.log('Getting Zoom access token...');
    
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      console.log('Using cached access token');
      return this.accessToken;
    }

    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
    
    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: this.accountId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoom OAuth error:', errorText);
      throw new Error(`Failed to get Zoom access token: ${response.status} ${errorText}`);
    }

    const data: ZoomAccessTokenResponse = await response.json();
    console.log('Successfully obtained Zoom access token');
    
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // Refresh 5 minutes before expiry
    
    return this.accessToken;
  }

  async createWebinar(webinarData: ZoomWebinarRequest['webinarData']): Promise<ZoomWebinarResponse> {
    console.log('Creating Zoom webinar:', webinarData);
    
    const token = await this.getAccessToken();
    
    const payload = {
      topic: webinarData!.topic,
      type: 5, // Webinar
      start_time: webinarData!.start_time,
      duration: webinarData!.duration,
      agenda: webinarData!.agenda || '',
      settings: {
        host_video: true,
        panelists_video: false,
        practice_session: false,
        hd_video: true,
        approval_type: 0, // Automatically approve
        registration_type: 1, // Attendees register once and can attend any occurrence
        audio: 'both',
        auto_recording: 'cloud',
        enforce_login: false,
        enforce_login_domains: '',
        alternative_hosts: '',
        close_registration: false,
        show_share_button: true,
        allow_multiple_devices: false,
        on_demand: false,
        global_dial_in_countries: ['US'],
        contact_name: '',
        contact_email: '',
        registrants_email_notification: true,
        meeting_authentication: false,
        authentication_option: '',
        authentication_domains: '',
        authentication_name: '',
        show_share_button: true,
        allow_multiple_devices: false,
        registrants_confirmation_email: true,
        notify_registrants: true,
        post_webinar_survey: false,
        survey_url: '',
        registrants_restrict_number: 0,
        approval_type: 0,
        send_1080p_video_to_attendees: false
      }
    };

    if (webinarData!.passcode) {
      payload.settings.meeting_authentication = false;
    }

    const response = await fetch('https://api.zoom.us/v2/users/me/webinars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoom webinar creation error:', errorText);
      throw new Error(`Failed to create Zoom webinar: ${response.status} ${errorText}`);
    }

    const webinar: ZoomWebinarResponse = await response.json();
    console.log('Successfully created Zoom webinar:', webinar.id);
    
    return webinar;
  }

  async registerForWebinar(webinarId: string, registrantData: ZoomWebinarRequest['registrantData']): Promise<any> {
    console.log('Registering for Zoom webinar:', webinarId, registrantData);
    
    const token = await this.getAccessToken();
    
    const response = await fetch(`https://api.zoom.us/v2/webinars/${webinarId}/registrants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrantData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoom registration error:', errorText);
      throw new Error(`Failed to register for Zoom webinar: ${response.status} ${errorText}`);
    }

    const registrant = await response.json();
    console.log('Successfully registered for Zoom webinar');
    
    return registrant;
  }

  async getWebinar(webinarId: string): Promise<ZoomWebinarResponse> {
    console.log('Getting Zoom webinar:', webinarId);
    
    const token = await this.getAccessToken();
    
    const response = await fetch(`https://api.zoom.us/v2/webinars/${webinarId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoom get webinar error:', errorText);
      throw new Error(`Failed to get Zoom webinar: ${response.status} ${errorText}`);
    }

    const webinar: ZoomWebinarResponse = await response.json();
    console.log('Successfully retrieved Zoom webinar');
    
    return webinar;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Zoom credentials from secrets
    const zoomAccountId = Deno.env.get('ZOOM_ACCOUNT_ID');
    const zoomClientId = Deno.env.get('ZOOM_CLIENT_ID');
    const zoomClientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

    if (!zoomAccountId || !zoomClientId || !zoomClientSecret) {
      throw new Error('Zoom API credentials not configured');
    }

    const zoomAPI = new ZoomAPI(zoomAccountId, zoomClientId, zoomClientSecret);

    const { action, webinarData, webinarId, registrantData }: ZoomWebinarRequest = await req.json();
    console.log('Zoom integration request:', action);

    let result;

    switch (action) {
      case 'create':
        if (!webinarData) {
          throw new Error('Webinar data is required for creation');
        }
        result = await zoomAPI.createWebinar(webinarData);
        break;

      case 'register':
        if (!webinarId || !registrantData) {
          throw new Error('Webinar ID and registrant data are required for registration');
        }
        result = await zoomAPI.registerForWebinar(webinarId, registrantData);
        break;

      case 'get':
        if (!webinarId) {
          throw new Error('Webinar ID is required');
        }
        result = await zoomAPI.getWebinar(webinarId);
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in zoom-integration function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
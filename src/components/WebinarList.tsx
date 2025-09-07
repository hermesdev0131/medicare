import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, ExternalLink, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  instructor_name?: string | null;
  presenter_name?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees?: number | null;
  meeting_url?: string | null;
  is_published: boolean;
  zoom_webinar_id?: string | null;
  zoom_join_url?: string | null;
  zoom_passcode?: string | null;
  zoom_registration_url?: string | null;
  zoom_created?: boolean;
  access_type?: string;
  registration?: {
    id: string;
    registered_at: string;
    attended: boolean;
  } | null;
  _count?: {
    registrations: number;
  };
}

const WebinarList = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isSubscribed } = useAuth();

  useEffect(() => {
    loadWebinars();
  }, []);

  const loadWebinars = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get published webinars with registration status
      const { data: webinarsData, error: webinarsError } = await supabase
        .from('webinars')
        .select(`
          *,
          webinar_registrations!left (
            id,
            registered_at,
            attended
          )
        `)
        .eq('is_published', true)
        .eq('webinar_registrations.user_id', user.id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (webinarsError) throw webinarsError;

      // Get registration counts for each webinar
      const webinarIds = webinarsData?.map(w => w.id) || [];
      const { data: registrationCounts } = await supabase
        .from('webinar_registrations')
        .select('webinar_id')
        .in('webinar_id', webinarIds);

      const formattedWebinars = webinarsData?.map(webinar => {
        const registrationCount = registrationCounts?.filter(r => r.webinar_id === webinar.id).length || 0;
        return {
          ...webinar,
          registration: webinar.webinar_registrations?.[0] || null,
          _count: { registrations: registrationCount }
        };
      }) || [];

      setWebinars(formattedWebinars);
    } catch (error: any) {
      console.error('Error loading webinars:', error);
      toast({
        title: "Error",
        description: "Failed to load webinars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registerForWebinar = async (webinarId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for Zoom registration
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

// Find the webinar to check access and integration
const webinar = webinars.find(w => w.id === webinarId);

// Gate subscribers-only webinars
if (webinar?.access_type === 'subscribers' && !isSubscribed) {
  toast({
    title: "Subscribers only",
    description: "This webinar is for subscribers. View plans to get access.",
  });
  return;
}

// Register in our database first
const { error } = await supabase
  .from('webinar_registrations')
  .insert({
    webinar_id: webinarId,
    user_id: user.id
  });

if (error) throw error;

      // If webinar has Zoom integration, register with Zoom too
      if (webinar?.zoom_webinar_id && profile) {
        try {
          await supabase.functions.invoke('zoom-integration', {
            body: {
              action: 'register',
              webinarId: webinar.zoom_webinar_id,
              registrantData: {
                email: profile.email,
                first_name: profile.first_name || '',
                last_name: profile.last_name || ''
              }
            }
          });
          
          toast({
            title: "Success",
            description: "Registered for webinar with Zoom integration!",
          });
        } catch (zoomError) {
          console.error('Zoom registration error:', zoomError);
          toast({
            title: "Partial Success",
            description: "Registered locally but Zoom registration failed. You can still join manually.",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Successfully registered for webinar",
        });
      }
      
      loadWebinars(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to register for webinar",
        variant: "destructive",
      });
    }
  };

  const joinWebinar = (meetingUrl: string) => {
    window.open(meetingUrl, '_blank');
  };

  const isWebinarStartingSoon = (scheduledAt: string) => {
    const webinarTime = new Date(scheduledAt);
    const now = new Date();
    const timeDiff = webinarTime.getTime() - now.getTime();
    return timeDiff <= 30 * 60 * 1000 && timeDiff > 0; // Within 30 minutes
  };

  const isWebinarLive = (scheduledAt: string, durationMinutes: number) => {
    const webinarStart = new Date(scheduledAt);
    const webinarEnd = new Date(webinarStart.getTime() + durationMinutes * 60 * 1000);
    const now = new Date();
    return now >= webinarStart && now <= webinarEnd;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Webinars</h2>
        <Badge variant="secondary" className="text-sm">
          {webinars.length} upcoming webinars
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {webinars.map((webinar) => {
          const isLive = isWebinarLive(webinar.scheduled_at, webinar.duration_minutes);
          const isStartingSoon = isWebinarStartingSoon(webinar.scheduled_at);
          const spotsRemaining = webinar.max_attendees ? webinar.max_attendees - (webinar._count?.registrations || 0) : null;

          return (
            <Card key={webinar.id} className={`hover:shadow-lg transition-shadow ${isLive ? 'ring-2 ring-red-500' : isStartingSoon ? 'ring-2 ring-yellow-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
{isLive && (
  <Badge className="bg-red-500 text-white animate-pulse">
    LIVE NOW
  </Badge>
)}
{!isLive && isStartingSoon && (
  <Badge className="bg-yellow-500 text-white">
    Starting Soon
  </Badge>
)}
{spotsRemaining !== null && spotsRemaining <= 10 && spotsRemaining > 0 && (
  <Badge variant="outline" className="text-orange-600">
    {spotsRemaining} spots left
  </Badge>
)}
{webinar.access_type === 'subscribers' ? (
  <Badge variant="outline">Subscribers Only</Badge>
) : (
  <Badge variant="outline">Free</Badge>
)}
                </div>
                <CardTitle className="text-lg">{webinar.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {webinar.description || 'No description available'}
                </p>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(webinar.scheduled_at), 'MMM d')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(webinar.scheduled_at), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{webinar.instructor_name || webinar.presenter_name || 'Instructor'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span>{webinar.duration_minutes}min</span>
                    </div>
                  </div>

                  {webinar.zoom_created && (
                    <div className="flex items-center justify-center">
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Zoom Integrated
                      </Badge>
                    </div>
                  )}

                  {webinar.zoom_webinar_id && webinar.zoom_passcode && (
                    <div className="text-xs text-center text-muted-foreground">
                      Webinar ID: {webinar.zoom_webinar_id} | Passcode: {webinar.zoom_passcode}
                    </div>
                  )}

{webinar.registration ? (
  <div className="space-y-2">
    <Badge variant="secondary" className="w-full justify-center">
      Registered
    </Badge>
     {(isLive || isStartingSoon) && (webinar.zoom_join_url || webinar.meeting_url) && (
      <Button 
        className="w-full" 
        size="sm"
        onClick={() => joinWebinar(webinar.zoom_join_url || webinar.meeting_url!)}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        {webinar.zoom_created ? 'Join Zoom Webinar' : 'Join Webinar'}
      </Button>
    )}
  </div>
) : null}
{!webinar.registration && (
  <Button 
    className="w-full" 
    size="sm"
    onClick={() => registerForWebinar(webinar.id)}
    disabled={spotsRemaining === 0 || (webinar.access_type === 'subscribers' && !isSubscribed)}
  >
    <Video className="h-4 w-4 mr-2" />
    {webinar.access_type === 'subscribers' && !isSubscribed
      ? 'Subscribers Only'
      : (spotsRemaining === 0 ? 'Full' : 'Register')}
  </Button>
)}

                  {webinar._count?.registrations && (
                    <p className="text-xs text-muted-foreground text-center">
                      {webinar._count.registrations} registered
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {webinars.length === 0 && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No upcoming webinars scheduled.</p>
        </div>
      )}
    </div>
  );
};

export default WebinarList;
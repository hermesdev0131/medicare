import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Plus, Users, Calendar, Clock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  presenter_name: string | null;
  presenter_bio: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees: number | null;
  meeting_url: string | null;
  is_published: boolean;
  registration_count: number;
  category: string | null;
  created_at: string;
  zoom_webinar_id: string | null;
  zoom_join_url: string | null;
  zoom_passcode: string | null;
  zoom_registration_url: string | null;
  zoom_meeting_uuid: string | null;
  recording_urls: any;
  zoom_created: boolean;
  access_type?: string;
}

const FacilitatorDashboard = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

const [newWebinar, setNewWebinar] = useState({
  title: "",
  description: "",
  presenter_name: "",
  presenter_bio: "",
  scheduled_at: "",
  duration_minutes: 60,
  max_attendees: 100,
  meeting_url: "",
  category: "",
  access_type: 'free',
  create_zoom_webinar: true,
  passcode: ""
});

  useEffect(() => {
    loadWebinars();
  }, []);

  const loadWebinars = async () => {
    try {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setWebinars(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load webinars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWebinar = async () => {
    try {
      setCreating(true);
      
let webinarData: any = {
  title: newWebinar.title,
  description: newWebinar.description,
  presenter_name: newWebinar.presenter_name,
  presenter_bio: newWebinar.presenter_bio,
  scheduled_at: new Date(newWebinar.scheduled_at).toISOString(),
  duration_minutes: newWebinar.duration_minutes,
  max_attendees: newWebinar.max_attendees,
  meeting_url: newWebinar.meeting_url,
  category: newWebinar.category,
  access_type: newWebinar.access_type,
  is_published: false,
  zoom_created: false
};

      // Create Zoom webinar if requested
      if (newWebinar.create_zoom_webinar) {
        try {
          const { data: zoomData, error: zoomError } = await supabase.functions.invoke('zoom-integration', {
            body: {
              action: 'create',
              webinarData: {
                topic: newWebinar.title,
                start_time: new Date(newWebinar.scheduled_at).toISOString(),
                duration: newWebinar.duration_minutes,
                agenda: newWebinar.description || '',
                passcode: newWebinar.passcode || undefined
              }
            }
          });

          if (zoomError) {
            console.error('Zoom integration error:', zoomError);
            toast({
              title: "Warning",
              description: "Webinar created but Zoom integration failed. You can add the meeting URL manually.",
              variant: "destructive",
            });
          } else if (zoomData) {
            // Update webinar data with Zoom information
            webinarData = {
              ...webinarData,
              zoom_webinar_id: zoomData.id.toString(),
              zoom_join_url: zoomData.join_url,
              zoom_registration_url: zoomData.registration_url,
              zoom_passcode: zoomData.passcode,
              zoom_meeting_uuid: zoomData.uuid,
              meeting_url: zoomData.join_url,
              zoom_created: true
            };

            toast({
              title: "Success",
              description: "Webinar created with Zoom integration!",
            });
          }
        } catch (zoomError: any) {
          console.error('Zoom integration error:', zoomError);
          toast({
            title: "Warning",
            description: "Webinar will be created but Zoom integration failed. You can add the meeting URL manually.",
            variant: "destructive",
          });
        }
      }

      const { error } = await supabase
        .from('webinars')
        .insert(webinarData);

      if (error) throw error;

      if (!newWebinar.create_zoom_webinar || !webinarData.zoom_created) {
        toast({
          title: "Success",
          description: "Webinar created successfully",
        });
      }

setNewWebinar({
  title: "",
  description: "",
  presenter_name: "",
  presenter_bio: "",
  scheduled_at: "",
  duration_minutes: 60,
  max_attendees: 100,
  meeting_url: "",
  category: "",
  access_type: 'free',
  create_zoom_webinar: true,
  passcode: ""
});
      setIsCreateDialogOpen(false);
      loadWebinars();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create webinar",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const togglePublishWebinar = async (webinarId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('webinars')
        .update({ is_published: !currentStatus })
        .eq('id', webinarId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Webinar ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });
      loadWebinars();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update webinar status",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'MMM d, yyyy h:mm a');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Facilitator Dashboard</h1>
            <p className="text-muted-foreground">Create and manage webinar events for insurance agents</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Webinar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Webinar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Webinar Title</label>
                  <Input
                    value={newWebinar.title}
                    onChange={(e) => setNewWebinar({ ...newWebinar, title: e.target.value })}
                    placeholder="Enter webinar title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newWebinar.description}
                    onChange={(e) => setNewWebinar({ ...newWebinar, description: e.target.value })}
                    placeholder="Enter webinar description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Presenter Name</label>
                    <Input
                      value={newWebinar.presenter_name}
                      onChange={(e) => setNewWebinar({ ...newWebinar, presenter_name: e.target.value })}
                      placeholder="Enter presenter name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newWebinar.category} onValueChange={(value) => setNewWebinar({ ...newWebinar, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="life-insurance">Life Insurance</SelectItem>
                        <SelectItem value="health-insurance">Health Insurance</SelectItem>
                        <SelectItem value="property-casualty">Property & Casualty</SelectItem>
                        <SelectItem value="annuities">Annuities</SelectItem>
                        <SelectItem value="medicare">Medicare</SelectItem>
                        <SelectItem value="sales-training">Sales Training</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
<div>
  <label className="text-sm font-medium">Access Type</label>
  <Select value={newWebinar.access_type} onValueChange={(value) => setNewWebinar({ ...newWebinar, access_type: value as 'free' | 'subscribers' })}>
    <SelectTrigger>
      <SelectValue placeholder="Select access type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="free">Free (All users)</SelectItem>
      <SelectItem value="subscribers">Subscribers only</SelectItem>
    </SelectContent>
  </Select>
</div>
<div>
  <label className="text-sm font-medium">Presenter Bio</label>
  <Textarea
    value={newWebinar.presenter_bio}
    onChange={(e) => setNewWebinar({ ...newWebinar, presenter_bio: e.target.value })}
    placeholder="Enter presenter bio"
    rows={2}
  />
</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Scheduled Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={newWebinar.scheduled_at}
                      onChange={(e) => setNewWebinar({ ...newWebinar, scheduled_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      min="15"
                      step="15"
                      value={newWebinar.duration_minutes}
                      onChange={(e) => setNewWebinar({ ...newWebinar, duration_minutes: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Attendees</label>
                    <Input
                      type="number"
                      min="1"
                      value={newWebinar.max_attendees}
                      onChange={(e) => setNewWebinar({ ...newWebinar, max_attendees: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create_zoom"
                      checked={newWebinar.create_zoom_webinar}
                      onCheckedChange={(checked) => setNewWebinar({ ...newWebinar, create_zoom_webinar: !!checked })}
                    />
                    <label htmlFor="create_zoom" className="text-sm font-medium flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-blue-500" />
                      Create Zoom Webinar Automatically
                    </label>
                  </div>
                  
                  {newWebinar.create_zoom_webinar && (
                    <div>
                      <label className="text-sm font-medium">Passcode (Optional)</label>
                      <Input
                        value={newWebinar.passcode}
                        onChange={(e) => setNewWebinar({ ...newWebinar, passcode: e.target.value })}
                        placeholder="Enter webinar passcode (optional)"
                      />
                    </div>
                  )}
                  
                  {!newWebinar.create_zoom_webinar && (
                    <div>
                      <label className="text-sm font-medium">Meeting URL (Zoom/Teams Link)</label>
                      <Input
                        value={newWebinar.meeting_url}
                        onChange={(e) => setNewWebinar({ ...newWebinar, meeting_url: e.target.value })}
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWebinar} disabled={creating || !newWebinar.title || !newWebinar.scheduled_at}>
                    {creating ? "Creating..." : "Create Webinar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="webinars">My Webinars</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Webinars</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{webinars.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{webinars.filter(w => w.is_published).length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{webinars.reduce((sum, w) => sum + w.registration_count, 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {webinars.filter(w => new Date(w.scheduled_at) > new Date()).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webinars" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webinars.map((webinar) => (
                <Card key={webinar.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
<div className="flex items-start justify-between">
  <CardTitle className="text-lg line-clamp-2">{webinar.title}</CardTitle>
  <div className="flex flex-col items-end gap-1">
    <Badge variant={webinar.is_published ? "default" : "secondary"}>
      {webinar.is_published ? "Published" : "Draft"}
    </Badge>
    {webinar.access_type === 'subscribers' ? (
      <Badge variant="outline">Subscribers Only</Badge>
    ) : (
      <Badge variant="outline">Free</Badge>
    )}
  </div>
</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {webinar.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      {webinar.presenter_name && (
                        <div className="flex items-center">
                          <span className="font-medium">Presenter:</span>
                          <span className="ml-2">{webinar.presenter_name}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="font-medium">Date:</span>
                        <span className="ml-2">{formatDateTime(webinar.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Duration:</span>
                        <span className="ml-2">{webinar.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Registrations:</span>
                        <span className="ml-2">{webinar.registration_count}</span>
                      </div>
                      {webinar.zoom_created && (
                        <div className="flex items-center">
                          <Zap className="h-3 w-3 text-blue-500 mr-1" />
                          <span className="text-blue-600 text-xs font-medium">Zoom Integrated</span>
                        </div>
                      )}
                      {webinar.zoom_webinar_id && (
                        <div className="flex items-center">
                          <span className="font-medium">Webinar ID:</span>
                          <span className="ml-2 font-mono text-xs">{webinar.zoom_webinar_id}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => togglePublishWebinar(webinar.id, webinar.is_published)}
                      >
                        {webinar.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {webinars.length === 0 && (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No webinars created yet. Create your first webinar to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webinar Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <div className="w-full bg-slate-900 py-6 shadow-xl border-t border-slate-800 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-slate-300 font-medium">
              © 2024 Insurance Training HQ. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilitatorDashboard;
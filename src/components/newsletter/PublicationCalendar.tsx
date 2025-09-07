import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Eye, Edit } from "lucide-react";
import { toast } from "sonner";

interface ScheduledPost {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  visibility: string;
  content_type: string;
}

export function PublicationCalendar() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_posts' as any)
        .select('id, title, status, published_at, visibility, content_type')
        .in('status', ['scheduled', 'published'])
        .order('published_at', { ascending: true });

      if (error) throw error;
      setScheduledPosts((data as any) || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast.error('Failed to load publication calendar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'scheduled': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupPostsByDate = (posts: ScheduledPost[]) => {
    const grouped: { [key: string]: ScheduledPost[] } = {};
    
    posts.forEach(post => {
      if (post.published_at) {
        const date = new Date(post.published_at).toDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(post);
      }
    });

    return grouped;
  };

  const groupedPosts = groupPostsByDate(scheduledPosts);
  const sortedDates = Object.keys(groupedPosts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading publication calendar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Publication Calendar</CardTitle>
              <CardDescription>
                Schedule and manage your newsletter publishing timeline
              </CardDescription>
            </div>
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Newsletter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Newsletter</DialogTitle>
                  <DialogDescription>
                    Choose a date and time to publish your newsletter
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="schedule-date" className="text-right">
                      Date & Time
                    </Label>
                    <Input
                      id="schedule-date"
                      type="datetime-local"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => {
                    toast.success('Newsletter scheduling functionality would be implemented here');
                    setShowScheduleDialog(false);
                  }}>
                    Schedule Newsletter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar View */}
          <div className="space-y-4">
            {sortedDates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled newsletters found.</p>
                <p className="text-sm">Schedule your first newsletter to get started.</p>
              </div>
            ) : (
              sortedDates.map(date => (
                <Card key={date} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedPosts[date].map(post => (
                      <div key={post.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{post.title}</h4>
                            <Badge variant={getStatusColor(post.status) as any}>
                              {post.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(post.published_at)} • {post.content_type}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">
                {scheduledPosts.filter(p => p.status === 'scheduled').length}
              </div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">
                {scheduledPosts.filter(p => p.status === 'published' && 
                  p.published_at && new Date(p.published_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">Published This Week</div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">
                {scheduledPosts.filter(p => p.status === 'published').length}
              </div>
              <div className="text-sm text-muted-foreground">Total Published</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
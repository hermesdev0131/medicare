import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthorPostForm from "@/components/content/AuthorPostForm";
import AuthorPostsList from "@/components/content/AuthorPostsList";
import { SubscriberManagement } from "@/components/newsletter/SubscriberManagement";
import { NewsletterAnalytics } from "@/components/newsletter/NewsletterAnalytics";
import { ContentLibrary } from "@/components/newsletter/ContentLibrary";
import { PublicationCalendar } from "@/components/newsletter/PublicationCalendar";
import { PenTool, Users, BarChart3, FileText, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalSubscribers: number;
}

export default function AuthorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    totalSubscribers: 0
  });
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch posts stats
      const { data: posts, error: postsError } = await supabase
        .from('content_posts' as any)
        .select('status')
        .eq('author_id', user?.id);

      if (postsError) throw postsError;

      // Fetch subscriber count
      const { count: subscriberCount, error: subscribersError } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);

      if (subscribersError) throw subscribersError;

      const totalPosts = posts?.length || 0;
      const publishedPosts = (posts as any)?.filter((p: any) => p.status === 'published').length || 0;
      const draftPosts = (posts as any)?.filter((p: any) => p.status === 'draft').length || 0;
      const scheduledPosts = (posts as any)?.filter((p: any) => p.status === 'scheduled').length || 0;

      setStats({
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        totalSubscribers: subscriberCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    setShowNewPostForm(false);
    fetchDashboardStats();
  };

  if (!user) {
    return <div>Please log in to access the author dashboard.</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Author Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your newsletters, content, and subscribers
          </p>
        </div>
        <Button 
          onClick={() => setShowNewPostForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Newsletter
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Badge variant="default" className="h-4 w-4 rounded-full p-0"></Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 rounded-full p-0"></Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Badge variant="outline" className="h-4 w-4 rounded-full p-0"></Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
          </CardContent>
        </Card>
      </div>

      {/* New Post Form Modal */}
      {showNewPostForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Newsletter</CardTitle>
            <CardDescription>
              Write and publish your newsletter content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthorPostForm />
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <AuthorPostsList />
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <SubscriberManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <NewsletterAnalytics />
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <ContentLibrary />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <PublicationCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
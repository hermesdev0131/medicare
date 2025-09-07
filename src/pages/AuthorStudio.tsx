import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenTool, Users, BarChart3, FileText, Calendar, Plus, Eye, Edit, Settings } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthorPostForm from '@/components/content/AuthorPostForm';
import AuthorPostsList from '@/components/content/AuthorPostsList';
import { SubscriberManagement } from '@/components/newsletter/SubscriberManagement';
import { NewsletterAnalytics } from '@/components/newsletter/NewsletterAnalytics';
import { ContentLibrary } from '@/components/newsletter/ContentLibrary';
import { PublicationCalendar } from '@/components/newsletter/PublicationCalendar';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalSubscribers: number;
}

const AuthorStudio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    totalSubscribers: 0
  });
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // Load profile and roles
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_roles').select('role').eq('user_id', user.id)
      ]);

      setProfile(profileRes.data);
      setUserRoles(rolesRes.data?.map((r: any) => r.role) || []);
      setLoading(false);
      
      // Load dashboard stats
      await fetchDashboardStats(user.id);
    };

    getUser();
  }, [navigate]);

  const fetchDashboardStats = async (userId: string) => {
    try {
      // Fetch posts stats
      const { data: posts, error: postsError } = await supabase
        .from('content_posts' as any)
        .select('status')
        .eq('author_id', userId);

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
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    }
  };

  const handlePostCreated = () => {
    setShowNewPostForm(false);
    if (user) {
      fetchDashboardStats(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has author role
  const isAuthor = userRoles.includes('author') || userRoles.includes('admin');

  if (!isAuthor) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the Author Studio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer currentPage="Author Studio" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Author Studio</h1>
            <p className="text-muted-foreground">
              Create, manage, and publish your newsletters and articles
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Welcome,</span>
              <Badge variant="secondary" className="capitalize">
                {profile?.first_name || 'Author'}
              </Badge>
            </div>
          </div>
          <Button 
            onClick={() => setShowNewPostForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
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
              <CardTitle>Create New Article</CardTitle>
              <CardDescription>
                Write and publish your newsletter content or blog article
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthorPostForm />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                  Cancel
                </Button>
              </div>
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

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => navigate('/newsletter-archive')}>
                <Eye className="h-4 w-4 mr-2" />
                View Public Archive
              </Button>
              <Button variant="outline" onClick={() => navigate('/content-creator')}>
                <Edit className="h-4 w-4 mr-2" />
                Creator Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile')}>
                <Users className="h-4 w-4 mr-2" />
                Manage Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer currentPage="Author Studio" />
    </div>
  );
};

export default AuthorStudio;
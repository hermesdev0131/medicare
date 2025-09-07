import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Award, 
  TrendingUp, 
  FileText,
  Video,
  Users,
  Clock,
  CheckCircle,
  Star,
  LogOut,
  PlayCircle,
  Crown,
  Lock,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import AEPCountdown from "@/components/AEPCountdown";
import EnhancedCourseList from "@/components/course/EnhancedCourseList";
import WebinarList from "@/components/WebinarList";
import { NewsletterFeed } from "@/components/content/NewsletterFeed";
import Footer from "@/components/Footer";

interface UserProgress {
  total_courses: number;
  completed_courses: number;
  active_enrollments: number;
  total_hours_completed: number;
}

const AgentResourceHQ = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isSubscribed, subscriptionTier } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    total_courses: 0,
    completed_courses: 0,
    active_enrollments: 0,
    total_hours_completed: 0
  });
  const [loading, setLoading] = useState(true);

  // Load profile and progress when user is available
  useEffect(() => {
    if (user) {
      loadProfile(user.id);
      loadUserProgress();
    }
  }, [user]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's course enrollments and progress
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses(estimated_duration_hours)
        `)
        .eq('user_id', user.id);

      if (enrollmentsError) throw enrollmentsError;

      const totalCourses = enrollments?.length || 0;
      const completedCourses = enrollments?.filter(e => e.completed_at).length || 0;
      const activeEnrollments = enrollments?.filter(e => !e.completed_at).length || 0;

      // Calculate total hours completed (approximation)
      const totalHours = enrollments?.reduce((sum, enrollment) => {
        if (enrollment.completed_at) {
          const courseHours = enrollment.courses?.estimated_duration_hours || 1;
          return sum + courseHours;
        }
        return sum;
      }, 0) || 0;

      setUserProgress({
        total_courses: totalCourses,
        completed_courses: completedCourses,
        active_enrollments: activeEnrollments,
        total_hours_completed: totalHours
      });
    } catch (error: any) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    return `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase();
  };

  const getTierDisplayName = () => {
    if (!subscriptionTier) return 'Free';
    return subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);
  };

  const getTierColor = () => {
    switch (subscriptionTier) {
      case 'core': return 'bg-blue-500';
      case 'enhanced': return 'bg-purple-500';
      case 'premium': return 'bg-amber-500';
      case 'business': return 'bg-slate-800';
      default: return 'bg-gray-500';
    }
  };

  const hasFeatureAccess = (requiredTier: string | null = null) => {
    if (!requiredTier) return true;
    if (!isSubscribed) return false;
    
    const tierHierarchy = { core: 1, enhanced: 2, premium: 3, business: 4 };
    const userLevel = tierHierarchy[subscriptionTier as keyof typeof tierHierarchy] || 0;
    const requiredLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden flex flex-col">
      <Navigation />
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/20 to-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"></div>

      {/* User Profile Section */}
      <div className="relative z-10 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <Badge className={`${getTierColor()} text-white text-xs`}>
                  <Crown className="mr-1 h-3 w-3" />
                  {getTierDisplayName()}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile?.position_title || 'Insurance Agent'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Agent Resource HQ
          </h1>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto">
            Your comprehensive platform for professional development, training resources, and industry insights.
          </p>
        </div>

        {/* AEP Countdown */}
        <div className="mb-8">
          <AEPCountdown />
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{userProgress.total_courses}</div>
              <p className="text-xs text-muted-foreground">
                {userProgress.active_enrollments} in progress
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{userProgress.completed_courses}</div>
              <p className="text-xs text-muted-foreground">
                Courses finished
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Hours</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{userProgress.total_hours_completed}</div>
              <p className="text-xs text-muted-foreground">
                Hours completed
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achievement</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {userProgress.completed_courses > 0 ? Math.round((userProgress.completed_courses / Math.max(userProgress.total_courses, 1)) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Learning Platform */}
        <div className="mb-8">
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Learning Center
              </TabsTrigger>
              <TabsTrigger value="webinars">
                <Video className="h-4 w-4 mr-2" />
                Live Training
              </TabsTrigger>
              <TabsTrigger value="resources">
                <FileText className="h-4 w-4 mr-2" />
                Resource Library
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses" className="mt-6">
              <EnhancedCourseList />
            </TabsContent>
            
            <TabsContent value="webinars" className="mt-6">
              <WebinarList />
            </TabsContent>
            
            <TabsContent value="resources" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Newsletter Feed */}
                <div className="lg:col-span-2">
                  <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span>Latest Updates & Articles</span>
                      </CardTitle>
                      <CardDescription>Industry news, newsletters, and educational content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <NewsletterFeed userType="paid" maxItems={8} />
                    </CardContent>
                  </Card>
                </div>

                {/* Resource Library */}
                <div>
                  <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span>Medicare Knowledge Center</span>
                      </CardTitle>
                      <CardDescription>Resources, compliance guides, and licensing information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Free Medicare Resources */}
                        <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Medicare Basics Guide</p>
                            <p className="text-sm text-muted-foreground">Parts A, B, C, D overview</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">CMS Marketing Guidelines</p>
                            <p className="text-sm text-muted-foreground">Current compliance requirements</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Licensing Requirements</p>
                            <p className="text-sm text-muted-foreground">State-by-state requirements</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Upcoming Events */}
        <div className="mt-8">
          <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span>Upcoming Events & Deadlines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">CE Credit Deadline</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Complete 15 more credits by Dec 31, 2024</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Video className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600">Live Training</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Advanced Sales Techniques - Jan 15, 2024</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">Certification</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Life Insurance Specialist exam available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer currentPage="Agent Resource HQ" />
    </div>
  );
};

export default AgentResourceHQ;
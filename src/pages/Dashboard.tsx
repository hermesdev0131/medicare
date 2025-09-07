import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Users, TrendingUp, Star, Clock, ArrowRight, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AILearningAssistant } from '@/components/course/AILearningAssistant';
import { NewsletterFeed } from '@/components/content/NewsletterFeed';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isSubscribed, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Load profile
    const loadProfile = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProfile(profileData);
    };

    loadProfile();
  }, [user, navigate]);

  // Redirect if user has subscription or is admin
  useEffect(() => {
    if (!authLoading && (isSubscribed || user)) {
      // Check if user is admin
      const checkAdminStatus = async () => {
        if (user) {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          const roles = rolesData?.map(r => r.role) || [];
          const isAdmin = roles.includes('admin');
          
          if (isSubscribed || isAdmin) {
            navigate('/agent-hq');
          }
        }
      };
      
      checkAdminStatus();
    }
  }, [isSubscribed, authLoading, navigate, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const freeResources = [
    {
      title: "Medicare Basics Guide",
      type: "PDF Guide",
      description: "Essential overview of Medicare fundamentals",
      duration: "15 min read"
    },
    {
      title: "AEP Preparation Checklist", 
      type: "Checklist",
      description: "Key steps to prepare for Annual Election Period",
      duration: "10 min read"
    }
  ];

  const sampleCourses = [
    {
      title: "Introduction to Medicare Advantage",
      description: "Learn the basics of Medicare Advantage plans and how they work",
      duration: "30 minutes",
      level: "Beginner",
      enrolled: 1247
    },
    {
      title: "Compliance Fundamentals",
      description: "Essential compliance knowledge for Medicare insurance agents", 
      duration: "45 minutes",
      level: "Intermediate",
      enrolled: 892
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Welcome Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-primary rounded-full p-3">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}!
              </h1>
              <p className="text-muted-foreground">Free Member Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upgrade Banner */}
        <Card className="bg-gradient-primary text-primary-foreground mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Unlock Premium Content</h2>
                <p className="opacity-90">
                  Get access to 50+ courses, live webinars, and exclusive resources
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="bg-primary-foreground text-primary hover:bg-primary-glow"
                onClick={() => navigate('/pricing')}
              >
                View Plans <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Resources</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{freeResources.length}</div>
              <p className="text-xs text-muted-foreground">Available now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sample Courses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sampleCourses.length}</div>
              <p className="text-xs text-muted-foreground">Preview available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Content</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">50+</div>
              <p className="text-xs text-muted-foreground">
                <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/pricing')}>
                  Upgrade to unlock
                </Button>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Learning Assistant */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-primary" />
                  AI Learning Assistant
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10">
                  Free Preview
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <div className="bg-primary/5 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Personalized Learning Insights</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Get AI-powered learning recommendations, study plans, and progress insights tailored to your learning style.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => navigate('/pricing')} className="min-w-[120px]">
                    Unlock AI Features
                  </Button>
                  <Button variant="outline" onClick={() => {
                    // For demo purposes, show limited version
                    toast({
                      title: "AI Assistant Demo",
                      description: "This feature is available to premium members. Upgrade to unlock personalized insights!",
                    });
                  }}>
                    Try Demo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Newsletter Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Latest Updates & Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NewsletterFeed userType="free" maxItems={5} />
              </CardContent>
            </Card>
          </div>

          {/* Resources & Course Previews */}
          <div className="space-y-6">
            {/* Free Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Free Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {freeResources.map((resource, index) => (
                  <div key={index} className="p-3 bg-secondary rounded-lg">
                    <h3 className="font-medium text-sm">{resource.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {resource.duration}
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sample Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-base">
                    <Users className="mr-2 h-4 w-4" />
                    Course Previews
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleCourses.slice(0, 2).map((course, index) => (
                  <div key={index} className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm">{course.title}</h3>
                      <Badge variant="outline" className="text-xs">{course.level}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{course.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {course.duration}
                        </div>
                      </div>
                      <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/pricing')}>
                        Unlock
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/pricing')}>
                  View All Courses <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ready to Accelerate Your Career?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of Medicare insurance professionals who trust The Training Department 
              for comprehensive education and ongoing support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button size="lg" onClick={() => navigate('/pricing')}>
                View Premium Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/contact')}>
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer currentPage="Free Member Dashboard" />
    </div>
  );
};

export default Dashboard;
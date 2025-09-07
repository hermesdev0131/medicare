import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  BarChart3, Users, Clock, TrendingUp, TrendingDown, Eye, CheckCircle,
  AlertCircle, Download, Calendar, BookOpen, Target, Award, Activity,
  Mail, Video, Database, Shield, Zap, Globe, UserCheck, FileText,
  PlayCircle, Brain, MessageSquare, PieChart, LineChart, Settings
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalEnrollments: number;
    totalCompletions: number;
    totalRevenue: number;
    avgEngagementTime: number;
    userGrowthRate: number;
  };
  learning: {
    courseCompletionRate: number;
    avgTimeToCompletion: number;
    mostPopularCourses: Array<{ title: string; enrollments: number; completion: number }>;
    dropoffPoints: Array<{ point: string; percentage: number }>;
    learningPaths: Array<{ name: string; completions: number; avgTime: number }>;
  };
  content: {
    newsletterEngagement: number;
    mostViewedContent: Array<{ title: string; views: number; engagement: number }>;
    contentPerformance: Array<{ type: string; count: number; avgRating: number }>;
    publishingTrends: Array<{ date: string; published: number; views: number }>;
  };
  userBehavior: {
    sessionDuration: number;
    bounceRate: number;
    peakHours: string[];
    deviceBreakdown: Array<{ device: string; percentage: number }>;
    userJourney: Array<{ step: string; users: number; conversion: number }>;
  };
  webinars: {
    totalWebinars: number;
    avgAttendance: number;
    registrationRate: number;
    completionRate: number;
    upcomingWebinars: Array<{ title: string; date: string; registered: number }>;
  };
  systemHealth: {
    uptime: number;
    avgResponseTime: number;
    errorRate: number;
    activeUsers: number;
    databaseSize: string;
    apiCalls: number;
  };
}

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Check access permissions
  useEffect(() => {
    checkAccess();
  }, []);

  // Load analytics data when access is confirmed
  useEffect(() => {
    if (hasAccess) {
      loadAnalytics();
    }
  }, [hasAccess, timeRange]);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has analyst or admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['analyst', 'admin']);

      if (error || !roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You need analyst or admin privileges to view this dashboard",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setHasAccess(true);
    } catch (error: any) {
      console.error('Error checking access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Load all analytics data from various tables
      const [
        { data: profiles },
        { data: enrollments },
        { data: courses },
        { data: contentPosts },
        { data: webinars },
        { data: webinarRegistrations },
        { data: lessonProgress }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('course_enrollments').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('content_posts').select('*'),
        supabase.from('webinars').select('*'),
        supabase.from('webinar_registrations').select('*'),
        supabase.from('lesson_progress').select('*')
      ]);

      // Calculate analytics
      const totalUsers = profiles?.length || 0;
      const totalEnrollments = enrollments?.length || 0;
      const completedEnrollments = enrollments?.filter(e => e.completed_at)?.length || 0;
      const totalCourses = courses?.length || 0;
      const publishedContent = contentPosts?.filter(p => p.status === 'published')?.length || 0;
      const totalWebinars = webinars?.length || 0;
      const totalRegistrations = webinarRegistrations?.length || 0;

      // Mock some complex calculations for demo
      const analyticsData: AnalyticsData = {
        overview: {
          totalUsers,
          totalEnrollments,
          totalCompletions: completedEnrollments,
          totalRevenue: 45680, // Mock revenue
          avgEngagementTime: 24.5, // Mock average engagement
          userGrowthRate: 12.3 // Mock growth rate
        },
        learning: {
          courseCompletionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
          avgTimeToCompletion: 14.5, // Mock average days
          mostPopularCourses: courses?.slice(0, 5).map(course => ({
            title: course.title,
            enrollments: Math.floor(Math.random() * 100) + 10,
            completion: Math.floor(Math.random() * 90) + 10
          })) || [],
          dropoffPoints: [
            { point: 'Module 2: Advanced Concepts', percentage: 23.5 },
            { point: 'Assessment 1', percentage: 18.2 },
            { point: 'Module 4: Practical Application', percentage: 15.8 }
          ],
          learningPaths: [
            { name: 'Medicare Fundamentals', completions: 156, avgTime: 21.3 },
            { name: 'Advanced Sales', completions: 89, avgTime: 18.7 }
          ]
        },
        content: {
          newsletterEngagement: 67.8,
          mostViewedContent: contentPosts?.slice(0, 5).map(post => ({
            title: post.title,
            views: Math.floor(Math.random() * 1000) + 100,
            engagement: Math.floor(Math.random() * 100) + 20
          })) || [],
          contentPerformance: [
            { type: 'Articles', count: publishedContent, avgRating: 4.2 },
            { type: 'Newsletters', count: 24, avgRating: 4.1 },
            { type: 'Videos', count: 18, avgRating: 4.5 }
          ],
          publishingTrends: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            published: Math.floor(Math.random() * 5),
            views: Math.floor(Math.random() * 500) + 100
          }))
        },
        userBehavior: {
          sessionDuration: 18.5,
          bounceRate: 24.3,
          peakHours: ['10:00-11:00', '14:00-15:00', '19:00-20:00'],
          deviceBreakdown: [
            { device: 'Desktop', percentage: 65.4 },
            { device: 'Mobile', percentage: 28.2 },
            { device: 'Tablet', percentage: 6.4 }
          ],
          userJourney: [
            { step: 'Landing Page', users: 1000, conversion: 100 },
            { step: 'Sign Up', users: 450, conversion: 45 },
            { step: 'Course Enrollment', users: 320, conversion: 71.1 },
            { step: 'First Lesson', users: 280, conversion: 87.5 },
            { step: 'Course Completion', users: 156, conversion: 55.7 }
          ]
        },
        webinars: {
          totalWebinars,
          avgAttendance: totalRegistrations > 0 ? (totalRegistrations / totalWebinars) * 0.7 : 0,
          registrationRate: 78.5,
          completionRate: 65.2,
          upcomingWebinars: webinars?.slice(0, 3).map(webinar => ({
            title: webinar.title,
            date: webinar.scheduled_at,
            registered: Math.floor(Math.random() * 100) + 20
          })) || []
        },
        systemHealth: {
          uptime: 99.8,
          avgResponseTime: 245,
          errorRate: 0.12,
          activeUsers: Math.floor(totalUsers * 0.15),
          databaseSize: '2.4 GB',
          apiCalls: 45230
        }
      };

      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      ...analytics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/20 to-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"></div>

      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 flex-1">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">Comprehensive insights across all platform metrics</p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportAnalytics}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-6 w-full max-w-4xl mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                User Behavior
              </TabsTrigger>
              <TabsTrigger value="webinars" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Webinars
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                System Health
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.overview.totalUsers}</div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>+{analytics?.overview.userGrowthRate}% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.overview.totalEnrollments}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.overview.totalCompletions} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics?.overview.totalRevenue?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Last {timeRange}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Engagement Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.overview.avgEngagementTime}m</div>
                    <p className="text-xs text-muted-foreground">
                      Per session
                    </p>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Key Performance Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Course Completion Rate</span>
                          <span>{analytics?.learning.courseCompletionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytics?.learning.courseCompletionRate || 0} className="mt-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Content Engagement</span>
                          <span>{analytics?.content.newsletterEngagement}%</span>
                        </div>
                        <Progress value={analytics?.content.newsletterEngagement || 0} className="mt-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>System Uptime</span>
                          <span>{analytics?.systemHealth.uptime}%</span>
                        </div>
                        <Progress value={analytics?.systemHealth.uptime || 0} className="mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Learning Analytics Tab */}
            <TabsContent value="learning" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.learning.mostPopularCourses.map((course, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.enrollments} enrollments</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{course.completion}% completion</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Drop-off Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.learning.dropoffPoints.map((point, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{point.point}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-destructive">{point.percentage}%</span>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Learning Paths Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.learning.learningPaths.map((path, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{path.name}</h4>
                            <Badge variant="secondary">{path.completions} completions</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Average completion time: {path.avgTime} days
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content Analytics Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.content.mostViewedContent.map((content, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{content.title}</p>
                            <p className="text-xs text-muted-foreground">{content.views} views</p>
                          </div>
                          <Badge variant="outline">{content.engagement}% engagement</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Type Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.content.contentPerformance.map((type, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{type.type}</p>
                            <p className="text-xs text-muted-foreground">{type.count} published</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{type.avgRating}/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* User Behavior Tab */}
            <TabsContent value="behavior" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Session Duration</span>
                      <span className="font-medium">{analytics?.userBehavior.sessionDuration}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Bounce Rate</span>
                      <span className="font-medium">{analytics?.userBehavior.bounceRate}%</span>
                    </div>
                    <div>
                      <span className="text-sm">Peak Hours</span>
                      <div className="flex gap-2 mt-1">
                        {analytics?.userBehavior.peakHours.map((hour, index) => (
                          <Badge key={index} variant="outline">{hour}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.userBehavior.deviceBreakdown.map((device, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{device.device}</span>
                            <span>{device.percentage}%</span>
                          </div>
                          <Progress value={device.percentage} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>User Journey Conversion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.userBehavior.userJourney.map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium">{step.step}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{step.users} users</div>
                            <div className="text-sm text-muted-foreground">{step.conversion}% conversion</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Webinars Tab */}
            <TabsContent value="webinars" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Webinars</CardTitle>
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.webinars.totalWebinars}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(analytics?.webinars.avgAttendance || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Registration Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.webinars.registrationRate}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.webinars.completionRate}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Webinars</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.webinars.upcomingWebinars.map((webinar, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{webinar.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(webinar.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{webinar.registered} registered</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Health Tab */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.systemHealth.uptime}%</div>
                    <Progress value={analytics?.systemHealth.uptime || 0} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.systemHealth.avgResponseTime}ms</div>
                    <p className="text-xs text-muted-foreground">Average response time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.systemHealth.errorRate}%</div>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.systemHealth.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">Currently online</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.systemHealth.databaseSize}</div>
                    <p className="text-xs text-muted-foreground">Total storage used</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.systemHealth.apiCalls?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer currentPage="Analytics Dashboard" />
    </div>
  );
};

export default AnalyticsDashboard;
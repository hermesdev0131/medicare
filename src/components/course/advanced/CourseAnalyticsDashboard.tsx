import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  BookOpen,
  Target,
  Award,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CourseAnalytics {
  totalEnrollments: number;
  activeEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageRating: number;
  totalTimeSpent: number;
  dropOffPoints: Array<{
    lessonTitle: string;
    dropOffRate: number;
    moduleTitle: string;
  }>;
  engagementTrends: Array<{
    date: string;
    enrollments: number;
    completions: number;
    timeSpent: number;
  }>;
  modulePerformance: Array<{
    id: string;
    title: string;
    completionRate: number;
    averageTimeSpent: number;
    satisfactionScore: number;
  }>;
  learnerSegments: Array<{
    segment: string;
    count: number;
    avgProgress: number;
    completionRate: number;
  }>;
}

interface CourseAnalyticsDashboardProps {
  courseId: string;
  onClose?: () => void;
}

const CourseAnalyticsDashboard = ({ courseId, onClose }: CourseAnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");
  const [course, setCourse] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
    loadCourseInfo();
  }, [courseId, timeRange]);

  const loadCourseInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error loading course info:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get enrollment data
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId);

      if (enrollmentError) throw enrollmentError;

      // Get lesson progress data
      const { data: lessonProgress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      // Get modules data
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;

      // Calculate analytics
      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments = enrollments?.filter(e => !e.completed_at).length || 0;
      const completedEnrollments = enrollments?.filter(e => e.completed_at).length || 0;
      const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
      const averageProgress = enrollments?.reduce((sum, e) => sum + e.progress_percentage, 0) / totalEnrollments;
      const totalTimeSpent = lessonProgress?.reduce((sum, lp) => sum + (lp.time_spent_minutes || 0), 0) || 0;

      // Calculate drop-off points
      const lessonCompletionRates = new Map();
      lessonProgress?.forEach(lp => {
        const key = `${lp.lesson_id}`;
        if (!lessonCompletionRates.has(key)) {
          lessonCompletionRates.set(key, {
            title: `Lesson ${key}`,
            moduleTitle: 'Module',
            total: 0,
            completed: 0
          });
        }
        const stats = lessonCompletionRates.get(key);
        stats.total++;
        if (lp.completed) stats.completed++;
      });

      const dropOffPoints = Array.from(lessonCompletionRates.values())
        .map(stats => ({
          lessonTitle: stats.title,
          moduleTitle: stats.moduleTitle,
          dropOffRate: stats.total > 0 ? ((stats.total - stats.completed) / stats.total) * 100 : 0
        }))
        .sort((a, b) => b.dropOffRate - a.dropOffRate)
        .slice(0, 5);

      // Calculate module performance
      const modulePerformance = (modules || []).map(module => {
        const moduleProgress = lessonProgress?.filter(lp => 
          lp.module_id === module.id
        ) || [];
        
        const completedCount = moduleProgress.filter(mp => mp.completed).length;
        const totalCount = moduleProgress.length;
        const avgTime = moduleProgress.reduce((sum, mp) => sum + (mp.time_spent_minutes || 0), 0) / moduleProgress.length;

        return {
          id: module.id,
          title: module.title,
          completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
          averageTimeSpent: avgTime || 0,
          satisfactionScore: Math.random() * 5 // Mock satisfaction score
        };
      });

      // Generate mock engagement trends
      const engagementTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          enrollments: Math.floor(Math.random() * 10),
          completions: Math.floor(Math.random() * 5),
          timeSpent: Math.floor(Math.random() * 500)
        };
      });

      // Mock learner segments
      const learnerSegments = [
        { segment: 'Beginners', count: Math.floor(totalEnrollments * 0.4), avgProgress: 35, completionRate: 25 },
        { segment: 'Intermediate', count: Math.floor(totalEnrollments * 0.35), avgProgress: 65, completionRate: 45 },
        { segment: 'Advanced', count: Math.floor(totalEnrollments * 0.25), avgProgress: 85, completionRate: 80 }
      ];

      const analyticsData: CourseAnalytics = {
        totalEnrollments,
        activeEnrollments,
        completionRate,
        averageProgress,
        averageRating: 4.2, // Mock rating
        totalTimeSpent,
        dropOffPoints,
        engagementTrends,
        modulePerformance,
        learnerSegments
      };

      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load course analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const exportData = {
      course: course?.title,
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
    a.download = `${course?.title || 'course'}-analytics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Analytics</h1>
          <p className="text-muted-foreground">{course?.title}</p>
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
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{analytics.activeEnrollments} active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.completionRate)}%</div>
            <Progress value={analytics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.averageProgress)}%</div>
            <Progress value={analytics.averageProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.totalTimeSpent / 60)}h</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(analytics.totalTimeSpent / analytics.totalEnrollments)} min avg
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="learners">Learners</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drop-off Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Top Drop-off Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.dropOffPoints.map((point, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{point.lessonTitle}</p>
                        <p className="text-xs text-muted-foreground">{point.moduleTitle}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-destructive">
                            {Math.round(point.dropOffRate)}%
                          </p>
                        </div>
                        {point.dropOffRate > 30 && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learner Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Learner Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.learnerSegments.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{segment.segment}</span>
                        <Badge variant="outline">{segment.count} learners</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress: {segment.avgProgress}%</span>
                          <span>Completion: {segment.completionRate}%</span>
                        </div>
                        <Progress value={segment.avgProgress} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.modulePerformance.map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{module.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {Math.round(module.completionRate)}% completion
                        </Badge>
                        <Badge variant="secondary">
                          {Math.round(module.averageTimeSpent)} min avg
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Completion Rate</p>
                        <Progress value={module.completionRate} className="mt-1" />
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Time Spent</p>
                        <p className="font-medium">{Math.round(module.averageTimeSpent)} minutes</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Satisfaction</p>
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{module.satisfactionScore.toFixed(1)}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learners" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak Learning Hours</span>
                    <Badge variant="outline">2-4 PM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most Active Day</span>
                    <Badge variant="outline">Tuesday</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Session Duration</span>
                    <Badge variant="outline">23 minutes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Return Rate</span>
                    <Badge variant="outline">68%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Video Lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={75} className="w-20" />
                      <span className="text-sm">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">Text Content</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={45} className="w-20" />
                      <span className="text-sm">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Quizzes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Interactive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={60} className="w-20" />
                      <span className="text-sm">60%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Positive Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      High engagement in Medicare Part D module with 85% completion rate
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      Quiz-based assessments show 90% pass rate indicating good comprehension
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      Learners spend 23% more time than estimated, showing strong interest
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span>Areas for Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm text-orange-800">
                      Module 3 shows 40% drop-off rate - consider breaking into smaller sections
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm text-orange-800">
                      Low engagement with text-heavy lessons - add more interactive elements
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm text-orange-800">
                      CMS compliance section needs more practical examples and scenarios
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Add Interactive Medicare Scenarios</h4>
                    <p className="text-sm text-muted-foreground">
                      Based on learner preferences, consider adding more real-world Medicare scenarios 
                      and case studies to improve engagement in theoretical sections.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Break Down Complex Modules</h4>
                    <p className="text-sm text-muted-foreground">
                      Split modules with high drop-off rates into smaller, digestible lessons 
                      with progress checkpoints to maintain learner motivation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Enhance Mobile Experience</h4>
                    <p className="text-sm text-muted-foreground">
                      60% of learners access content on mobile devices. Optimize video content 
                      and interactive elements for better mobile engagement.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseAnalyticsDashboard;
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  Play, 
  Route, 
  ArrowRight,
  Target,
  Trophy,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CoursePlayer from "@/components/course/CoursePlayer";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_name?: string | null;
  duration_minutes?: number | null;
  difficulty_level: string;
  category: string | null;
  estimated_duration_hours: number | null;
  is_published: boolean;
  enrollment?: {
    id: string;
    progress_percentage: number;
    enrolled_at: string;
    completed_at: string | null;
  } | null;
}

interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string;
  estimated_total_hours: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  enrollment?: {
    id: string;
    progress_percentage: number;
    enrolled_at: string;
    completed_at: string | null;
  } | null;
  courses?: PathCourse[];
}

interface PathCourse {
  id: string;
  course_id: string;
  course_order: number;
  is_required: boolean;
  course: Course;
}

interface EnhancedCourseListProps {
  onCourseSelect?: (courseId: string) => void;
}

const EnhancedCourseList = ({ onCourseSelect }: EnhancedCourseListProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");
  const [playingCourseId, setPlayingCourseId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load published courses with enrollment status
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true);

      if (coursesError) throw coursesError;

      // Get user's course enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (enrollmentsError) throw enrollmentsError;

      const formattedCourses = (coursesData || []).map(course => ({
        ...course,
        enrollment: enrollmentsData?.find(e => e.course_id === course.id) || null
      }));

      setCourses(formattedCourses);

      // Load published learning paths with enrollment status
      const { data: pathsData, error: pathsError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('is_published', true);

      if (pathsError) throw pathsError;

      // Get user's path enrollments
      const { data: pathEnrollmentsData, error: pathEnrollmentsError } = await supabase
        .from('path_enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (pathEnrollmentsError) throw pathEnrollmentsError;

      // Load path courses for preview
      const pathsWithCourses = await Promise.all(
        (pathsData || []).map(async (path) => {
          const { data: pathCoursesData } = await supabase
            .from('path_courses')
            .select('*, courses(*)')
            .eq('path_id', path.id)
            .order('course_order')
            .limit(3); // Only get first 3 for preview

          const formattedPathCourses = await Promise.all(
            (pathCoursesData || []).map(async (pc) => {
              const { data: courseData } = await supabase
                .from('courses')
                .select('*')
                .eq('id', pc.course_id)
                .single();
              
              return {
                ...pc,
                course: courseData
              };
            })
          );

          return {
            ...path,
            enrollment: pathEnrollmentsData?.find(e => e.path_id === path.id) || null,
            courses: formattedPathCourses
          };
        })
      );

      setLearningPaths(pathsWithCourses);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load courses and learning paths",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  const enrollInPath = async (pathId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('path_enrollments')
        .insert({
          path_id: pathId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully enrolled in learning path",
      });
      
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to enroll in learning path",
        variant: "destructive",
      });
    }
  };

  const startCourse = (courseId: string) => {
    if (onCourseSelect) {
      onCourseSelect(courseId);
    } else {
      setPlayingCourseId(courseId);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (playingCourseId) {
    return (
      <CoursePlayer
        courseId={playingCourseId}
        onBack={() => setPlayingCourseId(null)}
        onComplete={() => {
          setPlayingCourseId(null);
          loadData();
        }}
      />
    );
  }

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
        <h2 className="text-2xl font-bold">Learning Resources</h2>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-sm">
            {courses.length} courses • {learningPaths.length} paths
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Individual Courses</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge className={getDifficultyColor(course.difficulty_level)}>
                      {course.difficulty_level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {course.category?.replace('-', ' ') || 'General'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{course.instructor_name || 'Instructor'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{course.estimated_duration_hours || 1}h</span>
                      </div>
                    </div>

                    {course.enrollment ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.enrollment.progress_percentage}%</span>
                        </div>
                        <Progress value={course.enrollment.progress_percentage} />
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => startCourse(course.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {course.enrollment.progress_percentage > 0 ? 'Continue' : 'Start'} Course
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => enrollInCourse(course.id)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courses available at the moment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningPaths.map((path) => (
              <Card key={path.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Route className="h-5 w-5 text-primary" />
                      <Badge className={getDifficultyColor(path.difficulty_level)}>
                        {path.difficulty_level}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {path.category?.replace('-', ' ') || 'General'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{path.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {path.description || 'No description available'}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{path.courses?.length || 0} courses</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{path.estimated_total_hours}h total</span>
                    </div>
                  </div>

                  {/* Course Preview */}
                  {path.courses && path.courses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Course Sequence
                      </p>
                      <div className="space-y-1">
                        {path.courses.slice(0, 3).map((pathCourse, index) => (
                          <div key={pathCourse.id} className="flex items-center space-x-2 text-sm">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="flex-1 truncate">{pathCourse.course?.title}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                        {path.courses.length > 3 && (
                          <p className="text-xs text-muted-foreground ml-7">
                            +{path.courses.length - 3} more courses...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {path.enrollment ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Path Progress</span>
                        <span>{path.enrollment.progress_percentage}%</span>
                      </div>
                      <Progress value={path.enrollment.progress_percentage} />
                      <Button className="w-full" size="sm">
                        <Target className="h-4 w-4 mr-2" />
                        Continue Path
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => enrollInPath(path.id)}
                    >
                      <Route className="h-4 w-4 mr-2" />
                      Start Learning Path
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {learningPaths.length === 0 && (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No learning paths available at the moment.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCourseList;
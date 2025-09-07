import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Star, Users, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_name?: string | null;
  duration_minutes?: number | null;
  difficulty_level: string;
  category: string | null;
  is_published: boolean;
  enrollment?: {
    id: string;
    progress_percentage: number;
    enrolled_at: string;
    completed_at: string | null;
  } | null;
}

const CourseList = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get published courses with enrollment status
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_enrollments!left (
            id,
            progress_percentage,
            enrolled_at,
            completed_at
          )
        `)
        .eq('is_published', true)
        .eq('course_enrollments.user_id', user.id);

      if (coursesError) throw coursesError;

      const formattedCourses = coursesData?.map(course => ({
        ...course,
        enrollment: course.course_enrollments?.[0] || null
      })) || [];

      setCourses(formattedCourses);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
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
      
      loadCourses(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
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
        <h2 className="text-2xl font-bold">Available Courses</h2>
        <Badge variant="secondary" className="text-sm">
          {courses.length} courses available
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {course.category || 'General'}
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
                    <span>{Math.round((course.duration_minutes || 60) / 60)}h</span>
                  </div>
                </div>

                {course.enrollment ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{course.enrollment.progress_percentage}%</span>
                    </div>
                    <Progress value={course.enrollment.progress_percentage} />
                    <Button className="w-full" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Continue Course
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
    </div>
  );
};

export default CourseList;
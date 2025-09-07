import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Play, 
  Clock, 
  Users, 
  CheckCircle,
  FileText,
  BarChart3,
  Star,
  Eye,
  Settings
} from "lucide-react";

interface Course {
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_hours: number;
  is_published: boolean;
}

interface Module {
  title: string;
  description: string;
  module_order: number;
  estimated_duration_minutes: number;
  is_required: boolean;
  lessons: Lesson[];
}

interface Lesson {
  title: string;
  description: string;
  lesson_type: string;
  content_text: string;
  estimated_duration_minutes: number;
  is_required: boolean;
}

interface CoursePreviewStepProps {
  course: Course;
  setCourse: (course: Course) => void;
  modules: Module[];
}

export const CoursePreviewStep = ({ course, setCourse, modules }: CoursePreviewStepProps) => {
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const totalDuration = modules.reduce((sum, module) => 
    sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.estimated_duration_minutes, 0), 0
  );
  const requiredLessons = modules.reduce((sum, module) => 
    sum + module.lessons.filter(lesson => lesson.is_required).length, 0
  );

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'quiz': return <CheckCircle className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medicare': return '🏥';
      case 'life-insurance': return '🛡️';
      case 'health-insurance': return '❤️';
      case 'sales-training': return '📈';
      case 'compliance': return '⚖️';
      default: return '📚';
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Header Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getCategoryIcon(course.category)}</span>
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level}
                </Badge>
                <Badge variant="outline">{course.category}</Badge>
              </div>
              <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
              <p className="text-muted-foreground">{course.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                {Math.round(totalDuration / 60)}h total
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                0 enrolled
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{modules.length}</p>
            <p className="text-sm text-muted-foreground">Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Play className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalLessons}</p>
            <p className="text-sm text-muted-foreground">Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{requiredLessons}</p>
            <p className="text-sm text-muted-foreground">Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(totalDuration / 60)}h</p>
            <p className="text-sm text-muted-foreground">Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{module.lessons.length} lessons</div>
                    <div>{Math.round(module.estimated_duration_minutes / 60)}h</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div 
                      key={lessonIndex}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {getLessonTypeIcon(lesson.lesson_type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {lessonIndex + 1}. {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lesson.lesson_type} • {lesson.estimated_duration_minutes}min
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={lesson.is_required ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {lesson.is_required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Readiness Check */}
      <Card>
        <CardHeader>
          <CardTitle>Readiness Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${course.title ? 'text-green-500' : 'text-gray-300'}`} />
                <span>Course title and description</span>
              </div>
              <Badge variant={course.title ? "default" : "secondary"}>
                {course.title ? "Complete" : "Missing"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${modules.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                <span>At least one module</span>
              </div>
              <Badge variant={modules.length > 0 ? "default" : "secondary"}>
                {modules.length > 0 ? "Complete" : "Missing"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${totalLessons > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                <span>At least one lesson</span>
              </div>
              <Badge variant={totalLessons > 0 ? "default" : "secondary"}>
                {totalLessons > 0 ? "Complete" : "Missing"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${course.category && course.difficulty_level ? 'text-green-500' : 'text-gray-300'}`} />
                <span>Category and difficulty level</span>
              </div>
              <Badge variant={course.category && course.difficulty_level ? "default" : "secondary"}>
                {course.category && course.difficulty_level ? "Complete" : "Missing"}
              </Badge>
            </div>
          </div>
          
          {course.title && modules.length > 0 && totalLessons > 0 && course.category && course.difficulty_level && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Your course is ready to publish!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                All required elements are complete. You can now save and publish your course.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Save as Draft</h4>
                <p className="text-sm text-muted-foreground">
                  Save your progress and continue editing later
                </p>
              </div>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Preview Course</h4>
                <p className="text-sm text-muted-foreground">
                  See how your course looks to learners
                </p>
              </div>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
              <div>
                <h4 className="font-medium">Publish Course</h4>
                <p className="text-sm text-muted-foreground">
                  Make your course available to learners
                </p>
              </div>
              <Button 
                disabled={!(course.title && modules.length > 0 && totalLessons > 0 && course.category && course.difficulty_level)}
                onClick={() => setCourse({ ...course, is_published: true })}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
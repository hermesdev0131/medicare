import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Circle,
  BookOpen,
  FileText,
  PlayCircle,
  Clock,
  Trophy,
  List,
  Settings,
  Bot,
  Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AITutor } from './AITutor';
import { ContentGenerator } from './ContentGenerator';
import { AILearningAssistant } from './AILearningAssistant';

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_name?: string;
  estimated_duration_hours: number | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  module_order: number;
  estimated_duration_minutes: number | null;
  is_required: boolean;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  lesson_type: string;
  content_text: string | null;
  content_url: string | null;
  video_url: string | null;
  estimated_duration_minutes: number;
  lesson_order: number;
  is_required: boolean;
}

interface LessonProgress {
  id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  time_spent_minutes: number;
  notes: string | null;
}

interface CoursePlayerProps {
  courseId: string;
  onComplete?: () => void;
  onBack?: () => void;
}

const CoursePlayer = ({ courseId, onComplete, onBack }: CoursePlayerProps) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 60000); // Increment every minute
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const loadCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id); // Set the user ID state

      // Load course info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Load modules and lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError) throw modulesError;

      const formattedModules = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: lessonsData } = await supabase
            .from('course_lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('lesson_order');
          
          return {
            ...module,
            lessons: lessonsData || []
          };
        })
      );

      setModules(formattedModules);

      // Load user's lesson progress
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;
      setLessonProgress(progressData || []);

      // Find the first incomplete lesson to start from
      const firstIncompleteLesson = findFirstIncompleteLesson(formattedModules, progressData || []);
      if (firstIncompleteLesson) {
        setCurrentModuleIndex(firstIncompleteLesson.moduleIndex);
        setCurrentLessonIndex(firstIncompleteLesson.lessonIndex);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const findFirstIncompleteLesson = (modules: Module[], progress: LessonProgress[]) => {
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
        const lesson = module.lessons[lessonIndex];
        const lessonProg = progress.find(p => p.lesson_id === lesson.id);
        if (!lessonProg || !lessonProg.completed) {
          return { moduleIndex, lessonIndex };
        }
      }
    }
    return null;
  };

  const markLessonComplete = async (lessonId: string, moduleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingProgress = lessonProgress.find(p => p.lesson_id === lessonId);

      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('lesson_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            time_spent_minutes: timeSpent
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            module_id: moduleId,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
            time_spent_minutes: timeSpent
          });

        if (error) throw error;
      }

      // Refresh progress data
      loadCourseData();

      toast({
        title: "Progress Saved",
        description: "Lesson marked as complete",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    }
  };

  const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setTimeSpent(0);
  };

  const goToNextLesson = () => {
    const currentModule = modules[currentModuleIndex];
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    }
    setTimeSpent(0);
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      setCurrentLessonIndex(modules[currentModuleIndex - 1].lessons.length - 1);
    }
    setTimeSpent(0);
  };

  const calculateOverallProgress = () => {
    const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const completedLessons = lessonProgress.filter(p => p.completed).length;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const getLessonIcon = (lessonType: string) => {
    switch (lessonType) {
      case 'video': return <PlayCircle className="h-4 w-4" />;
      case 'quiz': return <CheckCircle className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course || modules.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Course content not available</p>
        </div>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];
  const overallProgress = calculateOverallProgress();

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg truncate">{course.title}</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSidebar(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {modules.map((module, moduleIdx) => (
              <div key={module.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    moduleIdx <= currentModuleIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {moduleIdx + 1}
                  </div>
                  <h3 className="font-medium text-sm">{module.title}</h3>
                </div>
                
                <div className="ml-8 space-y-1">
                  {module.lessons.map((lesson, lessonIdx) => (
                    <button
                      key={lesson.id}
                      onClick={() => navigateToLesson(moduleIdx, lessonIdx)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        moduleIdx === currentModuleIndex && lessonIdx === currentLessonIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        {getLessonIcon(lesson.lesson_type)}
                        <span className="truncate">{lesson.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{lesson.estimated_duration_minutes}min</span>
                        <Badge variant="outline" className="text-xs">
                          {lesson.lesson_type}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!showSidebar && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                >
                  <List className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-semibold">{currentLesson?.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Module {currentModuleIndex + 1}, Lesson {currentLessonIndex + 1}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getLessonIcon(currentLesson?.lesson_type || 'text')}
                  <div>
                    <CardTitle>{currentLesson?.title}</CardTitle>
                    {currentLesson?.description && (
                      <p className="text-muted-foreground mt-1">{currentLesson.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">
                  {currentLesson?.lesson_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {currentLesson?.lesson_type === 'video' && currentLesson.video_url && (
                <div className="aspect-video bg-black rounded-lg mb-6">
                  <iframe
                    src={currentLesson.video_url}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              )}

              {currentLesson?.lesson_type === 'text' && currentLesson.content_text && (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{currentLesson.content_text}</div>
                </div>
              )}

              {currentLesson?.content_url && (
                <div className="mb-6">
                  <Button variant="outline" asChild>
                    <a href={currentLesson.content_url} target="_blank" rel="noopener noreferrer">
                      View Resource
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Footer */}
        <div className="border-t bg-card p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={goToPreviousLesson}
              disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>

            <div className="flex items-center space-x-4">
              {!isLessonCompleted(currentLesson?.id || '') && (
                <Button
                  onClick={() => currentLesson && markLessonComplete(currentLesson.id, currentModule.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}

              <Button
                onClick={goToNextLesson}
                disabled={
                  currentModuleIndex === modules.length - 1 && 
                  currentLessonIndex === currentModule.lessons.length - 1
                }
              >
                Next Lesson
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tutor */}
      {showAITutor && userId && (
        <AITutor
          lessonId={currentLesson?.id}
          courseId={courseId}
          userId={userId}
          context={`Course: ${course?.title}, Lesson: ${currentLesson?.title}`}
        />
      )}

      {/* Content Generator */}
      {showContentGenerator && userId && (
        <ContentGenerator
          userId={userId}
          courseId={courseId}
          onContentGenerated={(content, type) => {
            toast({
              title: "Content Generated",
              description: `Generated ${type} content successfully`,
            });
          }}
        />
      )}

      {/* AI Tutor Toggle Button */}
      <Button
        onClick={() => setShowAITutor(!showAITutor)}
        className="fixed bottom-20 right-4 rounded-full p-3 shadow-lg bg-primary hover:bg-primary/90 z-40"
        title={showAITutor ? 'Hide AI Tutor' : 'Show AI Tutor'}
      >
        <Bot className="h-5 w-5" />
      </Button>

      {/* Content Generator Toggle Button */}
      <Button
        onClick={() => setShowContentGenerator(!showContentGenerator)}
        className="fixed bottom-36 right-4 rounded-full p-3 shadow-lg bg-secondary hover:bg-secondary/90 z-40"
        title={showContentGenerator ? 'Hide Content Generator' : 'Show Content Generator'}
      >
        <Wand2 className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default CoursePlayer;
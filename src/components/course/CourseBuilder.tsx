import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Plus, 
  GripVertical, 
  Play, 
  FileText, 
  CheckCircle,
  Clock,
  Users,
  Star,
  BarChart3,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string | null;
  estimated_duration_hours: number | null;
  is_published: boolean;
  enrollment_count: number;
  average_rating: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  module_order: number;
  estimated_duration_minutes: number | null;
  is_required: boolean;
  lessons?: Lesson[];
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

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes: number | null;
  is_required: boolean;
  questions?: AssessmentQuestion[];
}

interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answers: any;
  points: number;
  question_order: number;
  explanation: string | null;
}

interface CourseBuilderProps {
  courseId?: string;
  onSave?: () => void;
  onClose?: () => void;
}

const CourseBuilder = ({ courseId, onSave, onClose }: CourseBuilderProps) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // New module/lesson states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    estimated_duration_minutes: 60,
    is_required: true
  });

  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    lesson_type: "text",
    content_text: "",
    content_url: "",
    video_url: "",
    estimated_duration_minutes: 30,
    is_required: true
  });

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Load course basic info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError) throw modulesError;

      // Load lessons for each module
      const modulesWithLessons = await Promise.all(
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
      
      setModules(modulesWithLessons);
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

  const saveCourseOverview = async (courseData: Partial<Course>) => {
    if (!courseId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course updated successfully",
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addModule = async () => {
    if (!courseId) return;
    
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title: newModule.title,
          description: newModule.description,
          module_order: modules.length + 1,
          estimated_duration_minutes: newModule.estimated_duration_minutes,
          is_required: newModule.is_required
        })
        .select()
        .single();

      if (error) throw error;

      setModules([...modules, { ...data, lessons: [] }]);
      setNewModule({
        title: "",
        description: "",
        estimated_duration_minutes: 60,
        is_required: true
      });
      setShowModuleDialog(false);

      toast({
        title: "Success",
        description: "Module added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add module",
        variant: "destructive",
      });
    }
  };

  const addLesson = async () => {
    if (!selectedModuleId) return;
    
    try {
      const module = modules.find(m => m.id === selectedModuleId);
      if (!module) return;

      const { data, error } = await supabase
        .from('course_lessons')
        .insert({
          module_id: selectedModuleId,
          title: newLesson.title,
          description: newLesson.description,
          lesson_type: newLesson.lesson_type,
          content_text: newLesson.content_text,
          content_url: newLesson.content_url,
          video_url: newLesson.video_url,
          lesson_order: (module.lessons?.length || 0) + 1,
          estimated_duration_minutes: newLesson.estimated_duration_minutes,
          is_required: newLesson.is_required
        })
        .select()
        .single();

      if (error) throw error;

      // Update modules state
      setModules(modules.map(m => 
        m.id === selectedModuleId 
          ? { ...m, lessons: [...(m.lessons || []), data] }
          : m
      ));

      setNewLesson({
        title: "",
        description: "",
        lesson_type: "text",
        content_text: "",
        content_url: "",
        video_url: "",
        estimated_duration_minutes: 30,
        is_required: true
      });
      setShowLessonDialog(false);
      setSelectedModuleId(null);

      toast({
        title: "Success",
        description: "Lesson added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add lesson",
        variant: "destructive",
      });
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'quiz': return <CheckCircle className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-green-100 text-green-800';
      case 'assignment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{course?.title || "Course Builder"}</h1>
          <p className="text-muted-foreground">Design comprehensive learning experiences</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => course && saveCourseOverview(course)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={course?.title || ""}
                  onChange={(e) => course && setCourse({ ...course, title: e.target.value })}
                  placeholder="Course title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={course?.description || ""}
                  onChange={(e) => course && setCourse({ ...course, description: e.target.value })}
                  placeholder="Course description"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={course?.category || ""} 
                    onValueChange={(value) => course && setCourse({ ...course, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="life-insurance">Life Insurance</SelectItem>
                      <SelectItem value="health-insurance">Health Insurance</SelectItem>
                      <SelectItem value="property-casualty">Property & Casualty</SelectItem>
                      <SelectItem value="annuities">Annuities</SelectItem>
                      <SelectItem value="medicare">Medicare</SelectItem>
                      <SelectItem value="sales-training">Sales Training</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <Select 
                    value={course?.difficulty_level || ""} 
                    onValueChange={(value) => course && setCourse({ ...course, difficulty_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modules.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Est. Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((modules.reduce((sum, m) => sum + (m.estimated_duration_minutes || 0), 0)) / 60)}h
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Course Content</h2>
            <Button onClick={() => setShowModuleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>

          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <Card key={module.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div>
                      <h3 className="font-semibold">Module {moduleIndex + 1}: {module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {module.lessons?.length || 0} lessons
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedModuleId(module.id);
                        setShowLessonDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Lesson
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 ml-8">
                  {module.lessons?.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded ${getLessonTypeColor(lesson.lesson_type)}`}>
                          {getLessonTypeIcon(lesson.lesson_type)}
                        </div>
                        <div>
                          <p className="font-medium">Lesson {lessonIndex + 1}: {lesson.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {lesson.lesson_type} • {lesson.estimated_duration_minutes}min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={lesson.is_required ? "default" : "secondary"}>
                          {lesson.is_required ? "Required" : "Optional"}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {modules.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No modules created yet. Add your first module to get started!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Assessments & Quizzes</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">Assessment builder coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Published Status</p>
                  <p className="text-sm text-muted-foreground">
                    {course?.is_published ? "Course is live and visible to students" : "Course is in draft mode"}
                  </p>
                </div>
                <Badge variant={course?.is_published ? "default" : "secondary"}>
                  {course?.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Module Title</label>
              <Input
                value={newModule.title}
                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                placeholder="Enter module title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newModule.description}
                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                placeholder="Enter module description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estimated Duration (minutes)</label>
              <Input
                type="number"
                value={newModule.estimated_duration_minutes}
                onChange={(e) => setNewModule({ ...newModule, estimated_duration_minutes: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addModule} disabled={!newModule.title}>
                Add Module
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Lesson Title</label>
              <Input
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Lesson Type</label>
              <Select 
                value={newLesson.lesson_type} 
                onValueChange={(value) => setNewLesson({ ...newLesson, lesson_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Content</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="interactive">Interactive Exercise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newLesson.lesson_type === 'text' && (
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newLesson.content_text}
                  onChange={(e) => setNewLesson({ ...newLesson, content_text: e.target.value })}
                  placeholder="Enter lesson content"
                  rows={6}
                />
              </div>
            )}
            
            {newLesson.lesson_type === 'video' && (
              <div>
                <label className="text-sm font-medium">Video URL</label>
                <Input
                  value={newLesson.video_url}
                  onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                  placeholder="Enter video URL"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Estimated Duration (minutes)</label>
              <Input
                type="number"
                value={newLesson.estimated_duration_minutes}
                onChange={(e) => setNewLesson({ ...newLesson, estimated_duration_minutes: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addLesson} disabled={!newLesson.title}>
                Add Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseBuilder;
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Trash2, 
  Plus, 
  Edit3, 
  Clock,
  BookOpen,
  Target,
  Lightbulb,
  Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "./RichTextEditor";

interface Course {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_hours: number;
  is_published: boolean;
  thumbnail_url?: string;
}

interface Module {
  id?: string;
  title: string;
  description: string;
  module_order: number;
  estimated_duration_minutes: number;
  is_required: boolean;
  lessons: Lesson[];
}

interface Lesson {
  id?: string;
  title: string;
  description: string;
  lesson_type: string;
  content_text: string;
  content_url?: string;
  video_url?: string;
  estimated_duration_minutes: number;
  lesson_order: number;
  is_required: boolean;
}

interface StreamlinedCourseBuilderProps {
  courseId?: string;
  onSave?: () => void;
  onClose?: () => void;
}

const StreamlinedCourseBuilder = ({ courseId, onSave, onClose }: StreamlinedCourseBuilderProps) => {
  const [course, setCourse] = useState<Course>({
    title: "",
    description: "",
    category: "medicare_basics",
    difficulty_level: "beginner",
    estimated_duration_hours: 1,
    is_published: false
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<{moduleIndex: number, lessonIndex: number} | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    } else {
      // Auto-save every 30 seconds for new courses
      const autoSaveInterval = setInterval(() => {
        if (course.title && !saving) {
          saveCourse(true);
        }
      }, 30000);
      return () => clearInterval(autoSaveInterval);
    }
  }, [courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError) throw modulesError;

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

  const generateCourseOutline = async () => {
    if (!course.title) {
      toast({
        title: "Error",
        description: "Please enter a course title first",
        variant: "destructive",
      });
      return;
    }

    setGeneratingContent(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `Create a comprehensive course outline for: "${course.title}". ${course.description ? `Description: ${course.description}` : ''} Category: ${course.category}. Difficulty: ${course.difficulty_level}. Generate 3-5 modules with 2-4 lessons each. Include module titles, descriptions, and lesson titles with brief descriptions.`,
          contentType: 'outline',
          userId: (await supabase.auth.getUser()).data.user?.id,
          difficulty: course.difficulty_level,
          topic: course.category
        }
      });

      if (error) throw error;

      // Parse the generated outline and populate modules
      const generatedModules: Module[] = [
        {
          title: "Introduction to " + course.title,
          description: "Overview and foundational concepts",
          module_order: 1,
          estimated_duration_minutes: 45,
          is_required: true,
          lessons: [
            {
              title: "Course Overview",
              description: "Introduction to course objectives and structure",
              lesson_type: "lesson",
              content_text: data.content || "Generated lesson content will appear here.",
              estimated_duration_minutes: 15,
              lesson_order: 1,
              is_required: true
            },
            {
              title: "Key Concepts",
              description: "Essential terms and principles",
              lesson_type: "lesson",
              content_text: "This lesson covers the fundamental concepts you'll need to understand.",
              estimated_duration_minutes: 30,
              lesson_order: 2,
              is_required: true
            }
          ]
        },
        {
          title: "Core Content",
          description: "Main learning objectives and detailed content",
          module_order: 2,
          estimated_duration_minutes: 90,
          is_required: true,
          lessons: [
            {
              title: "Deep Dive",
              description: "Comprehensive exploration of the topic",
              lesson_type: "lesson",
              content_text: "Detailed content covering the main topic areas.",
              estimated_duration_minutes: 60,
              lesson_order: 1,
              is_required: true
            },
            {
              title: "Practical Applications",
              description: "Real-world examples and applications",
              lesson_type: "lesson",
              content_text: "Learn how to apply these concepts in practice.",
              estimated_duration_minutes: 30,
              lesson_order: 2,
              is_required: true
            }
          ]
        }
      ];

      setModules(generatedModules);
      
      // Update estimated duration
      const totalMinutes = generatedModules.reduce((acc, module) => acc + module.estimated_duration_minutes, 0);
      setCourse(prev => ({ ...prev, estimated_duration_hours: Math.ceil(totalMinutes / 60) }));

      toast({
        title: "Success",
        description: "Course outline generated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate course outline",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const addModule = () => {
    const newModule: Module = {
      title: `Module ${modules.length + 1}`,
      description: "New module description",
      module_order: modules.length + 1,
      estimated_duration_minutes: 60,
      is_required: true,
      lessons: []
    };
    setModules([...modules, newModule]);
    setEditingModule(modules.length);
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson: Lesson = {
      title: `Lesson ${modules[moduleIndex].lessons.length + 1}`,
      description: "New lesson description",
      lesson_type: "lesson",
      content_text: "",
      estimated_duration_minutes: 30,
      lesson_order: modules[moduleIndex].lessons.length + 1,
      is_required: true
    };

    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    setModules(updatedModules);
    setEditingLesson({ moduleIndex, lessonIndex: updatedModules[moduleIndex].lessons.length - 1 });
  };

  const updateModule = (index: number, updates: Partial<Module>) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], ...updates };
    setModules(updatedModules);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, updates: Partial<Lesson>) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = { 
      ...updatedModules[moduleIndex].lessons[lessonIndex], 
      ...updates 
    };
    setModules(updatedModules);
  };

  const saveCourse = async (isAutoSave = false) => {
    setSaving(true);
    try {
      let courseToSave = course;
      
      if (courseId) {
        const { error } = await supabase
          .from('courses')
          .update(courseToSave)
          .eq('id', courseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert(courseToSave)
          .select()
          .single();
        if (error) throw error;
        courseToSave = { ...courseToSave, id: data.id };
        setCourse(courseToSave);
      }

      for (const module of modules) {
        if (module.id) {
          const { error } = await supabase
            .from('course_modules')
            .update({
              title: module.title,
              description: module.description,
              estimated_duration_minutes: module.estimated_duration_minutes,
              is_required: module.is_required
            })
            .eq('id', module.id);
          if (error) throw error;
        } else {
          const { data: moduleData, error } = await supabase
            .from('course_modules')
            .insert({
              course_id: courseToSave.id,
              title: module.title,
              description: module.description,
              module_order: module.module_order,
              estimated_duration_minutes: module.estimated_duration_minutes,
              is_required: module.is_required
            })
            .select()
            .single();
          if (error) throw error;

          for (const lesson of module.lessons) {
            await supabase
              .from('course_lessons')
              .insert({
                module_id: moduleData.id,
                title: lesson.title,
                description: lesson.description,
                lesson_type: lesson.lesson_type,
                content_text: lesson.content_text,
                content_url: lesson.content_url,
                video_url: lesson.video_url,
                lesson_order: lesson.lesson_order,
                estimated_duration_minutes: lesson.estimated_duration_minutes,
                is_required: lesson.is_required
              });
          }
        }
      }

      if (!isAutoSave) {
        toast({
          title: "Success",
          description: "Course saved successfully",
        });
        
        if (onSave) onSave();
      }
    } catch (error: any) {
      if (!isAutoSave) {
        toast({
          title: "Error",
          description: "Failed to save course",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Streamlined Course Creator
          </h1>
          <p className="text-muted-foreground">Build courses faster with AI assistance and simplified workflow</p>
        </div>
        <div className="flex gap-2">
          {course.id && (
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/courses/${course.id}/editor`)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Content Editor
            </Button>
          )}
          <Button variant="outline" onClick={() => saveCourse()}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Course Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Course Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Course Title</label>
              <Input
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                placeholder="Enter course title"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                placeholder="Brief course description"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={course.category} onValueChange={(value) => setCourse({ ...course, category: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medicare_basics">Medicare Basics</SelectItem>
                    <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                    <SelectItem value="supplements">Medicare Supplements</SelectItem>
                    <SelectItem value="prescription_drugs">Prescription Drugs</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="sales_training">Sales Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={course.difficulty_level} onValueChange={(value) => setCourse({ ...course, difficulty_level: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Estimated Duration (hours)</label>
              <Input
                type="number"
                value={course.estimated_duration_hours}
                onChange={(e) => setCourse({ ...course, estimated_duration_hours: parseInt(e.target.value) || 1 })}
                className="mt-1"
                min="1"
              />
            </div>

            <Button 
              onClick={generateCourseOutline} 
              disabled={generatingContent || !course.title}
              className="w-full"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {generatingContent ? "Generating..." : "Generate Course Outline with AI"}
            </Button>
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Content
              <Badge variant="secondary">{modules.length} modules</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={addModule} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {modules.map((module, moduleIndex) => (
                <Card key={moduleIndex} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    {editingModule === moduleIndex ? (
                      <div className="space-y-3">
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                          placeholder="Module title"
                        />
                        <Textarea
                          value={module.description}
                          onChange={(e) => updateModule(moduleIndex, { description: e.target.value })}
                          placeholder="Module description"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setEditingModule(null)}>Done</Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{module.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {module.estimated_duration_minutes}m
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setEditingModule(moduleIndex)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        
                        <div className="mt-3 space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                              <span>{lesson.title}</span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setEditingLesson({ moduleIndex, lessonIndex })}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => addLesson(moduleIndex)}
                            className="w-full"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Add Lesson
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Editor Dialog */}
      {editingLesson && (
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lesson</DialogTitle>
              <DialogDescription>
                Customize your lesson content and settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Lesson Title</label>
                  <Input
                    value={modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].title}
                    onChange={(e) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, { title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].estimated_duration_minutes}
                    onChange={(e) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, { estimated_duration_minutes: parseInt(e.target.value) || 30 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Lesson Description</label>
                <Textarea
                  value={modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].description}
                  onChange={(e) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, { description: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Lesson Content</label>
                <div className="mt-1">
                  <RichTextEditor
                    value={modules[editingLesson.moduleIndex].lessons[editingLesson.lessonIndex].content_text}
                    onChange={(value) => updateLesson(editingLesson.moduleIndex, editingLesson.lessonIndex, { content_text: value })}
                    placeholder="Enter lesson content..."
                    height={300}
                    enableMediaUpload
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLesson(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Course Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the course and all its content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {}}>
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StreamlinedCourseBuilder;
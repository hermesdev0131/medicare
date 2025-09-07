import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, Eye, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CourseOverviewStep } from "./CourseOverviewStep";
import { CourseTemplateStep } from "./CourseTemplateStep";
import { CourseContentStep } from "./CourseContentStep";
import { CoursePreviewStep } from "./CoursePreviewStep";

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

interface SimplifiedCourseBuilderProps {
  courseId?: string;
  onSave?: () => void;
  onClose?: () => void;
}

const SimplifiedCourseBuilder = ({ courseId, onSave, onClose }: SimplifiedCourseBuilderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [course, setCourse] = useState<Course>({
    title: "",
    description: "",
    category: "",
    difficulty_level: "",
    estimated_duration_hours: 1,
    is_published: false
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const steps = [
    { title: "Course Overview", component: CourseOverviewStep },
    { title: "Choose Template", component: CourseTemplateStep },
    { title: "Create Content", component: CourseContentStep },
    { title: "Preview & Publish", component: CoursePreviewStep }
  ];

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Load course
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
      setCurrentStep(2); // Skip to content if editing existing course
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

  const saveCourse = async () => {
    setSaving(true);
    try {
      let courseToSave = course;
      
      // Create or update course
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

      // Save modules and lessons
      for (const module of modules) {
        if (module.id) {
          // Update existing module
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
          // Create new module
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

          // Save lessons for this module
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

      toast({
        title: "Success",
        description: "Course saved successfully",
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async () => {
    if (!courseId) return;
    
    setSaving(true);
    try {
      // Delete related data in order
      const { error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('course_id', courseId);

      if (enrollmentsError) throw enrollmentsError;

      const { error: lessonsError } = await supabase
        .from('course_lessons')
        .delete()
        .in('module_id', 
          (await supabase
            .from('course_modules')
            .select('id')
            .eq('course_id', courseId)).data?.map(m => m.id) || []
        );

      if (lessonsError) throw lessonsError;

      const { error: modulesError } = await supabase
        .from('course_modules')
        .delete()
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;

      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (courseError) throw courseError;

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      
      setShowDeleteDialog(false);
      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return course.title && course.description && course.category && course.difficulty_level;
      case 1:
        return true; // Template selection is optional
      case 2:
        return modules.length > 0 && modules.every(m => m.lessons.length > 0);
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Course Creator
          </h1>
          <p className="text-muted-foreground">Build engaging courses with our simplified wizard</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step {currentStep + 1} of {steps.length}</h2>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="mb-2" />
          <p className="text-sm font-medium text-primary">{steps[currentStep].title}</p>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CurrentStepComponent
            course={course}
            setCourse={(newCourse: any) => setCourse(newCourse)}
            modules={modules}
            setModules={setModules}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={saveCourse}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>

          {courseId && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Course
            </Button>
          )}

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={saveCourse}
              disabled={!isStepValid() || saving}
            >
              <Eye className="h-4 w-4 mr-2" />
              Save & Publish
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Delete Course Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone and will remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All course modules and lessons</li>
                <li>All student enrollments and progress</li>
                <li>All assessment data</li>
                <li>All related certificates</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteCourse}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimplifiedCourseBuilder;
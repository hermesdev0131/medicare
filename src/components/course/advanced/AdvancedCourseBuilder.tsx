import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Plus, 
  Copy,
  Archive,
  Share2,
  Users,
  BarChart3,
  Upload,
  FileText,
  Video,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Settings,
  Save,
  Eye,
  Trash2,
  Edit,
  GripVertical,
  MoreHorizontal,
  Download,
  Import,
  Tag,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  instructor_id: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  module_order: number;
  estimated_duration_minutes: number | null;
  is_required: boolean;
  lessons?: Lesson[];
  selected?: boolean;
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
  selected?: boolean;
}

interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{
      title: string;
      lesson_type: string;
      estimated_duration_minutes: number;
    }>;
  }>;
}

interface AdvancedCourseBuilderProps {
  courseId?: string;
  onSave?: () => void;
  onClose?: () => void;
}

const AdvancedCourseBuilder = ({ courseId, onSave, onClose }: AdvancedCourseBuilderProps) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedItems, setSelectedItems] = useState<{modules: string[], lessons: string[]}>({
    modules: [],
    lessons: []
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  const [bulkAction, setBulkAction] = useState<'duplicate' | 'delete' | 'move' | 'publish'>('duplicate');

  useEffect(() => {
    if (courseId) {
      loadCourseData();
      loadAnalytics();
    }
    loadTemplates();
  }, [courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Load course with instructor info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Load modules with lessons
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
            lessons: lessonsData || [],
            selected: false
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

  const loadAnalytics = async () => {
    if (!courseId) return;

    try {
      // Get enrollment analytics
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId);

      // Get lesson progress data
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('course_id', courseId);

      const analytics = {
        totalEnrollments: enrollmentData?.length || 0,
        completionRate: enrollmentData?.filter(e => e.completed_at).length || 0,
        averageProgress: enrollmentData?.reduce((sum, e) => sum + e.progress_percentage, 0) / (enrollmentData?.length || 1),
        engagementMetrics: {
          totalLessonsViewed: progressData?.length || 0,
          averageTimeSpent: progressData?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) / (progressData?.length || 1)
        }
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadTemplates = async () => {
    // Mock Medicare-focused templates
    const medicareTemplates: CourseTemplate[] = [
      {
        id: '1',
        name: 'Medicare Basics Training',
        description: 'Comprehensive Medicare fundamentals course template',
        category: 'medicare',
        modules: [
          {
            title: 'Medicare Parts A & B Overview',
            description: 'Original Medicare coverage and benefits',
            lessons: [
              { title: 'Part A Hospital Coverage', lesson_type: 'video', estimated_duration_minutes: 30 },
              { title: 'Part B Medical Coverage', lesson_type: 'video', estimated_duration_minutes: 30 },
              { title: 'Part A & B Quiz', lesson_type: 'quiz', estimated_duration_minutes: 15 }
            ]
          },
          {
            title: 'Medicare Advantage (Part C)',
            description: 'Understanding Medicare Advantage plans',
            lessons: [
              { title: 'MA Plan Benefits', lesson_type: 'text', estimated_duration_minutes: 25 },
              { title: 'Network Restrictions', lesson_type: 'video', estimated_duration_minutes: 20 },
              { title: 'MA Assessment', lesson_type: 'quiz', estimated_duration_minutes: 15 }
            ]
          },
          {
            title: 'Medicare Part D Prescription Coverage',
            description: 'Prescription drug coverage essentials',
            lessons: [
              { title: 'Part D Basics', lesson_type: 'text', estimated_duration_minutes: 20 },
              { title: 'Coverage Gap & Catastrophic Coverage', lesson_type: 'video', estimated_duration_minutes: 25 },
              { title: 'Part D Knowledge Check', lesson_type: 'quiz', estimated_duration_minutes: 10 }
            ]
          }
        ]
      },
      {
        id: '2',
        name: 'Medicare Compliance & Marketing',
        description: 'CMS compliance and marketing guidelines',
        category: 'compliance',
        modules: [
          {
            title: 'CMS Marketing Guidelines',
            description: 'Understanding marketing compliance requirements',
            lessons: [
              { title: 'Marketing Material Guidelines', lesson_type: 'text', estimated_duration_minutes: 30 },
              { title: 'Prohibited Marketing Practices', lesson_type: 'video', estimated_duration_minutes: 25 },
              { title: 'Compliance Scenarios', lesson_type: 'interactive', estimated_duration_minutes: 20 }
            ]
          },
          {
            title: 'Sales Event Requirements',
            description: 'Proper sales event procedures',
            lessons: [
              { title: 'Educational vs Sales Events', lesson_type: 'video', estimated_duration_minutes: 20 },
              { title: 'Documentation Requirements', lesson_type: 'text', estimated_duration_minutes: 15 },
              { title: 'Event Compliance Quiz', lesson_type: 'quiz', estimated_duration_minutes: 15 }
            ]
          }
        ]
      }
    ];
    
    setTemplates(medicareTemplates);
  };

  const applyTemplate = async (template: CourseTemplate) => {
    if (!courseId) return;

    try {
      setSaving(true);
      
      for (const moduleTemplate of template.modules) {
        // Create module
        const { data: moduleData, error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            title: moduleTemplate.title,
            description: moduleTemplate.description,
            module_order: modules.length + 1,
            estimated_duration_minutes: moduleTemplate.lessons.reduce((sum, l) => sum + l.estimated_duration_minutes, 0),
            is_required: true
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Create lessons for this module
        for (const lessonTemplate of moduleTemplate.lessons) {
          const { error: lessonError } = await supabase
            .from('course_lessons')
            .insert({
              module_id: moduleData.id,
              title: lessonTemplate.title,
              lesson_type: lessonTemplate.lesson_type,
              estimated_duration_minutes: lessonTemplate.estimated_duration_minutes,
              lesson_order: moduleTemplate.lessons.indexOf(lessonTemplate) + 1,
              is_required: true
            });

          if (lessonError) throw lessonError;
        }
      }

      await loadCourseData();
      setShowTemplateDialog(false);
      
      toast({
        title: "Success",
        description: "Template applied successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = async () => {
    try {
      setSaving(true);
      
      switch (bulkAction) {
        case 'duplicate':
          await duplicateSelectedItems();
          break;
        case 'delete':
          await deleteSelectedItems();
          break;
        case 'move':
          // Implementation for moving items
          break;
        case 'publish':
          await publishSelectedItems();
          break;
      }

      setSelectedItems({ modules: [], lessons: [] });
      setShowBulkDialog(false);
      await loadCourseData();
      
      toast({
        title: "Success",
        description: `Bulk ${bulkAction} completed successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${bulkAction} selected items`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const duplicateSelectedItems = async () => {
    // Implementation for duplicating modules/lessons
  };

  const deleteSelectedItems = async () => {
    // Delete selected lessons
    if (selectedItems.lessons.length > 0) {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .in('id', selectedItems.lessons);
      
      if (error) throw error;
    }

    // Delete selected modules
    if (selectedItems.modules.length > 0) {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .in('id', selectedItems.modules);
      
      if (error) throw error;
    }
  };

  const publishSelectedItems = async () => {
    // Implementation for publishing modules/lessons
  };

  const exportCourse = async () => {
    // Implementation for exporting course data
    const courseData = {
      course,
      modules,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(courseData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course?.title || 'course'}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleItemSelection = (type: 'module' | 'lesson', id: string) => {
    if (type === 'module') {
      setSelectedItems(prev => ({
        ...prev,
        modules: prev.modules.includes(id) 
          ? prev.modules.filter(i => i !== id)
          : [...prev.modules, id]
      }));
    } else {
      setSelectedItems(prev => ({
        ...prev,
        lessons: prev.lessons.includes(id)
          ? prev.lessons.filter(i => i !== id)
          : [...prev.lessons, id]
      }));
    }
  };

  const selectAllModules = () => {
    const allModuleIds = modules.map(m => m.id);
    setSelectedItems(prev => ({
      ...prev,
      modules: prev.modules.length === allModuleIds.length ? [] : allModuleIds
    }));
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
      {/* Header with advanced actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{course?.title || "Advanced Course Builder"}</h1>
          <p className="text-muted-foreground">Professional course creation with advanced features</p>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowTemplateDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Apply Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCourse}>
                <Download className="h-4 w-4 mr-2" />
                Export Course
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Import className="h-4 w-4 mr-2" />
                Import Content
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Course
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(selectedItems.modules.length > 0 || selectedItems.lessons.length > 0) && (
            <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
              <Tag className="h-4 w-4 mr-2" />
              Bulk Actions ({selectedItems.modules.length + selectedItems.lessons.length})
            </Button>
          )}
          
          <Button variant="outline" onClick={onClose}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => course && onSave?.()} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="collaboration">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Course overview with enhanced stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modules.length}</div>
                <p className="text-xs text-muted-foreground">
                  {modules.filter(m => m.is_required).length} required
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {modules.length} modules
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalEnrollments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.completionRate || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics?.averageProgress || 0)}%</div>
                <Progress value={analytics?.averageProgress || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Enhanced content management */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">Course Content</h2>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={selectedItems.modules.length === modules.length}
                  onCheckedChange={selectAllModules}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add from Template
            </Button>
          </div>

          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <Card key={module.id} className={`p-4 ${selectedItems.modules.includes(module.id) ? 'ring-2 ring-primary' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      checked={selectedItems.modules.includes(module.id)}
                      onCheckedChange={() => toggleItemSelection('module', module.id)}
                    />
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
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Lessons within module */}
                <div className="ml-8 space-y-2">
                  {module.lessons?.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className={`flex items-center justify-between p-2 rounded border ${selectedItems.lessons.includes(lesson.id) ? 'bg-primary/5 border-primary' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={selectedItems.lessons.includes(lesson.id)}
                          onCheckedChange={() => toggleItemSelection('lesson', lesson.id)}
                        />
                        <div className="flex items-center space-x-2">
                          {lesson.lesson_type === 'video' && <Video className="h-4 w-4" />}
                          {lesson.lesson_type === 'text' && <FileText className="h-4 w-4" />}
                          {lesson.lesson_type === 'quiz' && <CheckCircle className="h-4 w-4" />}
                          <span className="text-sm">{lesson.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {lesson.estimated_duration_minutes}min
                        </Badge>
                        {lesson.is_required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Course analytics dashboard */}
          <h2 className="text-2xl font-bold">Course Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Lessons Viewed</span>
                  <Badge>{analytics?.engagementMetrics?.totalLessonsViewed || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg Time per Lesson</span>
                  <Badge>{Math.round(analytics?.engagementMetrics?.averageTimeSpent || 0)} min</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate</span>
                  <Badge>{Math.round((analytics?.completionRate / analytics?.totalEnrollments) * 100 || 0)}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Progress</span>
                    <span>{Math.round(analytics?.averageProgress || 0)}%</span>
                  </div>
                  <Progress value={analytics?.averageProgress || 0} />
                </div>
                <div className="text-center pt-4">
                  <p className="text-2xl font-bold">{analytics?.totalEnrollments || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Enrollments</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          {/* Team collaboration features */}
          <h2 className="text-2xl font-bold">Team Collaboration</h2>
          <Card>
            <CardHeader>
              <CardTitle>Course Collaborators</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Invite team members to collaborate on this course.</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Collaborator
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Advanced course settings */}
          <h2 className="text-2xl font-bold">Course Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Course Status</span>
                  <Badge variant={course?.is_published ? "default" : "secondary"}>
                    {course?.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <Button size="sm">
                  {course?.is_published ? "Unpublish" : "Publish"} Course
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Auto-grading</span>
                  <Checkbox />
                </div>
                <div className="flex items-center justify-between">
                  <span>Discussion Forums</span>
                  <Checkbox />
                </div>
                <div className="flex items-center justify-between">
                  <span>Progress Tracking</span>
                  <Checkbox defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Apply Course Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className="w-fit">{template.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Modules:</span>
                      <Badge variant="outline">{template.modules.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Lessons:</span>
                      <Badge variant="outline">
                        {template.modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => applyTemplate(template)}
                    disabled={saving}
                  >
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedItems.modules.length} modules and {selectedItems.lessons.length} lessons selected
              </p>
              <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="move">Move to Another Course</SelectItem>
                  <SelectItem value="publish">Publish/Unpublish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAction} disabled={saving}>
                Apply Action
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedCourseBuilder;
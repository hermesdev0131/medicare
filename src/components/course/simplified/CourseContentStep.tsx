import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  BookOpen, 
  Play, 
  CheckCircle, 
  FileText, 
  GripVertical, 
  Edit,
  Trash2,
  Sparkles,
  Clock
} from "lucide-react";
import RichTextEditor from "../RichTextEditor";

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
  lesson_order: number;
  estimated_duration_minutes: number;
  is_required: boolean;
}

interface CourseContentStepProps {
  modules: Module[];
  setModules: (modules: Module[]) => void;
}

export const CourseContentStep = ({ modules, setModules }: CourseContentStepProps) => {
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    estimated_duration_minutes: 60,
    is_required: true
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    lesson_type: "text",
    content_text: "",
    content_url: "",
    video_url: "",
    estimated_duration_minutes: 30,
    is_required: true
  });

  const resetModuleForm = () => {
    setModuleForm({
      title: "",
      description: "",
      estimated_duration_minutes: 60,
      is_required: true
    });
    setEditingModule(null);
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      description: "",
      lesson_type: "text",
      content_text: "",
      content_url: "",
      video_url: "",
      estimated_duration_minutes: 30,
      is_required: true
    });
    setEditingLesson(null);
    setSelectedModuleIndex(null);
  };

  const openModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({
        title: module.title,
        description: module.description,
        estimated_duration_minutes: module.estimated_duration_minutes,
        is_required: module.is_required
      });
    } else {
      resetModuleForm();
    }
    setShowModuleDialog(true);
  };

  const openLessonDialog = (moduleIndex: number, lesson?: Lesson) => {
    setSelectedModuleIndex(moduleIndex);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description,
        lesson_type: lesson.lesson_type,
        content_text: lesson.content_text,
        content_url: lesson.content_url || "",
        video_url: lesson.video_url || "",
        estimated_duration_minutes: lesson.estimated_duration_minutes,
        is_required: lesson.is_required
      });
    } else {
      resetLessonForm();
      setSelectedModuleIndex(moduleIndex);
    }
    setShowLessonDialog(true);
  };

  const saveModule = () => {
    if (editingModule) {
      // Update existing module
      setModules(modules.map(m => 
        m.id === editingModule.id || (m.title === editingModule.title && m.module_order === editingModule.module_order)
          ? { ...m, ...moduleForm }
          : m
      ));
    } else {
      // Add new module
      const newModule: Module = {
        id: `temp-${Date.now()}`,
        ...moduleForm,
        module_order: modules.length + 1,
        lessons: []
      };
      setModules([...modules, newModule]);
    }
    setShowModuleDialog(false);
    resetModuleForm();
  };

  const saveLesson = () => {
    if (selectedModuleIndex === null) return;

    const updatedModules = [...modules];
    const module = updatedModules[selectedModuleIndex];

    if (editingLesson) {
      // Update existing lesson
      module.lessons = module.lessons.map(l =>
        l.id === editingLesson.id || (l.title === editingLesson.title && l.lesson_order === editingLesson.lesson_order)
          ? { ...l, ...lessonForm }
          : l
      );
    } else {
      // Add new lesson
      const newLesson: Lesson = {
        id: `temp-lesson-${Date.now()}`,
        ...lessonForm,
        lesson_order: module.lessons.length + 1
      };
      module.lessons.push(newLesson);
    }

    setModules(updatedModules);
    setShowLessonDialog(false);
    resetLessonForm();
  };

  const deleteModule = (moduleIndex: number) => {
    setModules(modules.filter((_, index) => index !== moduleIndex));
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
    setModules(updatedModules);
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
      case 'video': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'quiz': return 'bg-green-50 text-green-700 border-green-200';
      case 'assignment': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const totalDuration = modules.reduce((sum, module) => 
    sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.estimated_duration_minutes, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-2xl font-bold">
              {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(totalDuration / 60)}h</p>
            <p className="text-sm text-muted-foreground">Total Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Module Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <Button onClick={() => openModuleDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <Card key={module.id || moduleIndex} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div>
                    <CardTitle className="text-lg">
                      Module {moduleIndex + 1}: {module.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {module.lessons.length} lessons
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(module.estimated_duration_minutes / 60)}h
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openModuleDialog(module)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteModule(moduleIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                {module.lessons.map((lesson, lessonIndex) => (
                  <div 
                    key={lesson.id || lessonIndex}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded border ${getLessonTypeColor(lesson.lesson_type)}`}>
                        {getLessonTypeIcon(lesson.lesson_type)}
                      </div>
                      <div>
                        <p className="font-medium">
                          Lesson {lessonIndex + 1}: {lesson.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.lesson_type} • {lesson.estimated_duration_minutes}min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={lesson.is_required ? "default" : "secondary"}>
                        {lesson.is_required ? "Required" : "Optional"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openLessonDialog(moduleIndex, lesson)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => openLessonDialog(moduleIndex)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson to Module {moduleIndex + 1}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {modules.length === 0 && (
          <Card className="p-8 text-center border-dashed">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create Your First Module</h3>
            <p className="text-muted-foreground mb-4">
              Modules help organize your course content into logical sections
            </p>
            <Button onClick={() => openModuleDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Module
            </Button>
          </Card>
        )}
      </div>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Edit Module" : "Add New Module"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Module Title *</label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="e.g., Introduction to Medicare"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <Input
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Brief description of what this module covers"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Estimated Duration (minutes)</label>
              <Input
                type="number"
                value={moduleForm.estimated_duration_minutes}
                onChange={(e) => setModuleForm({ ...moduleForm, estimated_duration_minutes: parseInt(e.target.value) || 60 })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveModule} disabled={!moduleForm.title}>
                {editingModule ? "Update" : "Add"} Module
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Edit Lesson" : "Add New Lesson"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Lesson Title *</label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g., Understanding Medicare Part A"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Lesson Type *</label>
                <Select 
                  value={lessonForm.lesson_type} 
                  onValueChange={(value) => setLessonForm({ ...lessonForm, lesson_type: value })}
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
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <Input
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                placeholder="Brief description of this lesson"
              />
            </div>

            {lessonForm.lesson_type === 'text' && (
              <div>
                <label className="text-sm font-medium block mb-2">Content *</label>
                <RichTextEditor
                  value={lessonForm.content_text}
                  onChange={(value) => setLessonForm({ ...lessonForm, content_text: value })}
                  placeholder="Enter your lesson content here..."
                  height={300}
                  enableMediaUpload={true}
                />
              </div>
            )}

            {lessonForm.lesson_type === 'video' && (
              <div>
                <label className="text-sm font-medium block mb-2">Video URL</label>
                <Input
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  value={lessonForm.estimated_duration_minutes}
                  onChange={(e) => setLessonForm({ ...lessonForm, estimated_duration_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="required"
                  checked={lessonForm.is_required}
                  onChange={(e) => setLessonForm({ ...lessonForm, is_required: e.target.checked })}
                />
                <label htmlFor="required" className="text-sm font-medium">Required lesson</label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveLesson} disabled={!lessonForm.title}>
                {editingLesson ? "Update" : "Add"} Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
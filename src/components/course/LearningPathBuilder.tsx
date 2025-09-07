import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  BookOpen, 
  GripVertical, 
  ArrowRight, 
  Clock, 
  Users, 
  Target,
  Edit,
  Trash2,
  Save,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string;
  estimated_total_hours: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string | null;
  estimated_duration_hours: number | null;
  is_published: boolean;
}

interface PathCourse {
  id: string;
  course_id: string;
  course_order: number;
  is_required: boolean;
  course: Course;
}

interface LearningPathBuilderProps {
  pathId?: string;
  onSave?: () => void;
  onClose?: () => void;
}

const LearningPathBuilder = ({ pathId, onSave, onClose }: LearningPathBuilderProps) => {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [pathCourses, setPathCourses] = useState<PathCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const { toast } = useToast();

  const [newPath, setNewPath] = useState({
    title: "",
    description: "",
    category: "",
    difficulty_level: "beginner",
    estimated_total_hours: 8
  });

  useEffect(() => {
    loadAvailableCourses();
    if (pathId) {
      loadLearningPathData();
    }
  }, [pathId]);

  const loadAvailableCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setAvailableCourses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load available courses",
        variant: "destructive",
      });
    }
  };

  const loadLearningPathData = async () => {
    if (!pathId) return;
    
    setLoading(true);
    try {
      // Load learning path basic info
      const { data: pathData, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .single();

      if (pathError) throw pathError;
      setLearningPath(pathData);

      // Load path courses
      const { data: pathCoursesData, error: pathCoursesError } = await supabase
        .from('path_courses')
        .select('*')
        .eq('path_id', pathId)
        .order('course_order');

      if (pathCoursesError) throw pathCoursesError;
      
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
      
      setPathCourses(formattedPathCourses);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load learning path data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLearningPath = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setSaving(true);
      const { data, error } = await supabase
        .from('learning_paths')
        .insert({
          ...newPath,
          creator_id: user.id,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      setLearningPath(data);
      toast({
        title: "Success",
        description: "Learning path created successfully",
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create learning path",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLearningPath = async (pathData: Partial<LearningPath>) => {
    if (!pathId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('learning_paths')
        .update(pathData)
        .eq('id', pathId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Learning path updated successfully",
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update learning path",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCourseToPath = async () => {
    if (!pathId || !selectedCourseId) return;
    
    try {
      const { error } = await supabase
        .from('path_courses')
        .insert({
          path_id: pathId,
          course_id: selectedCourseId,
          course_order: pathCourses.length + 1,
          is_required: true
        });

      if (error) throw error;

      setSelectedCourseId("");
      setShowAddCourseDialog(false);
      loadLearningPathData();

      toast({
        title: "Success",
        description: "Course added to learning path",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add course to path",
        variant: "destructive",
      });
    }
  };

  const removeCourseFromPath = async (pathCourseId: string) => {
    try {
      const { error } = await supabase
        .from('path_courses')
        .delete()
        .eq('id', pathCourseId);

      if (error) throw error;

      loadLearningPathData();
      toast({
        title: "Success",
        description: "Course removed from learning path",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove course from path",
        variant: "destructive",
      });
    }
  };

  const reorderCourses = async (courseId: string, newOrder: number) => {
    // Implementation for drag-and-drop reordering
    // This would update the course_order in the database
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalEstimatedHours = pathCourses.reduce((sum, pc) => sum + (pc.course.estimated_duration_hours || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {learningPath ? learningPath.title : "Create Learning Path"}
          </h1>
          <p className="text-muted-foreground">Design structured learning journeys with multiple courses</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={() => learningPath ? updateLearningPath(learningPath) : createLearningPath()} 
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Path Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Path Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={learningPath?.title || newPath.title}
                  onChange={(e) => {
                    if (learningPath) {
                      setLearningPath({ ...learningPath, title: e.target.value });
                    } else {
                      setNewPath({ ...newPath, title: e.target.value });
                    }
                  }}
                  placeholder="Learning path title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={learningPath?.description || newPath.description}
                  onChange={(e) => {
                    if (learningPath) {
                      setLearningPath({ ...learningPath, description: e.target.value });
                    } else {
                      setNewPath({ ...newPath, description: e.target.value });
                    }
                  }}
                  placeholder="Path description"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={learningPath?.category || newPath.category} 
                  onValueChange={(value) => {
                    if (learningPath) {
                      setLearningPath({ ...learningPath, category: value });
                    } else {
                      setNewPath({ ...newPath, category: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="life-insurance">Life Insurance</SelectItem>
                    <SelectItem value="health-insurance">Health Insurance</SelectItem>
                    <SelectItem value="property-casualty">Property & Casualty</SelectItem>
                    <SelectItem value="onboarding">Agent Onboarding</SelectItem>
                    <SelectItem value="advanced-training">Advanced Training</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Difficulty Level</label>
                <Select 
                  value={learningPath?.difficulty_level || newPath.difficulty_level} 
                  onValueChange={(value) => {
                    if (learningPath) {
                      setLearningPath({ ...learningPath, difficulty_level: value });
                    } else {
                      setNewPath({ ...newPath, difficulty_level: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Path Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Path Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Courses</span>
                </div>
                <Badge variant="outline">{pathCourses.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Estimated Duration</span>
                </div>
                <Badge variant="outline">{totalEstimatedHours}h</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Required Courses</span>
                </div>
                <Badge variant="outline">
                  {pathCourses.filter(pc => pc.is_required).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Sequence */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Course Sequence</h2>
            {learningPath && (
              <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Course to Path</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Course</label>
                      <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourses
                            .filter(course => !pathCourses.some(pc => pc.course_id === course.id))
                            .map(course => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddCourseDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addCourseToPath} disabled={!selectedCourseId}>
                        Add Course
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-4">
            {pathCourses.map((pathCourse, index) => (
              <Card key={pathCourse.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{pathCourse.course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {pathCourse.course.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor(pathCourse.course.difficulty_level || 'beginner')}>
                          {pathCourse.course.difficulty_level}
                        </Badge>
                        <Badge variant={pathCourse.is_required ? "default" : "secondary"}>
                          {pathCourse.is_required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{pathCourse.course.estimated_duration_hours}h</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{pathCourse.course.category?.replace('-', ' ')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => removeCourseFromPath(pathCourse.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {index < pathCourses.length - 1 && (
                    <div className="flex items-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {pathCourses.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {learningPath 
                  ? "No courses added yet. Add your first course to create the learning path!" 
                  : "Create the learning path first, then add courses to build the sequence."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPathBuilder;
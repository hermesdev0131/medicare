import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Users, Clock, BarChart3, Edit, Settings, Route, Layers, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import StreamlinedCourseBuilder from "@/components/course/StreamlinedCourseBuilder";
import LearningPathBuilder from "@/components/course/LearningPathBuilder";

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
  created_at: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string;
  estimated_total_hours: number | null;
  is_published: boolean;
  created_at: string;
}

const InstructionalDesignerDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatePathDialogOpen, setIsCreatePathDialogOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [deletingPathId, setDeletingPathId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
    difficulty_level: "",
    estimated_duration_hours: 1
  });

  const [newPath, setNewPath] = useState({
    title: "",
    description: "",
    category: "",
    difficulty_level: "beginner",
    estimated_total_hours: 8
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Load learning paths
      const { data: pathsData, error: pathsError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (pathsError) throw pathsError;
      setLearningPaths(pathsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCreating(true);
      const { error } = await supabase
        .from('courses')
        .insert({
          ...newCourse,
          instructor_id: user.id,
          is_published: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      setNewCourse({
        title: "",
        description: "",
        category: "",
        difficulty_level: "",
        estimated_duration_hours: 1
      });
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const createLearningPath = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCreating(true);
      const { error } = await supabase
        .from('learning_paths')
        .insert({
          ...newPath,
          creator_id: user.id,
          is_published: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Learning path created successfully",
      });

      setNewPath({
        title: "",
        description: "",
        category: "",
        difficulty_level: "beginner",
        estimated_total_hours: 8
      });
      setIsCreatePathDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create learning path",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const togglePublishCourse = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Course ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      });
    }
  };

  const togglePublishPath = async (pathId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('learning_paths')
        .update({ is_published: !currentStatus })
        .eq('id', pathId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Learning path ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update learning path status",
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      // First delete related data in order
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
      
      setDeletingCourseId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const deleteLearningPath = async (pathId: string) => {
    try {
      // First delete related enrollments
      const { error: enrollmentsError } = await supabase
        .from('path_enrollments')
        .delete()
        .eq('path_id', pathId);

      if (enrollmentsError) throw enrollmentsError;

      // Delete path courses associations
      const { error: pathCoursesError } = await supabase
        .from('path_courses')
        .delete()
        .eq('path_id', pathId);

      if (pathCoursesError) throw pathCoursesError;

      // Delete the learning path
      const { error: pathError } = await supabase
        .from('learning_paths')
        .delete()
        .eq('id', pathId);

      if (pathError) throw pathError;

      toast({
        title: "Success",
        description: "Learning path deleted successfully",
      });
      
      setDeletingPathId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete learning path",
        variant: "destructive",
      });
    }
  };

  // Show course builder if editing a course
  if (editingCourseId) {
    return (
      <StreamlinedCourseBuilder
        courseId={editingCourseId}
        onSave={() => {
          setEditingCourseId(null);
          loadData();
        }}
        onClose={() => setEditingCourseId(null)}
      />
    );
  }

  // Show learning path builder if editing a path
  if (editingPathId) {
    return (
      <LearningPathBuilder
        pathId={editingPathId}
        onSave={() => {
          setEditingPathId(null);
          loadData();
        }}
        onClose={() => setEditingPathId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Instructional Designer Dashboard</h1>
            <p className="text-muted-foreground">Create and manage e-learning courses for insurance agents</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new course. You can always edit these later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Course Title</label>
                  <Input
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="Enter course title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Enter course description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newCourse.category} onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}>
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
                    <Select value={newCourse.difficulty_level} onValueChange={(value) => setNewCourse({ ...newCourse, difficulty_level: value })}>
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
                <div>
                  <label className="text-sm font-medium">Estimated Duration (hours)</label>
                  <Input
                    type="number"
                    min="1"
                    value={newCourse.estimated_duration_hours}
                    onChange={(e) => setNewCourse({ ...newCourse, estimated_duration_hours: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCourse} disabled={creating || !newCourse.title}>
                    {creating ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreatePathDialogOpen} onOpenChange={setIsCreatePathDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Route className="h-4 w-4 mr-2" />
                Create Learning Path
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Learning Path</DialogTitle>
                <DialogDescription>
                  Create a structured learning journey by combining multiple courses.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Path Title</label>
                  <Input
                    value={newPath.title}
                    onChange={(e) => setNewPath({ ...newPath, title: e.target.value })}
                    placeholder="Enter learning path title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newPath.description}
                    onChange={(e) => setNewPath({ ...newPath, description: e.target.value })}
                    placeholder="Enter path description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newPath.category} onValueChange={(value) => setNewPath({ ...newPath, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Agent Onboarding</SelectItem>
                        <SelectItem value="life-insurance">Life Insurance Track</SelectItem>
                        <SelectItem value="health-insurance">Health Insurance Track</SelectItem>
                        <SelectItem value="advanced-training">Advanced Training</SelectItem>
                        <SelectItem value="compliance">Compliance Track</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <Select value={newPath.difficulty_level} onValueChange={(value) => setNewPath({ ...newPath, difficulty_level: value })}>
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
                <div>
                  <label className="text-sm font-medium">Estimated Total Duration (hours)</label>
                  <Input
                    type="number"
                    min="1"
                    value={newPath.estimated_total_hours}
                    onChange={(e) => setNewPath({ ...newPath, estimated_total_hours: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreatePathDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createLearningPath} disabled={creating || !newPath.title}>
                    {creating ? "Creating..." : "Create Learning Path"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Learning Paths</CardTitle>
                  <Route className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{learningPaths.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.filter(c => c.is_published).length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.reduce((sum, c) => sum + c.enrollment_count, 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {courses.filter(c => c.average_rating).length > 0 
                      ? (courses.reduce((sum, c) => sum + (c.average_rating || 0), 0) / courses.filter(c => c.average_rating).length).toFixed(1)
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {course.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      {course.category && (
                        <div className="flex items-center">
                          <span className="font-medium">Category:</span>
                          <span className="ml-2 capitalize">{course.category.replace('-', ' ')}</span>
                        </div>
                      )}
                      {course.difficulty_level && (
                        <div className="flex items-center">
                          <span className="font-medium">Level:</span>
                          <span className="ml-2 capitalize">{course.difficulty_level}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="font-medium">Enrollments:</span>
                        <span className="ml-2">{course.enrollment_count}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4 flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => togglePublishCourse(course.id, course.is_published)}
                      >
                        {course.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingCourseId(course.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate(`/courses/${course.id}/editor`)}
                        className="text-primary hover:text-primary"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Content
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setDeletingCourseId(course.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No courses created yet. Create your first course to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="paths" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{path.title}</CardTitle>
                      <Badge variant={path.is_published ? "default" : "secondary"}>
                        {path.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {path.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      {path.category && (
                        <div className="flex items-center">
                          <span className="font-medium">Category:</span>
                          <span className="ml-2 capitalize">{path.category.replace('-', ' ')}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="font-medium">Level:</span>
                        <span className="ml-2 capitalize">{path.difficulty_level}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Duration:</span>
                        <span className="ml-2">{path.estimated_total_hours}h</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => togglePublishPath(path.id, path.is_published)}
                      >
                        {path.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingPathId(path.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setDeletingPathId(path.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {learningPaths.length === 0 && (
              <div className="text-center py-12">
                <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No learning paths created yet. Create your first learning path to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Enrollments</span>
                      <span className="font-bold">{courses.reduce((sum, c) => sum + c.enrollment_count, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Rating</span>
                      <span className="font-bold">
                        {courses.filter(c => c.average_rating).length > 0 
                          ? (courses.reduce((sum, c) => sum + (c.average_rating || 0), 0) / courses.filter(c => c.average_rating).length).toFixed(1)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Published Courses</span>
                      <span className="font-bold">{courses.filter(c => c.is_published).length}/{courses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Published Paths</span>
                      <span className="font-bold">{learningPaths.filter(p => p.is_published).length}/{learningPaths.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <div className="w-full bg-slate-900 py-6 shadow-xl border-t border-slate-800 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-slate-300 font-medium">
              © 2024 Insurance Training HQ. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Course Confirmation Dialog */}
      <Dialog open={!!deletingCourseId} onOpenChange={() => setDeletingCourseId(null)}>
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
            <Button variant="outline" onClick={() => setDeletingCourseId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingCourseId && deleteCourse(deletingCourseId)}
            >
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Learning Path Confirmation Dialog */}
      <Dialog open={!!deletingPathId} onOpenChange={() => setDeletingPathId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Learning Path</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this learning path? This action cannot be undone and will remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The learning path structure</li>
                <li>All student enrollments and progress</li>
                <li>All course associations</li>
                <li>All related certificates</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPathId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingPathId && deleteLearningPath(deletingPathId)}
            >
              Delete Learning Path
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructionalDesignerDashboard;
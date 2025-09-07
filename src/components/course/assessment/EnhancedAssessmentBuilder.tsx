import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  CheckCircle, 
  Circle,
  Image,
  Video,
  Volume2,
  Timer,
  Target,
  Award,
  GripVertical
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Assessment {
  id?: string;
  title: string;
  description?: string;
  assessment_type: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  is_required: boolean;
  course_id?: string;
  module_id?: string;
  lesson_id?: string;
}

interface AssessmentQuestion {
  id?: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answers: any;
  points: number;
  question_order: number;
  explanation?: string;
  media_url?: string;
  media_type?: string;
  interaction_type?: string;
}

interface EnhancedAssessmentBuilderProps {
  assessmentId?: string;
  courseId?: string;
  onSave?: () => void;
  onClose?: () => void;
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: Circle },
  { value: 'true_false', label: 'True/False', icon: CheckCircle },
  { value: 'fill_blank', label: 'Fill in the Blank', icon: Edit },
  { value: 'matching', label: 'Matching', icon: Target },
  { value: 'ordering', label: 'Ordering', icon: GripVertical },
  { value: 'essay', label: 'Essay', icon: Edit },
  { value: 'drag_drop', label: 'Drag & Drop', icon: GripVertical },
  { value: 'hotspot', label: 'Image Hotspot', icon: Image }
];

const DraggableQuestion = ({ 
  question, 
  index, 
  onEdit, 
  onDelete, 
  moveQuestion 
}: {
  question: AssessmentQuestion;
  index: number;
  onEdit: (question: AssessmentQuestion) => void;
  onDelete: (index: number) => void;
  moveQuestion: (dragIndex: number, hoverIndex: number) => void;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'question',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'question',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveQuestion(item.index, index);
        item.index = index;
      }
    },
  });

  const questionType = QUESTION_TYPES.find(type => type.value === question.question_type);
  const IconComponent = questionType?.icon || Circle;

  return (
    <motion.div
      ref={(node) => drag(drop(node))}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="cursor-move"
    >
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
              <IconComponent className="h-5 w-5 text-primary mt-1" />
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <Badge variant="outline">{questionType?.label}</Badge>
                  <Badge variant="secondary">{question.points} pts</Badge>
                </div>
                
                <div 
                  className="text-sm text-muted-foreground line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: question.question_text }}
                />
                
                {question.media_url && (
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    {question.media_type === 'image' ? (
                      <Image className="h-3 w-3 mr-1" />
                    ) : question.media_type === 'video' ? (
                      <Video className="h-3 w-3 mr-1" />
                    ) : (
                      <Volume2 className="h-3 w-3 mr-1" />
                    )}
                    Media attached
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" onClick={() => onEdit(question)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const QuestionEditor = ({ 
  question, 
  onSave, 
  onCancel 
}: {
  question: AssessmentQuestion | null;
  onSave: (question: AssessmentQuestion) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<AssessmentQuestion>({
    question_text: '',
    question_type: 'multiple_choice',
    options: [],
    correct_answers: [],
    points: 1,
    question_order: 1,
    explanation: '',
    interaction_type: 'standard'
  });

  useEffect(() => {
    if (question) {
      setFormData(question);
    }
  }, [question]);

  const addOption = () => {
    const newOptions = [...(formData.options || []), ''];
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    
    // Update correct answers if necessary
    const newCorrectAnswers = (formData.correct_answers || []).filter((answer: number) => answer !== index);
    
    setFormData({ 
      ...formData, 
      options: newOptions,
      correct_answers: newCorrectAnswers
    });
  };

  const toggleCorrectAnswer = (index: number) => {
    const correctAnswers = formData.correct_answers || [];
    
    if (formData.question_type === 'multiple_choice' && !correctAnswers.includes(index)) {
      // For multiple choice, allow multiple correct answers
      setFormData({ 
        ...formData, 
        correct_answers: [...correctAnswers, index] 
      });
    } else if (correctAnswers.includes(index)) {
      // Remove from correct answers
      setFormData({ 
        ...formData, 
        correct_answers: correctAnswers.filter((answer: number) => answer !== index) 
      });
    } else {
      // For single answer questions, replace the correct answer
      setFormData({ 
        ...formData, 
        correct_answers: [index] 
      });
    }
  };

  const renderQuestionTypeOptions = () => {
    switch (formData.question_type) {
      case 'multiple_choice':
      case 'true_false':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Answer Options</label>
              <Button size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
            
            {(formData.options || []).map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-3">
                <Button
                  size="sm"
                  variant={formData.correct_answers?.includes(index) ? "default" : "outline"}
                  onClick={() => toggleCorrectAnswer(index)}
                  className="w-8 h-8 p-0"
                >
                  {formData.correct_answers?.includes(index) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </Button>
                
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">Correct Answer(s)</label>
            <Textarea
              value={Array.isArray(formData.correct_answers) ? formData.correct_answers.join(', ') : ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                correct_answers: e.target.value.split(',').map(s => s.trim()) 
              })}
              placeholder="Enter correct answers separated by commas"
            />
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">Grading Rubric</label>
            <Textarea
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Describe the grading criteria and key points to look for..."
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Question Type</label>
          <Select 
            value={formData.question_type} 
            onValueChange={(value) => setFormData({ 
              ...formData, 
              question_type: value,
              options: [],
              correct_answers: []
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center space-x-2">
                    <type.icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Points</label>
          <Input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
            min="1"
            max="100"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Question Text</label>
        <Textarea
          value={formData.question_text}
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
          placeholder="Enter your question..."
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Media (Optional)</label>
        <div className="flex space-x-2">
          <Input
            value={formData.media_url || ''}
            onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
            placeholder="Image/Video/Audio URL"
            className="flex-1"
          />
          
          <Select 
            value={formData.media_type || ''} 
            onValueChange={(value) => setFormData({ ...formData, media_type: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderQuestionTypeOptions()}

      <div>
        <label className="text-sm font-medium">Explanation (Optional)</label>
        <Textarea
          value={formData.explanation || ''}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          placeholder="Explain the correct answer or provide additional context..."
          rows={2}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)}>
          <Save className="h-4 w-4 mr-2" />
          Save Question
        </Button>
      </div>
    </div>
  );
};

const EnhancedAssessmentBuilder = ({ 
  assessmentId, 
  courseId, 
  onSave, 
  onClose 
}: EnhancedAssessmentBuilderProps) => {
  const [assessment, setAssessment] = useState<Assessment>({
    title: '',
    description: '',
    assessment_type: 'quiz',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: 30,
    is_required: true,
    course_id: courseId
  });
  
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    if (!assessmentId) return;
    
    setLoading(true);
    try {
      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('question_order');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAssessment = async () => {
    setSaving(true);
    try {
      let savedAssessment;
      
      if (assessmentId) {
        const { data, error } = await supabase
          .from('assessments')
          .update(assessment)
          .eq('id', assessmentId)
          .select()
          .single();
        
        if (error) throw error;
        savedAssessment = data;
      } else {
        const { data, error } = await supabase
          .from('assessments')
          .insert(assessment)
          .select()
          .single();
        
        if (error) throw error;
        savedAssessment = data;
      }

      // Save questions
      for (const [index, question] of questions.entries()) {
        const questionData = {
          ...question,
          assessment_id: savedAssessment.id,
          question_order: index + 1
        };

        if (question.id) {
          await supabase
            .from('assessment_questions')
            .update(questionData)
            .eq('id', question.id);
        } else {
          await supabase
            .from('assessment_questions')
            .insert(questionData);
        }
      }

      toast({
        title: "Success",
        description: "Assessment saved successfully",
      });
      
      onSave?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save assessment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setEditingQuestion(null);
    setEditingIndex(null);
    setShowQuestionEditor(true);
  };

  const editQuestion = (question: AssessmentQuestion) => {
    const index = questions.findIndex(q => q.id === question.id);
    setEditingQuestion(question);
    setEditingIndex(index);
    setShowQuestionEditor(true);
  };

  const saveQuestion = (questionData: AssessmentQuestion) => {
    if (editingIndex !== null) {
      const newQuestions = [...questions];
      newQuestions[editingIndex] = questionData;
      setQuestions(newQuestions);
    } else {
      setQuestions([...questions, questionData]);
    }
    setShowQuestionEditor(false);
    setEditingQuestion(null);
    setEditingIndex(null);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const moveQuestion = (dragIndex: number, hoverIndex: number) => {
    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[dragIndex];
    newQuestions.splice(dragIndex, 1);
    newQuestions.splice(hoverIndex, 0, draggedQuestion);
    setQuestions(newQuestions);
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assessment Builder</h1>
            <p className="text-muted-foreground">Create comprehensive assessments with multiple question types</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveAssessment} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Assessment"}
            </Button>
          </div>
        </div>

        {/* Assessment Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={assessment.title}
                  onChange={(e) => setAssessment({ ...assessment, title: e.target.value })}
                  placeholder="Assessment title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select 
                  value={assessment.assessment_type} 
                  onValueChange={(value) => setAssessment({ ...assessment, assessment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="practice">Practice Test</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={assessment.description || ''}
                onChange={(e) => setAssessment({ ...assessment, description: e.target.value })}
                placeholder="Describe the assessment purpose and instructions"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Passing Score (%)</label>
                <Input
                  type="number"
                  value={assessment.passing_score}
                  onChange={(e) => setAssessment({ ...assessment, passing_score: parseInt(e.target.value) || 70 })}
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Max Attempts</label>
                <Input
                  type="number"
                  value={assessment.max_attempts}
                  onChange={(e) => setAssessment({ ...assessment, max_attempts: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Time Limit (minutes)</label>
                <Input
                  type="number"
                  value={assessment.time_limit_minutes || ''}
                  onChange={(e) => setAssessment({ ...assessment, time_limit_minutes: parseInt(e.target.value) || null })}
                  placeholder="No limit"
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={assessment.is_required}
                onCheckedChange={(checked) => setAssessment({ ...assessment, is_required: checked })}
              />
              <label className="text-sm font-medium">Required for course completion</label>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questions ({questions.length})</CardTitle>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline">
                    <Award className="h-3 w-3 mr-1" />
                    {totalPoints} Total Points
                  </Badge>
                  {assessment.time_limit_minutes && (
                    <Badge variant="outline">
                      <Timer className="h-3 w-3 mr-1" />
                      {assessment.time_limit_minutes} Minutes
                    </Badge>
                  )}
                </div>
              </div>
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions added yet</p>
                <p className="text-sm">Click "Add Question" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <DraggableQuestion
                    key={question.id || index}
                    question={question}
                    index={index}
                    onEdit={editQuestion}
                    onDelete={deleteQuestion}
                    moveQuestion={moveQuestion}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Editor Dialog */}
        <Dialog open={showQuestionEditor} onOpenChange={setShowQuestionEditor}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
            </DialogHeader>
            
            <QuestionEditor
              question={editingQuestion}
              onSave={saveQuestion}
              onCancel={() => setShowQuestionEditor(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
};

export default EnhancedAssessmentBuilder;
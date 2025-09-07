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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Plus,
  Trash2,
  Edit,
  Copy,
  Save,
  Eye,
  HelpCircle,
  CheckCircle,
  X,
  GripVertical,
  Clock,
  Target,
  BarChart3,
  Settings,
  Wand2,
  Download,
  Upload,
  FileText,
  Video,
  Image,
  Shuffle,
  Timer,
  Award,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'fill_blank' | 'short_answer' | 'essay' | 'matching' | 'ordering' | 'scenario';
  options: string[];
  correct_answers: string[];
  points: number;
  explanation: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  time_limit?: number;
  feedback: {
    correct: string;
    incorrect: string;
  };
  metadata: any;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  assessment_type: 'quiz' | 'exam' | 'practice' | 'certification';
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  shuffle_questions: boolean;
  show_results: boolean;
  allow_review: boolean;
  questions: Question[];
  settings: {
    randomize_options: boolean;
    prevent_backtrack: boolean;
    require_all_questions: boolean;
    show_progress: boolean;
    auto_submit: boolean;
  };
}

interface EnhancedAssessmentBuilderProps {
  assessmentId?: string;
  courseId?: string;
  onSave?: (assessment: Assessment) => void;
  onClose?: () => void;
}

const EnhancedAssessmentBuilder = ({ assessmentId, courseId, onSave, onClose }: EnhancedAssessmentBuilderProps) => {
  const [assessment, setAssessment] = useState<Assessment>({
    id: assessmentId || '',
    title: '',
    description: '',
    assessment_type: 'quiz',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: undefined,
    shuffle_questions: false,
    show_results: true,
    allow_review: true,
    questions: [],
    settings: {
      randomize_options: false,
      prevent_backtrack: false,
      require_all_questions: true,
      show_progress: true,
      auto_submit: false
    }
  });

  const [activeTab, setActiveTab] = useState("info");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckCircle, description: 'Single correct answer from options' },
    { value: 'multiple_select', label: 'Multiple Select', icon: CheckCircle, description: 'Multiple correct answers' },
    { value: 'true_false', label: 'True/False', icon: CheckCircle, description: 'Binary choice question' },
    { value: 'fill_blank', label: 'Fill in the Blank', icon: FileText, description: 'Complete missing text' },
    { value: 'short_answer', label: 'Short Answer', icon: FileText, description: 'Brief text response' },
    { value: 'essay', label: 'Essay', icon: FileText, description: 'Long form response' },
    { value: 'matching', label: 'Matching', icon: Target, description: 'Match items to pairs' },
    { value: 'ordering', label: 'Ordering', icon: BarChart3, description: 'Arrange items in sequence' },
    { value: 'scenario', label: 'Scenario-Based', icon: Video, description: 'Real-world situation questions' }
  ];

  const medicareQuestionTemplates = [
    {
      category: 'Medicare Basics',
      questions: [
        {
          question_text: 'What is the standard Medicare Part B deductible for 2024?',
          question_type: 'multiple_choice' as const,
          options: ['$226', '$240', '$256', '$280'],
          correct_answers: ['$240'],
          explanation: 'The Medicare Part B deductible for 2024 is $240, which must be met before Medicare begins paying for covered services.',
          tags: ['part-b', 'deductible', '2024']
        },
        {
          question_text: 'Medicare Part A covers which of the following services? (Select all that apply)',
          question_type: 'multiple_select' as const,
          options: ['Inpatient hospital stays', 'Outpatient doctor visits', 'Skilled nursing facility care', 'Home health care', 'Prescription drugs'],
          correct_answers: ['Inpatient hospital stays', 'Skilled nursing facility care', 'Home health care'],
          explanation: 'Part A covers inpatient hospital stays, skilled nursing facility care, and home health care. Outpatient visits are covered by Part B, and prescription drugs by Part D.',
          tags: ['part-a', 'coverage', 'benefits']
        }
      ]
    },
    {
      category: 'Compliance',
      questions: [
        {
          question_text: 'According to CMS guidelines, what is the maximum number of sales presentations an agent can conduct at a healthcare provider facility per week?',
          question_type: 'multiple_choice' as const,
          options: ['1', '2', '3', 'No limit'],
          correct_answers: ['2'],
          explanation: 'CMS limits agent sales presentations at healthcare provider facilities to no more than 2 per week to prevent overwhelming patients.',
          tags: ['cms', 'sales-events', 'provider-facilities']
        }
      ]
    }
  ];

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    if (!assessmentId) return;
    
    setLoading(true);
    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('question_order');

      if (questionsError) throw questionsError;

      setAssessment({
        id: assessmentData.id,
        title: assessmentData.title,
        description: assessmentData.description,
        assessment_type: assessmentData.assessment_type as 'quiz' | 'exam' | 'practice' | 'certification',
        passing_score: assessmentData.passing_score,
        max_attempts: assessmentData.max_attempts,
        time_limit_minutes: assessmentData.time_limit_minutes,
        shuffle_questions: false,
        show_results: true,
        allow_review: true,
        questions: (questionsData || []).map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type as any,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          correct_answers: Array.isArray(q.correct_answers) ? (q.correct_answers as string[]) : [],
          points: q.points,
          explanation: q.explanation || '',
          difficulty: 'medium' as const,
          tags: [],
          feedback: {
            correct: 'Correct! Well done.',
            incorrect: 'Incorrect. Please review the material and try again.'
          },
          metadata: {}
        })),
        settings: {
          randomize_options: false,
          prevent_backtrack: false,
          require_all_questions: true,
          show_progress: true,
          auto_submit: false
        }
      });
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
      const { data: savedAssessment, error: assessmentError } = await supabase
        .from('assessments')
        .upsert({
          id: assessment.id || undefined,
          course_id: courseId,
          title: assessment.title,
          description: assessment.description,
          assessment_type: assessment.assessment_type,
          passing_score: assessment.passing_score,
          max_attempts: assessment.max_attempts,
          time_limit_minutes: assessment.time_limit_minutes,
          is_required: true
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Save questions
      for (const question of assessment.questions) {
        const { error: questionError } = await supabase
          .from('assessment_questions')
          .upsert({
            id: question.id || undefined,
            assessment_id: savedAssessment.id,
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options,
            correct_answers: question.correct_answers,
            points: question.points,
            explanation: question.explanation,
            question_order: assessment.questions.indexOf(question) + 1
          });

        if (questionError) throw questionError;
      }

      toast({
        title: "Success",
        description: "Assessment saved successfully",
      });

      if (onSave) {
        onSave({ ...assessment, id: savedAssessment.id });
      }
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

  const addQuestion = (template?: any) => {
    const newQuestion: Question = template || {
      id: `temp-${Date.now()}`,
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answers: [],
      points: 1,
      explanation: '',
      difficulty: 'medium',
      tags: [],
      feedback: {
        correct: 'Correct! Well done.',
        incorrect: 'Incorrect. Please review the material and try again.'
      },
      metadata: {}
    };

    setAssessment(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setSelectedQuestion(newQuestion);
    setShowQuestionDialog(true);
  };

  const updateQuestion = (updatedQuestion: Question) => {
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const duplicateQuestion = (question: Question) => {
    const duplicated = {
      ...question,
      id: `temp-${Date.now()}`,
      question_text: `${question.question_text} (Copy)`
    };
    
    setAssessment(prev => ({
      ...prev,
      questions: [...prev.questions, duplicated]
    }));
  };

  const generateAIQuestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `Generate 5 Medicare insurance quiz questions covering Medicare Parts A, B, C, and D, including compliance and coordination of benefits. Each question should be multiple choice with 4 options and include detailed explanations.`,
          contentType: 'quiz',
          userId: (await supabase.auth.getUser()).data.user?.id,
          difficulty: 'intermediate',
          topic: 'Medicare Insurance Knowledge'
        }
      });

      if (error) throw error;

      // Parse AI response and convert to questions
      const aiQuestions = parseAIQuestions(data.content);
      
      setAssessment(prev => ({
        ...prev,
        questions: [...prev.questions, ...aiQuestions]
      }));

      toast({
        title: "Success",
        description: `Generated ${aiQuestions.length} AI questions`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate AI questions",
        variant: "destructive",
      });
    }
  };

  const parseAIQuestions = (content: string): Question[] => {
    // Mock parsing - in reality, this would parse the AI response
    return [
      {
        id: `ai-${Date.now()}-1`,
        question_text: 'What is the Medicare Part D coverage gap commonly known as?',
        question_type: 'multiple_choice',
        options: ['Donut hole', 'Coverage cliff', 'Benefit gap', 'Premium valley'],
        correct_answers: ['Donut hole'],
        points: 1,
        explanation: 'The Medicare Part D coverage gap is commonly referred to as the "donut hole" - a temporary limit on what the drug plan will cover for drugs.',
        difficulty: 'medium',
        tags: ['part-d', 'coverage-gap', 'donut-hole'],
        feedback: {
          correct: 'Correct! The donut hole is the official term for the Part D coverage gap.',
          incorrect: 'Incorrect. The coverage gap is commonly called the "donut hole".'
        },
        metadata: { ai_generated: true }
      }
    ];
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(assessment.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAssessment(prev => ({
      ...prev,
      questions: items
    }));
  };

  const renderQuestionEditor = () => {
    if (!selectedQuestion) return null;

    const typeInfo = questionTypes.find(t => t.value === selectedQuestion.question_type);

    return (
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestion.id?.startsWith('temp-') ? 'Add New Question' : 'Edit Question'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Question Type */}
            <div>
              <Label>Question Type</Label>
              <Select 
                value={selectedQuestion.question_type} 
                onValueChange={(value: any) => 
                  setSelectedQuestion({...selectedQuestion, question_type: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div>{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Question Text */}
            <div>
              <Label>Question</Label>
              <Textarea
                value={selectedQuestion.question_text}
                onChange={(e) => setSelectedQuestion({
                  ...selectedQuestion,
                  question_text: e.target.value
                })}
                placeholder="Enter your question..."
                rows={3}
              />
            </div>

            {/* Options (for choice-based questions) */}
            {['multiple_choice', 'multiple_select', 'true_false'].includes(selectedQuestion.question_type) && (
              <div>
                <Label>Answer Options</Label>
                <div className="space-y-2">
                  {selectedQuestion.question_type === 'true_false' 
                    ? ['True', 'False'].map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox 
                            checked={selectedQuestion.correct_answers.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedQuestion({
                                  ...selectedQuestion,
                                  correct_answers: [option]
                                });
                              }
                            }}
                          />
                          <span>{option}</span>
                        </div>
                      ))
                    : selectedQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox 
                            checked={selectedQuestion.correct_answers.includes(option)}
                            onCheckedChange={(checked) => {
                              const newCorrectAnswers = checked
                                ? [...selectedQuestion.correct_answers, option]
                                : selectedQuestion.correct_answers.filter(a => a !== option);
                              
                              setSelectedQuestion({
                                ...selectedQuestion,
                                correct_answers: selectedQuestion.question_type === 'multiple_choice' 
                                  ? [option] 
                                  : newCorrectAnswers
                              });
                            }}
                          />
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...selectedQuestion.options];
                              newOptions[index] = e.target.value;
                              setSelectedQuestion({
                                ...selectedQuestion,
                                options: newOptions
                              });
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newOptions = selectedQuestion.options.filter((_, i) => i !== index);
                              setSelectedQuestion({
                                ...selectedQuestion,
                                options: newOptions
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                  }
                  {selectedQuestion.question_type !== 'true_false' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedQuestion({
                        ...selectedQuestion,
                        options: [...selectedQuestion.options, '']
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Points and Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={selectedQuestion.points}
                  onChange={(e) => setSelectedQuestion({
                    ...selectedQuestion,
                    points: parseInt(e.target.value) || 1
                  })}
                  min="1"
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select 
                  value={selectedQuestion.difficulty} 
                  onValueChange={(value: any) => 
                    setSelectedQuestion({...selectedQuestion, difficulty: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <Label>Explanation</Label>
              <Textarea
                value={selectedQuestion.explanation}
                onChange={(e) => setSelectedQuestion({
                  ...selectedQuestion,
                  explanation: e.target.value
                })}
                placeholder="Explain why this is the correct answer..."
                rows={3}
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={selectedQuestion.tags.join(', ')}
                onChange={(e) => setSelectedQuestion({
                  ...selectedQuestion,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                placeholder="medicare, part-a, coverage"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                updateQuestion(selectedQuestion);
                setShowQuestionDialog(false);
              }}>
                Save Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const calculateAssessmentStats = () => {
    const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
    const difficultyDistribution = assessment.questions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQuestions: assessment.questions.length,
      totalPoints,
      difficultyDistribution,
      estimatedTime: assessment.questions.length * 2 // 2 minutes per question estimate
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = calculateAssessmentStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment Builder</h1>
          <p className="text-muted-foreground">Create comprehensive Medicare knowledge assessments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveAssessment} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Assessment"}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={assessment.title}
                      onChange={(e) => setAssessment({...assessment, title: e.target.value})}
                      placeholder="Assessment title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={assessment.description}
                      onChange={(e) => setAssessment({...assessment, description: e.target.value})}
                      placeholder="Assessment description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Assessment Type</Label>
                      <Select 
                        value={assessment.assessment_type} 
                        onValueChange={(value: any) => setAssessment({...assessment, assessment_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="practice">Practice Test</SelectItem>
                          <SelectItem value="certification">Certification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Passing Score (%)</Label>
                      <Input
                        type="number"
                        value={assessment.passing_score}
                        onChange={(e) => setAssessment({...assessment, passing_score: parseInt(e.target.value) || 70})}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Attempts</Label>
                      <Input
                        type="number"
                        value={assessment.max_attempts}
                        onChange={(e) => setAssessment({...assessment, max_attempts: parseInt(e.target.value) || 1})}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Time Limit (minutes)</Label>
                      <Input
                        type="number"
                        value={assessment.time_limit_minutes || ''}
                        onChange={(e) => setAssessment({...assessment, time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined})}
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Questions</span>
                    <Badge variant="outline">{stats.totalQuestions}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Points</span>
                    <Badge variant="outline">{stats.totalPoints}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Est. Time</span>
                    <Badge variant="outline">{stats.estimatedTime} min</Badge>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Difficulty Distribution</span>
                    {Object.entries(stats.difficultyDistribution).map(([difficulty, count]) => (
                      <div key={difficulty} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{difficulty}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Questions ({assessment.questions.length})</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={generateAIQuestions}>
                <Wand2 className="h-4 w-4 mr-2" />
                AI Generate
              </Button>
              <Button onClick={() => addQuestion()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Question Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Medicare Question Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicareQuestionTemplates.map((template, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{template.category}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.questions.length} pre-built questions
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        template.questions.forEach(q => addQuestion({
                          ...q,
                          id: `template-${Date.now()}-${Math.random()}`,
                          points: 1,
                          difficulty: 'medium',
                          feedback: {
                            correct: 'Correct! Well done.',
                            incorrect: 'Incorrect. Please review the material.'
                          },
                          metadata: {}
                        }));
                      }}
                    >
                      Add All Questions
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {assessment.questions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="p-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {question.question_type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {question.points} pt{question.points !== 1 ? 's' : ''}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {question.difficulty}
                                </Badge>
                              </div>
                              <h4 className="font-medium line-clamp-1">{question.question_text}</h4>
                              {question.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {question.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedQuestion(question);
                                  setShowQuestionDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => duplicateQuestion(question)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {assessment.questions.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No questions added yet. Start by adding your first question.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Shuffle Questions</Label>
                    <Switch 
                      checked={assessment.shuffle_questions}
                      onCheckedChange={(checked) => setAssessment({...assessment, shuffle_questions: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Randomize Options</Label>
                    <Switch 
                      checked={assessment.settings.randomize_options}
                      onCheckedChange={(checked) => setAssessment({
                        ...assessment, 
                        settings: {...assessment.settings, randomize_options: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Results</Label>
                    <Switch 
                      checked={assessment.show_results}
                      onCheckedChange={(checked) => setAssessment({...assessment, show_results: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Review</Label>
                    <Switch 
                      checked={assessment.allow_review}
                      onCheckedChange={(checked) => setAssessment({...assessment, allow_review: checked})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Prevent Backtrack</Label>
                    <Switch 
                      checked={assessment.settings.prevent_backtrack}
                      onCheckedChange={(checked) => setAssessment({
                        ...assessment, 
                        settings: {...assessment.settings, prevent_backtrack: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require All Questions</Label>
                    <Switch 
                      checked={assessment.settings.require_all_questions}
                      onCheckedChange={(checked) => setAssessment({
                        ...assessment, 
                        settings: {...assessment.settings, require_all_questions: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Progress</Label>
                    <Switch 
                      checked={assessment.settings.show_progress}
                      onCheckedChange={(checked) => setAssessment({
                        ...assessment, 
                        settings: {...assessment.settings, show_progress: checked}
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto Submit</Label>
                    <Switch 
                      checked={assessment.settings.auto_submit}
                      onCheckedChange={(checked) => setAssessment({
                        ...assessment, 
                        settings: {...assessment.settings, auto_submit: checked}
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="text-xl font-bold mb-2">{assessment.title}</h3>
                  <p className="text-muted-foreground mb-4">{assessment.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Questions:</span> {stats.totalQuestions}
                    </div>
                    <div>
                      <span className="font-medium">Points:</span> {stats.totalPoints}
                    </div>
                    <div>
                      <span className="font-medium">Time Limit:</span> {assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : 'No limit'}
                    </div>
                    <div>
                      <span className="font-medium">Passing Score:</span> {assessment.passing_score}%
                    </div>
                  </div>
                </div>

                {assessment.questions.slice(0, 3).map((question, index) => (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline">Question {index + 1}</Badge>
                      <Badge variant="secondary">{question.points} pts</Badge>
                    </div>
                    <h4 className="font-medium mb-3">{question.question_text}</h4>
                    {question.question_type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <input type="radio" disabled />
                            <span className={question.correct_answers.includes(option) ? 'font-medium text-green-600' : ''}>
                              {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                ))}

                {assessment.questions.length > 3 && (
                  <div className="text-center text-muted-foreground">
                    ... and {assessment.questions.length - 3} more questions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderQuestionEditor()}
    </div>
  );
};

export default EnhancedAssessmentBuilder;
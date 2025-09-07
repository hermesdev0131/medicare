import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Star,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Calendar,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

interface LearningInsight {
  type: 'strength' | 'weakness' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedCourses?: string[];
}

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  courses: Array<{
    id: string;
    title: string;
    order: number;
    estimated_hours: number;
  }>;
  progress: number;
}

interface AILearningAssistantProps {
  userId: string;
  currentCourseId?: string;
  className?: string;
}

export const AILearningAssistant: React.FC<AILearningAssistantProps> = ({
  userId,
  currentCourseId,
  className = ''
}) => {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const { toast } = useToast();

  useEffect(() => {
    loadLearningData();
  }, [userId]);

  const loadLearningData = async () => {
    try {
      // Load learning insights
      const { data: insightsData } = await supabase.functions.invoke('generate-learning-insights', {
        body: { userId, currentCourseId }
      });

      // Load recommendations
      const { data: recommendationsData } = await supabase
        .from('learning_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('confidence_score', { ascending: false });

      if (insightsData) {
        setInsights(insightsData.insights || []);
        setStudyPlans(insightsData.studyPlans || []);
      }

      if (recommendationsData) {
        setRecommendations(recommendationsData);
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissRecommendation = async (recommendationId: string) => {
    try {
      await supabase
        .from('learning_recommendations')
        .update({ is_dismissed: true })
        .eq('id', recommendationId);
      
      setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const generatePersonalizedPlan = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: { userId, goals: ['skill_improvement'], timeAvailable: 'moderate' }
      });

      if (error) throw error;

      toast({
        title: "Study Plan Generated",
        description: "Your personalized learning plan is ready!"
      });

      loadLearningData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate study plan. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'weakness': return <Target className="h-4 w-4 text-amber-500" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'prediction': return <BarChart3 className="h-4 w-4 text-purple-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className={`w-full max-w-4xl mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-4xl mx-auto ${className}`}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle>AI Learning Assistant</CardTitle>
            </div>
            <Badge variant="outline" className="bg-primary/10">
              Powered by AI
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="insights">Learning Insights</TabsTrigger>
              <TabsTrigger value="plans">Study Plans</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{insight.title}</h4>
                              <Badge variant={getPriorityColor(insight.priority) as any}>
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {insight.description}
                            </p>
                            {insight.actionable && (
                              <Button size="sm" variant="outline">
                                Take Action
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Complete more lessons to get personalized insights!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plans" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Study Plans</h3>
                <Button onClick={generatePersonalizedPlan} size="sm">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate New Plan
                </Button>
              </div>

              <div className="grid gap-4">
                {studyPlans.length > 0 ? (
                  studyPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{plan.title}</h4>
                            <Badge variant="outline" className="capitalize">
                              {plan.difficulty}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {plan.estimatedDuration}h total
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {plan.courses.length} courses
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{plan.progress}%</span>
                            </div>
                            <Progress value={plan.progress} className="h-2" />
                          </div>
                          
                          <Button size="sm" className="w-full">
                            Continue Learning
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No study plans yet. Let AI create one for you!
                    </p>
                    <Button onClick={generatePersonalizedPlan}>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Create Study Plan
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-amber-500" />
                              <h4 className="font-semibold">
                                {rec.content.title || 'Personalized Recommendation'}
                              </h4>
                              <Badge variant="outline">
                                {Math.round(rec.confidence_score * 100)}% match
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {rec.content.description || 'Based on your learning pattern, this might interest you.'}
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm">
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => dismissRecommendation(rec.id)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No recommendations available. Keep learning to get personalized suggestions!
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
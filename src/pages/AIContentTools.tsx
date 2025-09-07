import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, BookOpen, MessageSquare, PenTool, Zap, ArrowLeft, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ContentGenerator } from '@/components/course/ContentGenerator';
import { AITutor } from '@/components/course/AITutor';

const AIContentTools = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // Load profile and roles
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_roles').select('role').eq('user_id', user.id)
      ]);

      setProfile(profileRes.data);
      setUserRoles(rolesRes.data?.map((r: any) => r.role) || []);
      setLoading(false);
    };

    getUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has content creator roles
  const isContentCreator = userRoles.includes('admin') || 
                          userRoles.includes('instructional_designer') || 
                          userRoles.includes('facilitator');

  if (!isContentCreator) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access AI content creation tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer currentPage="AI Content Tools" />
      </div>
    );
  }

  const aiTools = [
    {
      id: 'content-generator',
      title: 'AI Content Generator',
      description: 'Generate course content, quizzes, and learning materials using AI',
      icon: PenTool,
      color: 'bg-purple-500',
      features: ['Course Lessons', 'Quizzes & Assessments', 'Summaries', 'Practice Exercises']
    },
    {
      id: 'ai-tutor',
      title: 'AI Learning Assistant',
      description: 'Interactive AI tutor for personalized learning support',
      icon: MessageSquare,
      color: 'bg-blue-500',
      features: ['Student Q&A', 'Concept Explanations', 'Study Guidance', 'Progress Tracking']
    },
    {
      id: 'smart-insights',
      title: 'Learning Analytics',
      description: 'AI-powered insights and recommendations for learners',
      icon: Brain,
      color: 'bg-green-500',
      features: ['Performance Analysis', 'Study Plans', 'Recommendations', 'Progress Reports']
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-3">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                AI Content Creation Tools
              </h1>
              <p className="text-muted-foreground">
                Powered by artificial intelligence
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('content-generator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content-generator'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Content Generator
              </button>
              <button
                onClick={() => setActiveTab('ai-tutor')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai-tutor'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                AI Tutor
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* AI Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card 
                    key={tool.id} 
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/20"
                    onClick={() => setActiveTab(tool.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-full ${tool.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Zap className="h-4 w-4 text-yellow-500" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {tool.title}
                      </CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-foreground">Features:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {tool.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button 
                        className="w-full mt-4 group-hover:bg-primary/90 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(tool.id);
                        }}
                      >
                        Launch Tool
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" asChild>
                    <Link to="/instructional-designer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Course Builder
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/content-creator">
                      <Settings className="h-4 w-4 mr-2" />
                      Creator Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/profile">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Generator Tab */}
        {activeTab === 'content-generator' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenTool className="mr-2 h-5 w-5" />
                  AI Content Generator
                </CardTitle>
                <CardDescription>
                  Create educational content, quizzes, and learning materials using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentGenerator 
                  userId={user?.id}
                  courseId="demo"
                  onContentGenerated={(content) => {
                    toast({
                      title: "Content Generated",
                      description: "Your AI-generated content is ready!",
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Tutor Tab */}
        {activeTab === 'ai-tutor' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  AI Learning Assistant
                </CardTitle>
                <CardDescription>
                  Interactive AI tutor for personalized learning support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AITutor 
                  userId={user?.id}
                  courseId="demo"
                  lessonId="demo"
                  context="AI Content Creation Tools Demo"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer currentPage="AI Content Tools" />
    </div>
  );
};

export default AIContentTools;
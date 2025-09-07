
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, BookOpen, Calendar, Users, BarChart3, FileText, Settings, PenSquare } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/Footer';

const ContentCreatorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
                          userRoles.includes('facilitator') ||
                          userRoles.includes('author');

  if (!isContentCreator) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access content creation tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer currentPage="Content Creator Dashboard" />
      </div>
    );
  }

  const tools = [
    {
      title: 'Admin Dashboard',
      description: 'Manage users, monitor system activity, and configure settings',
      icon: Shield,
      path: '/admin-dashboard',
      color: 'bg-red-500',
      available: userRoles.includes('admin'),
      category: 'System Management'
    },
    {
      title: 'Course Builder',
      description: 'Create and manage educational courses and learning materials',
      icon: BookOpen,
      path: '/instructional-designer',
      color: 'bg-blue-500',
      available: userRoles.includes('instructional_designer') || userRoles.includes('admin'),
      category: 'Content Creation'
    },
    {
      title: 'Event Scheduler',
      description: 'Schedule and manage webinars, workshops, and training sessions',
      icon: Calendar,
      path: '/facilitator',
      color: 'bg-green-500',
      available: userRoles.includes('facilitator') || userRoles.includes('admin'),
      category: 'Event Management'
    },
    // Author Studio tool now links to dedicated page
    {
      title: 'Author Studio',
      description: 'Write blogs and newsletters with free or subscriber-only access',
      icon: PenSquare,
      path: '/author-studio',
      color: 'bg-amber-500',
      available: userRoles.includes('author') || userRoles.includes('admin'),
      category: 'Content Authoring'
    }
  ];

  const availableTools = tools.filter(tool => tool.available);
  const categories = [...new Set(availableTools.map(tool => tool.category))];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Badges */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Content Creator Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {profile?.first_name || 'Content Creator'}</p>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-4">Your Roles</h2>
          <div className="flex flex-wrap gap-2">
            {userRoles.map((role) => (
              <Badge key={role} variant="secondary" className="capitalize">
                {role.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tools by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTools
                .filter(tool => tool.category === category)
                .map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Card key={tool.title} className="hover:shadow-lg transition-shadow cursor-pointer group">{/* */}
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-full ${tool.color} text-white`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{tool.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {tool.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          asChild 
                          className="w-full group-hover:bg-primary/90 transition-colors"
                        >
                          <Link to={tool.path}>
                            Open {tool.title}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <Link to="/profile">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Profile
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/agent-hq">
                  <FileText className="h-4 w-4 mr-2" />
                  View as Learner
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">
                  <Settings className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer currentPage="Content Creator Dashboard" />
    </div>
  );
};

export default ContentCreatorDashboard;

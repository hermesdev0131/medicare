import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, User, LogOut, BookOpen, Calendar, GraduationCap, FileText, Brain, Award, TrendingUp, Settings, Mail, PenTool, BarChart3 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import type { User as SupabaseUser } from '@supabase/supabase-js';
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasVisitedBefore, setHasVisitedBefore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed } = useSubscription(user?.id);

  // Authentication state management
  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    setHasVisitedBefore(!!hasVisited);

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
          // Mark as visited
          localStorage.setItem('hasVisitedBefore', 'true');
          setHasVisitedBefore(true);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to prevent deadlock with auth state changes
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
          localStorage.setItem('hasVisitedBefore', 'true');
          setHasVisitedBefore(true);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }

      // Check user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = rolesData?.map(r => r.role) || [];
      console.log('User roles loaded:', roles);
      setUserRoles(roles);
      setIsAdmin(roles.includes('admin'));
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    }
  };

  const navItems = user ? (
    isSubscribed ? [
      {
        name: 'Agent HQ',
        path: '/agent-hq'
      }, {
        name: 'About',
        path: '/about'
      }, {
        name: 'Services',
        path: '/services'
      }, {
        name: 'Contact',
        path: '/contact'
      }
    ] : [
      {
        name: 'Dashboard',
        path: '/dashboard'
      }, {
        name: 'About',
        path: '/about'
      }, {
        name: 'Services',
        path: '/services'
      }, {
        name: 'Contact',
        path: '/contact'
      }
    ]
  ) : [
    {
      name: 'Home',
      path: '/'
    }, {
      name: 'About',
      path: '/about'
    }, {
      name: 'Services',
      path: '/services'
    }, {
      name: 'Newsletter',
      path: '/newsletter-archive'
    }, {
      name: 'Contact',
      path: '/contact'
    }
  ];
  const isActive = (path: string) => location.pathname === path;
  return <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative bg-white rounded-lg p-2 shadow-sm">
              <img src="/lovable-uploads/cb9c1fda-8a6f-4aaa-b435-514069a9eaad.png" alt="The Training Department Logo" className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground leading-none">
                The Training Department
              </span>
              <span className="text-xs text-muted-foreground leading-none my-0 py-[5px]">
                InsuranceTrainingHQ.com
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(item => <Link key={item.name} to={item.path} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.path) ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
                {item.name}
              </Link>)}
            
{loading ? (
              <div className="w-20 h-8 bg-muted animate-pulse rounded" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    <User className="h-4 w-4 mr-2" />
                    {profile ? `${profile.first_name}` : 'Profile'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 w-56">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile & Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Learning Tools</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Learning Dashboard
                  </DropdownMenuItem>
                  
                  {isSubscribed && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Medicare Tools</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/agent-hq')}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Agent Resource HQ
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {(userRoles.includes('admin') || userRoles.includes('analyst')) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Analytics</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/analytics-dashboard')}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {(userRoles.includes('admin') || userRoles.includes('instructional_designer') || userRoles.includes('facilitator') || userRoles.includes('author')) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Creator Tools</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/instructional-designer')}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Course Builder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/facilitator')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Events
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/ai-content-tools')}>
                        <Brain className="h-4 w-4 mr-2" />
                        AI Content Tools
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/content-creator')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Content Creator
                      </DropdownMenuItem>
                      {userRoles.includes('author') && (
                        <>
                          <DropdownMenuItem onClick={() => navigate('/author-dashboard')}>
                            <PenTool className="h-4 w-4 mr-2" />
                            Author Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/author-studio')}>
                            <PenTool className="h-4 w-4 mr-2" />
                            Author Studio
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Admin</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/admin-dashboard')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="hero" size="sm" className="text-slate-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
                  {hasVisitedBefore ? 'Sign In' : 'Get Started'}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              {navItems.map(item => <Link key={item.name} to={item.path} className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary ${isActive(item.path) ? 'text-primary bg-accent' : 'text-muted-foreground'}`} onClick={() => setIsOpen(false)}>
                  {item.name}
                </Link>)}
              <div className="px-3 py-2 space-y-2">
                {loading ? (
                  <div className="w-full h-8 bg-muted animate-pulse rounded" />
                ) : user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                        <User className="h-4 w-4 mr-2" />
                        {profile ? `${profile.first_name}'s Profile` : 'Profile'}
                      </Button>
                    </Link>
                    
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Learning Dashboard
                      </Button>
                    </Link>
                    
                    {isSubscribed && (
                      <Link to="/agent-hq" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Agent Resource HQ
                        </Button>
                      </Link>
                    )}
                    
                    {(userRoles.includes('admin') || userRoles.includes('analyst')) && (
                      <>
                        <div className="border-t border-border my-2"></div>
                        <Link to="/analytics-dashboard" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics Dashboard
                          </Button>
                        </Link>
                      </>
                    )}
                    
                    {(userRoles.includes('admin') || userRoles.includes('instructional_designer') || userRoles.includes('facilitator') || userRoles.includes('author')) && (
                      <>
                        <div className="border-t border-border my-2"></div>
                        <Link to="/instructional-designer" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Course Builder
                          </Button>
                        </Link>
                        <Link to="/ai-content-tools" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                            <Brain className="h-4 w-4 mr-2" />
                            AI Content Tools
                          </Button>
                        </Link>
                        <Link to="/content-creator" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                            <Mail className="h-4 w-4 mr-2" />
                            Content Creator
                          </Button>
                        </Link>
                        {userRoles.includes('author') && (
                          <>
                            <Link to="/author-dashboard" onClick={() => setIsOpen(false)}>
                              <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                                <PenTool className="h-4 w-4 mr-2" />
                                Author Dashboard
                              </Button>
                            </Link>
                            <Link to="/author-studio" onClick={() => setIsOpen(false)}>
                              <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                                <PenTool className="h-4 w-4 mr-2" />
                                Author Studio
                              </Button>
                            </Link>
                          </>
                        )}
                      </>
                    )}
                    
                    {isAdmin && (
                      <>
                        <div className="border-t border-border my-2"></div>
                        <Link to="/admin-dashboard" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start hover:text-primary">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Dashboard
                          </Button>
                        </Link>
                      </>
                    )}
                    
                    <div className="border-t border-border my-2"></div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start hover:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="hero" size="sm" className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
                      {hasVisitedBefore ? 'Sign In' : 'Get Started'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navigation;
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Activity, UserX, UserCheck, Loader2, KeyRound, ShieldX, Settings, Mail } from 'lucide-react';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user' | 'instructional_designer' | 'facilitator' | 'agent' | 'prospect' | 'business_leader' | 'analyst';
}

interface UserWithRoles extends UserProfile {
  roles: UserRole[];
}

interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  is_active: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserWithRoles | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'moderator' | 'user' | 'instructional_designer' | 'facilitator' | 'agent' | 'prospect' | 'business_leader' | 'analyst'>('user');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        setCurrentUser(session.user);

        // Check if user has admin role
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();

        if (error || !roles) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
        await loadData();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const loadData = async () => {
    try {
      // Load all users first
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Load roles separately for each user
      const usersWithRoles: UserWithRoles[] = [];
      
      for (const user of usersData || []) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('id, user_id, role')
          .eq('user_id', user.user_id);
        
        usersWithRoles.push({
          ...user,
          roles: rolesData as any || []
        });
      }
      
      setUsers(usersWithRoles);

      // Load user sessions (mock data since Supabase doesn't expose session details)
      // In a real implementation, you'd track sessions in your own table
      const mockSessions: UserSession[] = usersWithRoles?.slice(0, 10).map((user, index) => ({
        id: `session-${index}`,
        user_id: user.user_id,
        session_id: `sess_${Math.random().toString(36).substring(7)}`,
        ip_address: `192.168.1.${100 + index}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        is_active: Math.random() > 0.3,
        user: {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || ''
        }
      })) || [];

      setSessions(mockSessions);

      // Load activity logs
      await loadActivityLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const loadActivityLogs = async () => {
    try {
      // Load activity logs first
      const { data: activityData, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!activityData) {
        setActivityLogs([]);
        return;
      }

      // Then load user info for each log entry
      const logsWithUsers = [];
      for (const log of activityData) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('user_id', log.user_id)
          .single();

        logsWithUsers.push({
          ...log,
          ip_address: log.ip_address || '',
          user_agent: log.user_agent || '',
          user: userData ? {
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || ''
          } : undefined
        });
      }

      setActivityLogs(logsWithUsers);
    } catch (error: any) {
      console.error('Failed to load activity logs:', error);
      setActivityLogs([]);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resetUserPassword = async (email: string) => {
    setActionLoading('password-reset');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent successfully",
      });
      
      setPasswordResetEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resetUserMFA = async (userId: string) => {
    setActionLoading(userId);
    try {
      // Since we can't directly reset MFA for other users via client,
      // we would need to implement this via an admin function
      // For now, we'll simulate the action
      
      toast({
        title: "Info",
        description: "MFA reset would be implemented via admin function. User will need to re-setup MFA on next login.",
        variant: "default",
      });

      // In a real implementation, you'd call an admin function like:
      // await supabase.functions.invoke('admin-reset-user-mfa', { body: { userId } });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'moderator' | 'user' | 'instructional_designer' | 'facilitator' | 'agent' | 'prospect' | 'business_leader' | 'analyst') => {
    setActionLoading(userId);
    try {
      // First, remove existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${role} successfully`,
      });

      await loadData();
      setSelectedUserForRole(null);
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getUserRole = (user: UserWithRoles) => {
    if (user.roles && user.roles.length > 0) {
      return user.roles[0].role;
    }
    return 'user';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      case 'instructional_designer': return 'default';
      case 'facilitator': return 'default';
      default: return 'outline';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
      case 'email_verified':
      case 'profile_completed':
      case 'onboarding_completed':
        return 'bg-green-100 text-green-700';
      case 'logout':
      case 'password_reset':
        return 'bg-blue-100 text-blue-700';
      case 'failed_login':
      case 'account_locked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatActionText = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/20 to-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"></div>

      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage users and monitor system activity</p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Session Monitoring
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Accounts ({users.length})
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Reset Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset User Password</DialogTitle>
                          <DialogDescription>
                            Send a password reset email to a user
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reset-email">User Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              value={passwordResetEmail}
                              onChange={(e) => setPasswordResetEmail(e.target.value)}
                              placeholder="user@example.com"
                            />
                          </div>
                          <Button 
                            onClick={() => resetUserPassword(passwordResetEmail)}
                            disabled={!passwordResetEmail || actionLoading === 'password-reset'}
                            className="w-full"
                          >
                            {actionLoading === 'password-reset' ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4 mr-2" />
                            )}
                            Send Reset Email
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleColor(getUserRole(user))}>
                              {getUserRole(user)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "default" : "destructive"}>
                              {user.is_active ? "Active" : "Deactivated"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* Toggle User Status */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant={user.is_active ? "destructive" : "default"}
                                    size="sm"
                                    disabled={actionLoading === user.user_id}
                                  >
                                    {actionLoading === user.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : user.is_active ? (
                                      <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {user.is_active ? 'Deactivate' : 'Activate'} User Account
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to {user.is_active ? 'deactivate' : 'activate'} 
                                      {' '}{user.first_name} {user.last_name}'s account?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                                    >
                                      {user.is_active ? 'Deactivate' : 'Activate'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              {/* Manage Role */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserForRole(user);
                                      setNewRole(getUserRole(user));
                                    }}
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Role
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Manage User Role</DialogTitle>
                                    <DialogDescription>
                                      Update role for {user.first_name} {user.last_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="role-select">Select Role</Label>
                                       <Select value={newRole} onValueChange={(value: 'admin' | 'moderator' | 'user' | 'instructional_designer' | 'facilitator' | 'agent' | 'prospect' | 'business_leader') => setNewRole(value)}>
                                         <SelectTrigger>
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="user">User</SelectItem>
                                           <SelectItem value="moderator">Moderator</SelectItem>
                                           <SelectItem value="admin">Admin</SelectItem>
                                           <SelectItem value="instructional_designer">Instructional Designer</SelectItem>
                                           <SelectItem value="facilitator">Facilitator</SelectItem>
                                           <SelectItem value="agent">Agent</SelectItem>
                                           <SelectItem value="prospect">Prospect</SelectItem>
                                           <SelectItem value="business_leader">Business Leader</SelectItem>
                                         </SelectContent>
                                       </Select>
                                    </div>
                                    <Button 
                                      onClick={() => updateUserRole(user.user_id, newRole)}
                                      disabled={actionLoading === user.user_id}
                                      className="w-full"
                                    >
                                      {actionLoading === user.user_id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Shield className="h-4 w-4 mr-2" />
                                      )}
                                      Update Role
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Reset MFA */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoading === user.user_id}
                                  >
                                    <ShieldX className="h-4 w-4 mr-2" />
                                    Reset MFA
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Multi-Factor Authentication</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will disable MFA for {user.first_name} {user.last_name}. 
                                      They will need to set up MFA again on their next login.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => resetUserMFA(user.user_id)}
                                    >
                                      Reset MFA
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Active Sessions ({sessions.filter(s => s.is_active).length})
                  </CardTitle>
                  <CardDescription>
                    Monitor user login sessions and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Session ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{session.user.first_name} {session.user.last_name}</p>
                              <p className="text-sm text-muted-foreground">{session.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{session.ip_address}</TableCell>
                          <TableCell>
                            <Badge variant={session.is_active ? "default" : "secondary"}>
                              {session.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(session.created_at)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {session.session_id}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    User Activity Log ({activityLogs.length})
                  </CardTitle>
                  <CardDescription>
                    Track user actions and system events across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Date/Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">{log.user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {formatActionText(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.details && (
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {typeof log.details === 'object' 
                                  ? Object.entries(log.details).map(([key, value]) => 
                                      `${key}: ${value}`
                                    ).join(', ')
                                  : log.details
                                }
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {log.ip_address || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>{formatDate(log.created_at)}</TableCell>
                        </TableRow>
                      ))}
                      {activityLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      
      <Footer currentPage="Admin Dashboard" />
    </div>
  );
};

export default AdminDashboard;
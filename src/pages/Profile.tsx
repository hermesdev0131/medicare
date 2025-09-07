import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, Phone, Building, Shield, Key, LogOut, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Upload, Smartphone, QrCode, Settings, BookOpen, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AccountManagement } from "@/components/AccountManagement";
import CertificationsManagement from "@/components/CertificationsManagement";
import ProfilePhotoCrop from "@/components/ProfilePhotoCrop";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import VerificationBadges from "@/components/VerificationBadges";
import SubscriptionManager from "@/components/SubscriptionManager";
import EnhancedProfile from "@/components/EnhancedProfile";
import ComplianceDashboard from "@/components/medicare/ComplianceDashboard";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<'welcome' | 'avatar' | 'mfa' | 'complete'>('welcome');
  const [uploading, setUploading] = useState(false);
  const [mfaQR, setMfaQR] = useState<string>("");
  const [mfaSecret, setMfaSecret] = useState<string>("");
  const [mfaVerifyCode, setMfaVerifyCode] = useState<string>("");
  const [factors, setFactors] = useState<any[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    companyName: "",
    positionTitle: "",
    licenseState: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Check authentication and load profile
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadProfile(session.user.id);
      await loadMFAFactors();

      // Check if this is initial setup
      if (searchParams.get('setup') === 'true') {
        setShowSetupDialog(true);
      }
    };
    checkAuth();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
        loadMFAFactors();
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const loadProfile = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (error) throw error;
      setProfile(data);
      setProfileForm({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        phoneNumber: data.phone_number || "",
        companyName: data.company_name || "",
        positionTitle: data.position_title || "",
        licenseState: data.license_state || ""
      });

      // Load user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const roles = rolesData?.map(r => r.role) || [];
      setUserRoles(roles);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive"
      });
    }
  };
  const loadMFAFactors = async () => {
    try {
      const {
        data,
        error
      } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data.totp || []);
    } catch (error: any) {
      console.error('Error loading MFA factors:', error);
    }
  };
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) {
        throw uploadError;
      }
      const {
        data
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const {
        error: updateError
      } = await supabase.from('profiles').update({
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
      if (updateError) throw updateError;
      await loadProfile(user.id);
      toast({
        title: "Success",
        description: "Avatar updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const setupMFA = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Insurance Training HQ'
      });
      if (error) throw error;
      if (data && data.totp) {
        setMfaQR(data.totp.qr_code);
        setMfaSecret(data.totp.secret);
      } else {
        throw new Error('Failed to generate MFA QR code');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup MFA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const verifyMFA = async () => {
    try {
      setLoading(true);
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;
      const factor = factors.data.totp[factors.data.totp.length - 1];
      const {
        data,
        error
      } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: factor.id,
        code: mfaVerifyCode
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "MFA setup completed successfully"
      });
      await loadMFAFactors();
      setSetupStep('complete');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify MFA code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const checkPasswordStrength = (password: string) => {
    let strength = "";
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score < 3) strength = "Weak";else if (score < 5) strength = "Medium";else strength = "Strong";
    return strength;
  };
  const handlePasswordChange = (value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      newPassword: value
    }));
    setPasswordStrength(checkPasswordStrength(value));
  };
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        phone_number: profileForm.phoneNumber,
        company_name: profileForm.companyName,
        position_title: profileForm.positionTitle,
        license_state: profileForm.licenseState,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      await loadProfile(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }
    if (passwordStrength === "Weak") {
      toast({
        title: "Error",
        description: "Password is too weak. Please create a stronger password.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };
  if (!user || !profile) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  const getInitials = () => {
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  const getTabsGridCols = () => {
    let totalTabs = 6; // Default tabs: enhanced profile, compliance, certifications, security, account, preferences
    if (userRoles.includes('admin')) totalTabs += 1;
    if (userRoles.includes('instructional_designer') || userRoles.includes('facilitator') || userRoles.includes('admin')) totalTabs += 1;
    totalTabs += 1; // subscription tab
    return `grid-cols-${Math.min(totalTabs, 8)}`;
  };
  const renderSetupDialog = () => <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Welcome to Insurance Training HQ!</DialogTitle>
          <DialogDescription>
            Let's set up your account to get you started.
          </DialogDescription>
        </DialogHeader>
        
        {setupStep === 'welcome' && <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Account Created Successfully!</h3>
              <p className="text-muted-foreground">Let's personalize your profile and secure your account.</p>
            </div>
            <Button onClick={() => setSetupStep('avatar')} className="w-full">
              Get Started
            </Button>
          </div>}

        {setupStep === 'avatar' && <div className="space-y-4">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">Add Your Profile Picture</h3>
              <p className="text-muted-foreground">Help others recognize you with a profile photo.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar">Choose Profile Picture</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setSetupStep('mfa')} className="flex-1">
                Skip for Now
              </Button>
              <Button onClick={() => setSetupStep('mfa')} className="flex-1" disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </div>
          </div>}

        {setupStep === 'mfa' && <div className="space-y-4">
            <div className="text-center">
              <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Secure Your Account</h3>
              <p className="text-muted-foreground">
                Set up Multi-Factor Authentication for enhanced security.
              </p>
            </div>

            {!mfaQR ? <Button onClick={setupMFA} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Smartphone className="mr-2 h-4 w-4" />
                Set Up MFA
              </Button> : <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={mfaQR} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mfaCode">Enter 6-digit code from your app</Label>
                  <Input id="mfaCode" type="text" placeholder="123456" value={mfaVerifyCode} onChange={e => setMfaVerifyCode(e.target.value)} maxLength={6} />
                </div>

                <Button onClick={verifyMFA} disabled={loading || mfaVerifyCode.length !== 6} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Complete Setup
                </Button>
              </div>}

            <Button variant="outline" onClick={() => setSetupStep('complete')} className="w-full">
              Skip MFA Setup
            </Button>
          </div>}

        {setupStep === 'complete' && <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your account is ready to use. Start exploring your training resources!
              </p>
            </div>
            <Button onClick={() => {
          setShowSetupDialog(false);
          navigate('/agent-hq');
        }} className="w-full">
              Go to Agent Resource HQ
            </Button>
          </div>}
      </DialogContent>
    </Dialog>;
  return <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/20 to-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"></div>

      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="bg-card/90 backdrop-blur-md border-0 shadow-2xl mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                    <Upload className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
                  </label>
                  {uploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <p className="text-muted-foreground mb-2">{profile?.position_title || 'Insurance Professional'}</p>
                  <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
                  
                  {/* Verification Badges */}
                  <div className="mb-4">
                    <VerificationBadges profile={profile} />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {profile?.license_state && <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Licensed in {profile.license_state}
                      </Badge>}
                    {profile?.npn && <Badge variant="outline">
                        <Key className="h-3 w-3 mr-1" />
                        NPN: {profile.npn}
                      </Badge>}
                    {factors.length > 0 && <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        MFA Enabled
                      </Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(userRoles.includes('admin') || userRoles.includes('instructional_designer') || userRoles.includes('facilitator')) && (
            <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Creator Shortcuts</span>
                </CardTitle>
                <CardDescription>Quick access to creation tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Button 
                    variant="outline" 
                    className="h-16"
                    onClick={() => navigate('/instructional-designer')}
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Course Builder
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16"
                    onClick={() => navigate('/facilitator')}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Events
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Onboarding Checklist */}
          <OnboardingChecklist 
            userId={user.id}
            profile={profile}
            onUpdate={() => loadProfile(user.id)}
          />

          {/* Profile Settings Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className={`grid w-full ${getTabsGridCols()} bg-muted/50 backdrop-blur-sm`}>
              <TabsTrigger value="enhanced-profile">Enhanced Profile</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              {(userRoles.includes('admin')) && (
                <TabsTrigger value="admin-tools">Admin Tools</TabsTrigger>
              )}
              {(userRoles.includes('instructional_designer') || userRoles.includes('facilitator') || userRoles.includes('admin')) && (
                <TabsTrigger value="content-management">Creator Tools</TabsTrigger>
              )}
              <TabsTrigger value="subscription">Subscription Management</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced-profile" className="space-y-6">
              <EnhancedProfile userId={user.id} onUpdate={() => loadProfile(user.id)} />
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <ComplianceDashboard userId={user.id} />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={updateProfile} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="firstName">First Name</Label>
                         <Input id="firstName" value={profileForm.firstName} onChange={e => setProfileForm({
                        ...profileForm,
                        firstName: e.target.value
                      })} disabled={loading} />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="lastName">Last Name</Label>
                         <Input id="lastName" value={profileForm.lastName} onChange={e => setProfileForm({
                        ...profileForm,
                        lastName: e.target.value
                      })} disabled={loading} />
                       </div>
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="email">Email Address</Label>
                       <Input id="email" value={user?.email} disabled />
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="phoneNumber">Phone Number</Label>
                       <Input id="phoneNumber" value={profileForm.phoneNumber} onChange={e => setProfileForm({
                      ...profileForm,
                      phoneNumber: e.target.value
                    })} disabled={loading} />
                     </div>

                     <Separator />

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="companyName">Company Name</Label>
                         <Input id="companyName" value={profileForm.companyName} onChange={e => setProfileForm({
                        ...profileForm,
                        companyName: e.target.value
                      })} disabled={loading} />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="positionTitle">Position/Title</Label>
                         <Input id="positionTitle" value={profileForm.positionTitle} onChange={e => setProfileForm({
                        ...profileForm,
                        positionTitle: e.target.value
                      })} disabled={loading} />
                       </div>
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="licenseState">License State</Label>
                       <Input id="licenseState" value={profileForm.licenseState} onChange={e => setProfileForm({
                      ...profileForm,
                      licenseState: e.target.value.toUpperCase()
                    })} placeholder="e.g., CA, TX, NY" disabled={loading} />
                      </div>

                     <Separator />

                     <div className="space-y-4">
                       <h3 className="text-lg font-semibold">Profile Photo</h3>
                       <div className="flex items-center space-x-4">
                         <Avatar className="h-16 w-16">
                           <AvatarImage src={profile?.avatar_url} />
                           <AvatarFallback className="text-lg bg-primary/10 text-primary">
                             {getInitials()}
                           </AvatarFallback>
                         </Avatar>
                         <div className="flex-1">
                           <ProfilePhotoCrop 
                             userId={user.id}
                             currentAvatarUrl={profile?.avatar_url}
                             onAvatarUpdate={(url) => {
                               setProfile(prev => ({ ...prev, avatar_url: url }));
                               toast({
                                 title: "Success",
                                 description: "Profile photo updated successfully"
                               });
                             }}
                           />
                           <p className="text-sm text-muted-foreground mt-1">
                             Upload a professional photo that represents you
                           </p>
                         </div>
                       </div>
                     </div>

                     <Button type="submit" disabled={loading} className="w-full md:w-auto text-slate-50">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-6">
              <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                <CardContent className="p-6">
                  <CertificationsManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Password & Security</span>
                  </CardTitle>
                  <CardDescription>Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={updatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={passwordForm.newPassword} onChange={e => handlePasswordChange(e.target.value)} />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {passwordForm.newPassword && <div className={`text-xs ${passwordStrength === "Strong" ? "text-green-600" : passwordStrength === "Medium" ? "text-yellow-600" : "text-red-600"}`}>
                          Password strength: {passwordStrength}
                        </div>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value
                      })} />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" disabled={loading || passwordStrength === "Weak"} className="w-full md:w-auto text-slate-50">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </form>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Multi-Factor Authentication</h3>
                    {factors.length > 0 ? <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          MFA is enabled on your account. Your account has enhanced security protection.
                        </AlertDescription>
                      </Alert> : <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          MFA is not enabled. Consider enabling it for better account security.
                        </AlertDescription>
                      </Alert>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Account Management</span>
                  </CardTitle>
                  <CardDescription>Manage your account settings, security, and data</CardDescription>
                </CardHeader>
                <CardContent>
                  <AccountManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {userRoles.includes('admin') && (
              <TabsContent value="admin-tools" className="space-y-6">
                <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Admin Tools</span>
                    </CardTitle>
                    <CardDescription>Administrative tools and system management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2"
                        onClick={() => navigate('/admin-dashboard')}
                      >
                        <Shield className="h-6 w-6" />
                        <span>Admin Dashboard</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2"
                        onClick={() => navigate('/content-creator')}
                      >
                        <Settings className="h-6 w-6" />
                        <span>User Management</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {(userRoles.includes('instructional_designer') || userRoles.includes('facilitator') || userRoles.includes('admin')) && (
              <TabsContent value="content-management" className="space-y-6">
                <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>Creator Tools</span>
                    </CardTitle>
                    <CardDescription>Create and manage courses and webinars</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(userRoles.includes('instructional_designer') || userRoles.includes('admin')) && (
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col space-y-2"
                          onClick={() => navigate('/instructional-designer')}
                        >
                          <BookOpen className="h-6 w-6" />
                          <span>Course Builder</span>
                        </Button>
                      )}
                      {(userRoles.includes('facilitator') || userRoles.includes('admin')) && (
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col space-y-2"
                          onClick={() => navigate('/facilitator')}
                        >
                          <Calendar className="h-6 w-6" />
                          <span>Schedule Events</span>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2"
                        onClick={() => navigate('/content-creator')}
                      >
                        <Settings className="h-6 w-6" />
                        <span>Content Library</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="subscription" className="space-y-6">
              <SubscriptionManager />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>Customize your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Additional preference settings will be available in future updates.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer currentPage="User Profile" />

      {renderSetupDialog()}
    </div>;
};
export default Profile;
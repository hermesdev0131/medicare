import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import companyLogo from "@/assets/company-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
const Auth = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [npnValidating, setNpnValidating] = useState(false);
  const [npnValidated, setNpnValidated] = useState(false);
  const [producerInfo, setProducerInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<string>("");
  const [showCompanyFields, setShowCompanyFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Determine if we're in password reset mode (supports Supabase type=recovery in hash)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const typeParam = urlParams.get('type') || hashParams.get('type');
  const isResetMode = mode === 'reset' || typeParam === 'recovery';

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    companyName: "",
    positionTitle: "",
    npn: "",
    licenseState: ""
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  // Handle Supabase email links and errors in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const errorDescription = params.get('error_description') || hash.get('error_description');
    if (errorDescription) {
      setError(errorDescription);
    }

    const type = params.get('type') || hash.get('type');
    if (type === 'magiclink') {
      toast({ title: 'Signing you in...', description: 'Validating your link.' });
    }
  }, []);

  // Validate NPN function
  const validateNPN = async (npn: string) => {
    if (npn.length < 8) return;
    setNpnValidating(true);
    setError("");
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('validate-npn', {
        body: {
          npn,
          lastName: signupForm.lastName,
          licenseState: signupForm.licenseState
        }
      });
      if (error) throw error;
      if (data.valid) {
        setNpnValidated(true);
        setProducerInfo(data.producer_info);
        if (data.warning) {
          toast({
            title: "NPN Validation",
            description: data.warning,
            variant: "default"
          });
        }
      } else {
        setNpnValidated(false);
        setError(data.error || "Invalid NPN");
      }
    } catch (err: any) {
      setError("Failed to validate NPN. Please try again.");
      console.error("NPN validation error:", err);
    } finally {
      setNpnValidating(false);
    }
  };

  // Password validation
  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain lowercase letters";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain uppercase letters";
    if (!/(?=.*\d)/.test(password)) return "Password must contain numbers";
    if (!/(?=.*[@$!%*?&])/.test(password)) return "Password must contain special characters (@$!%*?&)";
    return "Strong password";
  };

  // Handle password change
  const handlePasswordChange = (value: string) => {
    setSignupForm({
      ...signupForm,
      password: value
    });
    setPasswordStrength(checkPasswordStrength(value));
  };

  // Handle NPN input change
  const handleNPNChange = (value: string) => {
    setSignupForm({
      ...signupForm,
      npn: value
    });
    setNpnValidated(false);
    setProducerInfo(null);

    // Auto-validate when NPN is complete and we have lastName
    if (value.length >= 8 && signupForm.lastName) {
      validateNPN(value);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in."
      });
      
      // Check subscription status and redirect accordingly
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: subscription } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_end')
          .eq('user_id', session.user.id)
          .single();
        
        const isActive = subscription?.subscribed && 
          (!subscription.subscription_end || new Date(subscription.subscription_end) > new Date());
        
        if (isActive) {
          navigate("/agent-hq");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (passwordStrength !== "Strong password") {
      setError("Please ensure your password meets all security requirements");
      setLoading(false);
      return;
    }
    if (!npnValidated) {
      setError("Please enter a valid NPN");
      setLoading(false);
      return;
    }
    try {
      const redirectUrl = `${window.location.origin}/email-confirmation`;
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: signupForm.firstName,
            last_name: signupForm.lastName,
            phone_number: signupForm.phoneNumber,
            company_name: showCompanyFields ? signupForm.companyName : "",
            position_title: showCompanyFields ? signupForm.positionTitle : "",
            npn: signupForm.npn,
            license_state: signupForm.licenseState
          }
        }
      });
      if (error) throw error;

      // If user is immediately available (email confirmation disabled)
      if (data.user && data.session) {
        toast({
          title: "Welcome!",
          description: "Account created successfully. Let's set up your profile."
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account."
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Magic link sign-in and password reset email
  const handleSendMagicLink = async () => {
    if (!loginForm.email) {
      setError("Please enter your email first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOtp({
        email: loginForm.email,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) throw error;
      toast({
        title: "Magic link sent",
        description: "Check your email for a sign-in link.",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!loginForm.email) {
      setError("Please enter your email first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      toast({
        title: "Reset email sent",
        description: "Check your email to continue resetting your password.",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Passwords don't match");
      return;
    }
    if (checkPasswordStrength(newPassword) !== "Strong password") {
      setError("Password doesn't meet security requirements");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset."
      });
      navigate("/profile");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden flex flex-col">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/20 to-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-accent/10 to-muted/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 animate-bounce" style={{
      animationDuration: '6s'
    }}></div>
      
      {/* Navy blue banner header */}
      <div className="relative z-10 w-full bg-slate-900 py-6 shadow-xl">
        <div className="container mx-auto px-4">
          <a href="/" className="flex items-center justify-center hover:opacity-90 transition-opacity duration-300">
            <img 
              src="/lovable-uploads/e4717090-75bb-490d-8d3c-f3293ca061bb.png" 
              alt="The Training Department" 
              className="h-24 w-auto object-contain filter brightness-110 rounded-xl" 
            />
          </a>
        </div>
      </div>
      
      {/* Hero image section */}
      <div className="relative z-10 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <img 
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80" 
            alt="People learning together" 
            className="w-full h-48 object-cover rounded-xl shadow-2xl"
          />
        </div>
      </div>

      {/* Subtitle section */}
      <div className="relative z-10 text-center pb-6">
        <div className="max-w-md mx-auto px-4">
          <p className="text-muted-foreground text-lg font-medium">Professional Development For Insurance Agents</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <div className="h-1 w-12 bg-primary/60 rounded-full"></div>
            <div className="h-1 w-6 bg-primary/40 rounded-full"></div>
            <div className="h-1 w-3 bg-primary/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main content with enhanced styling */}
      <div className="relative z-10 flex justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-card/90 backdrop-blur-md relative overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-lg"></div>
          
          <CardHeader className="text-center space-y-3 relative">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {isResetMode ? "Reset Password" : "Welcome!"}
            </CardTitle>
            <CardDescription className="text-base">
              {isResetMode ? "Create a new password for your account" : "Access your professional development portal"}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {error && <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            {isResetMode ? (
              <form onSubmit={handlePasswordReset} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password *</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={newPassword} 
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordStrength(checkPasswordStrength(e.target.value));
                      }} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {newPassword && (
                    <div className={`text-xs ${passwordStrength === "Strong password" ? "text-green-600" : "text-red-600"}`}>
                      {passwordStrength}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password *</Label>
                  <Input 
                    id="confirm-new-password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !newPassword || !confirmNewPassword || passwordStrength !== "Strong password"} 
                  className="w-full text-slate-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <span className="font-medium">Reset Password</span>
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger value="login" className="data-[state=active]:bg-background/80 data-[state=active]:shadow-sm">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-background/80 data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={loginForm.email} onChange={e => setLoginForm({
                    ...loginForm,
                    email: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={loginForm.password} onChange={e => setLoginForm({
                    ...loginForm,
                    password: e.target.value
                  })} />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full text-slate-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <span className="font-medium">Login</span>
                  </Button>
                  <div className="flex items-center justify-between pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={handleSendMagicLink} disabled={loading || !loginForm.email}>
                      Send magic link
                    </Button>
                    <Button type="button" variant="link" size="sm" onClick={handleSendResetEmail} disabled={loading || !loginForm.email}>
                      Forgot password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address *</Label>
                    <Input id="signup-email" type="email" required value={signupForm.email} onChange={e => setSignupForm({
                    ...signupForm,
                    email: e.target.value
                  })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name *</Label>
                      <Input id="first-name" type="text" required value={signupForm.firstName} onChange={e => setSignupForm({
                      ...signupForm,
                      firstName: e.target.value
                    })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name *</Label>
                      <Input id="last-name" type="text" required value={signupForm.lastName} onChange={e => setSignupForm({
                      ...signupForm,
                      lastName: e.target.value
                    })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={signupForm.phoneNumber} onChange={e => setSignupForm({
                    ...signupForm,
                    phoneNumber: e.target.value
                  })} />
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox id="company-info" checked={showCompanyFields} onCheckedChange={checked => setShowCompanyFields(checked as boolean)} />
                    <Label htmlFor="company-info" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I want to provide company information
                    </Label>
                  </div>

                  {showCompanyFields && <>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input id="company" type="text" value={signupForm.companyName} onChange={e => setSignupForm({
                      ...signupForm,
                      companyName: e.target.value
                    })} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Position/Title</Label>
                        <Input id="position" type="text" value={signupForm.positionTitle} onChange={e => setSignupForm({
                      ...signupForm,
                      positionTitle: e.target.value
                    })} />
                      </div>
                    </>}

                  <div className="space-y-2">
                    <Label htmlFor="license-state">License State *</Label>
                    <Input id="license-state" type="text" required placeholder="e.g., CA, TX, NY" value={signupForm.licenseState} onChange={e => setSignupForm({
                    ...signupForm,
                    licenseState: e.target.value.toUpperCase()
                  })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="npn">National Producer Number (NPN) *</Label>
                    <div className="relative">
                      <Input id="npn" type="text" required placeholder="Enter your 8-10 digit NPN" value={signupForm.npn} onChange={e => handleNPNChange(e.target.value)} className={npnValidated ? "border-green-500" : ""} />
                      {npnValidating && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                      {npnValidated && <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />}
                    </div>
                    {producerInfo && <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        <p><strong>Name:</strong> {producerInfo.name}</p>
                        <p><strong>License State:</strong> {producerInfo.license_state}</p>
                        <p><strong>Status:</strong> {producerInfo.license_status}</p>
                      </div>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? "text" : "password"} required value={signupForm.password} onChange={e => handlePasswordChange(e.target.value)} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {signupForm.password && <div className={`text-xs ${passwordStrength === "Strong password" ? "text-green-600" : "text-red-600"}`}>
                        {passwordStrength}
                      </div>}
                    <div className="text-xs text-muted-foreground">
                      Password must contain: 8+ characters, uppercase, lowercase, numbers, and special characters (@$!%*?&)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <div className="relative">
                      <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} required value={signupForm.confirmPassword} onChange={e => setSignupForm({
                      ...signupForm,
                      confirmPassword: e.target.value
                    })} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading || !npnValidated || passwordStrength !== "Strong password"} className="w-full text-slate-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <span className="font-medium">Create Account</span>
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navy blue footer banner */}
      <div className="relative z-10 w-full bg-slate-900 py-6 shadow-xl border-t border-slate-800 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-slate-300 font-medium">
              Trusted by thousands of insurance professionals nationwide
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-slate-400">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Secure & Encrypted</span>
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">NIPR Verified</span>
              </span>
            </div>
            <div className="flex items-center justify-center space-x-6 text-xs">
              <a href="/privacy-policy" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                Privacy Policy
              </a>
              <span className="text-slate-600">|</span>
              <a href="/terms-of-service" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;
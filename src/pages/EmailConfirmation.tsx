import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Get the token from URL parameters
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || type !== 'signup') {
        setStatus('error');
        setMessage('Invalid confirmation link. Please try signing up again.');
        return;
      }

      try {
        // The token verification happens automatically when the page loads
        // We just need to check if the user is now authenticated
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus('error');
          setMessage('Failed to confirm email. Please try again.');
          return;
        }

        if (session) {
          setStatus('success');
          setMessage('Your email has been successfully confirmed! You can now access your account.');
          
          toast({
            title: "Email Confirmed!",
            description: "Welcome! Your account is now active.",
          });
        } else {
          setStatus('error');
          setMessage('Email confirmation failed. Please try signing up again.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, toast]);

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary/20 to-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"></div>
      
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

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center px-4 py-16 flex-grow">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-card/90 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-lg"></div>
          
          <CardHeader className="text-center space-y-3 relative">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-500" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {status === 'loading' && 'Confirming Email...'}
              {status === 'success' && 'Email Confirmed!'}
              {status === 'error' && 'Confirmation Failed'}
            </CardTitle>
            
            <CardDescription className="text-base">
              {status === 'loading' && 'Please wait while we confirm your email address.'}
              {status === 'success' && 'Your account is now active and ready to use.'}
              {status === 'error' && 'There was a problem confirming your email address.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative space-y-4">
            <Alert variant={status === 'success' ? 'default' : 'destructive'}>
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            {status !== 'loading' && (
              <Button 
                onClick={handleContinue}
                className="w-full text-slate-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {status === 'success' ? 'Continue to Dashboard' : 'Back to Sign Up'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full bg-slate-900 py-6 shadow-xl border-t border-slate-800 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-slate-300 font-medium">
              Trusted by thousands of insurance professionals nationwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
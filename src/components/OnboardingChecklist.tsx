import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Mail, Phone, User, Camera, Award, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof CheckCircle;
  completed: boolean;
  action?: () => void;
  actionText?: string;
}

interface OnboardingChecklistProps {
  userId: string;
  profile: any;
  onUpdate?: () => void;
}

const OnboardingChecklist = ({ userId, profile, onUpdate }: OnboardingChecklistProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const logActivity = async (action: string, details?: any) => {
    try {
      await supabase.from('user_activity_log').insert({
        user_id: userId,
        action,
        details,
        ip_address: null, // Would be filled by server in production
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const markEmailVerified = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('user_id', userId);

      if (error) throw error;

      await logActivity('email_verified', { email: profile.email });
      
      toast({
        title: "Email Verified",
        description: "Your email has been marked as verified",
      });
      
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', userId);

      if (error) throw error;

      await logActivity('onboarding_completed');
      
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to The Training Department. Your account is fully set up!",
      });
      
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'email_verified',
      title: 'Verify Email Address',
      description: 'Confirm your email address for account security',
      icon: Mail,
      completed: profile?.email_verified || false,
      action: markEmailVerified,
      actionText: 'Mark as Verified'
    },
    {
      id: 'profile_info',
      title: 'Complete Profile Information',
      description: 'Add your name, company, and professional details',
      icon: User,
      completed: (profile?.profile_completion_percentage || 0) >= 50,
      action: () => navigate('/profile'),
      actionText: 'Complete Profile'
    },
    {
      id: 'avatar_upload',
      title: 'Upload Profile Picture',
      description: 'Add a professional photo to your account',
      icon: Camera,
      completed: !!profile?.avatar_url,
      action: () => navigate('/profile'),
      actionText: 'Upload Photo'
    },
    {
      id: 'npn_verified',
      title: 'Verify NPN Number',
      description: 'Confirm your National Producer Number',
      icon: Award,
      completed: profile?.npn_verified || false,
      action: () => navigate('/profile'),
      actionText: 'Verify NPN'
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;

  if (profile?.onboarding_completed && allCompleted) {
    return null; // Don't show checklist if onboarding is complete
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Account Setup Checklist
        </CardTitle>
        <CardDescription>
          Complete these steps to get the most out of your account
        </CardDescription>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{completedSteps} of {steps.length} completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {step.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <div>
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {step.completed ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  Complete
                </Badge>
              ) : (
                step.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={step.action}
                    disabled={loading}
                  >
                    {step.actionText}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )
              )}
            </div>
          </div>
        ))}
        
        {allCompleted && !profile?.onboarding_completed && (
          <div className="pt-4 border-t">
            <Button 
              onClick={completeOnboarding}
              disabled={loading}
              className="w-full"
            >
              Complete Onboarding
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;
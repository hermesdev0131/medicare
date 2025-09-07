import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshSubscription = async () => {
      try {
        // Call check-subscription to update the subscription status
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error checking subscription:', error);
          toast({
            title: "Error",
            description: "Could not verify subscription status. Please try again.",
            variant: "destructive",
          });
        } else {
          console.log('Subscription status updated:', data);
          toast({
            title: "Success!",
            description: "Your subscription has been activated successfully.",
          });
        }
      } catch (error) {
        console.error('Error refreshing subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    refreshSubscription();
  }, [toast]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Welcome to Your Plan!</CardTitle>
          <CardDescription className="text-base">
            Your subscription has been successfully activated.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <p>Verifying your subscription...</p>
            ) : (
              <p>You now have access to all premium features and content.</p>
            )}
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleContinue} 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Loading..." : "Continue to Dashboard"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="w-full"
            >
              View Subscription Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
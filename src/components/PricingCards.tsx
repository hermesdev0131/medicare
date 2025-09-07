import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Star, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
const PricingCards = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscription_tier?: string;
    subscription_end?: string;
  }>({ subscribed: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkSubscriptionStatus();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkSubscriptionStatus();
      } else {
        setSubscriptionStatus({ subscribed: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (planTier: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: planTier }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const agentPlans = [{
    id: 'core',
    name: 'Core',
    price: '$40',
    tier: 'core',
    period: '/month',
    description: 'Essential Medicare training resources for growing agents',
    icon: CheckCircle,
    features: ['Extensive Medicare-related content', 'Detailed insurance carrier information', 'Sales training materials', 'Regularly updated industry news feed', 'AI Chatbot for instant information access'],
    buttonText: 'Start Core Plan',
    buttonVariant: 'default' as const,
    popular: false
  }, {
    id: 'enhanced',
    name: 'Enhanced',
    price: '$55',
    tier: 'enhanced',
    period: '/month',
    description: 'Core resources plus live training sessions',
    icon: Star,
    features: ['All Core plan features', 'One live instructor-led webinar per week', 'Priority AI Chatbot support', 'Advanced sales training materials', 'Expert Q&A sessions'],
    buttonText: 'Start Enhanced Plan',
    buttonVariant: 'default' as const,
    popular: true
  }, {
    id: 'premium',
    name: 'Premium',
    price: '$75',
    tier: 'premium',
    period: '/month',
    description: 'Complete training solution with unlimited access',
    icon: Crown,
    features: ['Unlimited live instructor-led webinars', 'Full access to Learning Management System (LMS)', 'Interactive e-learning courses with tracking', 'Complete library of On-Demand Training Videos', 'Professional profile publishing capabilities', 'Priority AI Chatbot support'],
    buttonText: 'Start Premium Plan',
    buttonVariant: 'premium' as const,
    popular: false
  }, {
    id: 'business',
    name: 'Business Leader',
    price: '$150',
    tier: 'business',
    period: '/month',
    description: 'For teams and growing agencies',
    icon: Crown,
    features: ['All Premium features', 'Team management (up to 10 agents)', 'Bulk enrollment', 'Advanced analytics', 'Custom branding', 'Dedicated account manager'],
    buttonText: 'Start Business Plan',
    buttonVariant: 'premium' as const,
    popular: false
  }];
  return <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Training Path
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Flexible subscription plans designed to meet the unique needs of Medicare insurance professionals.
          </p>
        </div>

        {/* Agent Plans */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {agentPlans.map((plan, index) => {
            const IconComponent = plan.icon;
            return <Card key={index} className={`relative h-full flex flex-col shadow-card hover:shadow-hover transition-all duration-300 ${plan.popular ? 'border-primary shadow-professional scale-105' : 'border-border'}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>}
                  
                  <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-4">
                      <IconComponent className={`h-10 w-10 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-primary">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                    <CardDescription className="text-base mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex-grow">
                    {plan.features.map((feature, featureIndex) => <div key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>)}
                  </CardContent>
                  
                  <CardFooter className="my-0 mt-auto">
                    {subscriptionStatus.subscribed && subscriptionStatus.subscription_tier === plan.tier ? (
                      <div className="w-full space-y-2">
                        <div className="text-center text-sm text-success font-medium">
                          Current Plan
                        </div>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full" 
                          onClick={handleManageSubscription}
                          disabled={loading}
                        >
                          Manage Subscription
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant={plan.buttonVariant} 
                        size="lg" 
                        className="w-full text-slate-50 py-0 bg-slate-900 hover:bg-slate-800" 
                        onClick={() => handleSubscribe(plan.tier)}
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : plan.buttonText}
                      </Button>
                    )}
                  </CardFooter>
                </Card>;
          })}
          </div>
        </div>


        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            All plans include our comprehensive AI chatbot for instant support and guidance.
          </p>
          <p className="text-sm text-muted-foreground">
            Need a custom solution? <span className="text-primary font-semibold cursor-pointer hover:underline">Contact us</span> for enterprise pricing.
          </p>
        </div>
      </div>
    </section>;
};
export default PricingCards;
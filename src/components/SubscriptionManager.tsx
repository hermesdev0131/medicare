import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, RefreshCw, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const SubscriptionManager = () => {
  const { user, isSubscribed, subscriptionTier, subscriptionEnd, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        toast({
          title: "Error",
          description: "Could not open subscription management portal",
          variant: "destructive",
        });
        return;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Could not open subscription management portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      toast({
        title: "Success",
        description: "Subscription status refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not refresh subscription status",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'core': return 'bg-blue-500';
      case 'enhanced': return 'bg-purple-500';
      case 'premium': return 'bg-gold-500';
      case 'business': return 'bg-black';
      default: return 'bg-gray-500';
    }
  };

  const formatTierName = (tier: string | null) => {
    if (!tier) return 'Free';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Subscription Management
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Subscription Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Current Plan</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshSubscription}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isSubscribed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-500" />
              )}
              <span className="font-medium">
                {isSubscribed ? 'Active Subscription' : 'Free Account'}
              </span>
            </div>
            <Badge className={getTierColor(subscriptionTier)}>
              {formatTierName(subscriptionTier)}
            </Badge>
          </div>

          {subscriptionEnd && isSubscribed && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Renews on {format(new Date(subscriptionEnd), 'MMMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Plan Features */}
        <div className="space-y-3">
          <h4 className="font-medium">Your Current Features</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Free resources and guides</span>
            </div>
            
            {isSubscribed && (
              <>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Full course library access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Live webinars and events</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Premium support</span>
                </div>
                
                {subscriptionTier === 'premium' || subscriptionTier === 'business' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Advanced analytics and reporting</span>
                  </div>
                )}
                
                {subscriptionTier === 'business' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Team management (up to 3 agents)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Priority support</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          {isSubscribed ? (
            <Button 
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full"
            >
              {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Manage Subscription
            </Button>
          ) : (
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="w-full"
            >
              Upgrade Your Plan
            </Button>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            {isSubscribed 
              ? "Manage your subscription, update payment methods, or cancel anytime"
              : "Choose a plan that fits your needs and start learning today"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
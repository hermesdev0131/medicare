import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSubscription = (userId?: string) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const refreshSubscription = async () => {
    if (!userId) {
      setIsSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is admin - if so, bypass subscription checks
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const roles = rolesData?.map(r => r.role) || [];
      const isAdmin = roles.includes('admin');
      
      if (isAdmin) {
        // Admin users get business-level access by default
        setIsSubscribed(true);
        setSubscriptionTier('business');
        setSubscriptionEnd(null); // No expiration for admin
        setLoading(false);
        return;
      
      }
      
      // Call the check-subscription edge function to get fresh data from Stripe
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error calling check-subscription:', error);
        // Fallback to database check
        const { data: dbData } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, subscription_end')
          .eq('user_id', userId)
          .single();
          
        if (dbData) {
          const isActive = dbData.subscribed && 
            (!dbData.subscription_end || new Date(dbData.subscription_end) > new Date());
          setIsSubscribed(isActive);
          setSubscriptionTier(dbData.subscription_tier);
          setSubscriptionEnd(dbData.subscription_end);
        } else {
          setIsSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
        }
      } else {
        setIsSubscribed(data?.subscribed || false);
        setSubscriptionTier(data?.subscription_tier || null);
        setSubscriptionEnd(data?.subscription_end || null);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setIsSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [userId]);

  return { 
    isSubscribed, 
    loading, 
    subscriptionTier, 
    subscriptionEnd,
    refreshSubscription 
  };
};
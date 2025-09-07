import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CreditCard } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  requiredTier?: 'core' | 'enhanced' | 'premium' | 'business';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSubscription = false,
  requiredTier,
  fallbackPath = '/dashboard'
}) => {
  const { user, loading, subscriptionLoading, isSubscribed, subscriptionTier } = useAuth();
  const location = useLocation();

  const [adminLoading, setAdminLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }
      try {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        const roles = rolesData?.map((r: any) => r.role) || [];
        setIsAdmin(roles.includes('admin'));
      } finally {
        setAdminLoading(false);
      }
    };
    checkAdmin();
  }, [user?.id]);

  // Show loading spinner while checking authentication and roles/subscription
  if (loading || subscriptionLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check subscription requirement
  if (requireSubscription && !isSubscribed && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Subscription Required</h2>
            <p className="text-muted-foreground mb-6">
              This feature requires an active subscription to access premium content and resources.
            </p>
            <div className="space-y-3">
              <Button onClick={() => window.location.href = '/pricing'} className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                View Subscription Plans
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = fallbackPath}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check tier requirement
  if (requiredTier && !isAdmin && isSubscribed) {
    const tierHierarchy = {
      core: 1,
      enhanced: 2,
      premium: 3,
      business: 4
    };

    const userTierLevel = tierHierarchy[subscriptionTier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-6">
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Upgrade Required</h2>
              <p className="text-muted-foreground mb-6">
                This feature requires a {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan or higher.
                You currently have: {subscriptionTier?.charAt(0).toUpperCase() + subscriptionTier?.slice(1) || 'Free'}
              </p>
              <div className="space-y-3">
                <Button onClick={() => window.location.href = '/pricing'} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Upgrade Your Plan
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = fallbackPath}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
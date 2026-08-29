import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useAuth } from '@/src/components/auth/auth-provider';
import { supabase } from '@/src/lib/supabase/client';
import { Loader2, CreditCard, CheckCircle2, Clock, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUserMaxTeamMembers } from '@/src/lib/subscriptions/entitlements';

export function BillingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [canceling, setCanceling] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.paymentSuccess ? "Payment submitted. We're confirming your subscription..." : "");

  const { data: sub, isLoading, refetch } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id, 
          status, 
          current_period_end, 
          cancel_at_period_end,
          subscription_plans(name, slug, price, billing_interval)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: !!user,
    refetchInterval: (query) => {
      // If we just paid and status is still 'created', poll more frequently
      return query.state.data?.status === 'created' ? 2000 : false;
    }
  });

  useEffect(() => {
    if (sub?.status === 'active' && location.state?.paymentSuccess) {
      setSuccessMessage("Subscription Activated!");
      // Clear state so it doesn't persist on reload
      window.history.replaceState({}, document.title);
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    }
  }, [sub?.status, location.state]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) return;
    
    try {
      setCanceling(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to cancel');
      }
      
      await refetch();
      alert('Subscription will be canceled at the end of the billing period.');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setCanceling(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

  const plan = sub?.subscription_plans;
  const isPro = plan?.slug?.includes('pro');
  const maxTeamMembers = getUserMaxTeamMembers(plan?.slug);
  const isActive = sub?.status === 'active' && new Date(sub?.current_period_end) > new Date();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Manage your subscription status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Plan</span>
              <span className="font-semibold">{isActive ? plan?.name : 'Free'}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Status</span>
              <span className="font-medium capitalize">
                {isActive ? (
                  sub?.cancel_at_period_end ? (
                    <span className="text-orange-600">Cancels at period end</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )
                ) : sub?.status === 'created' ? (
                   <span className="text-blue-600 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Confirming...</span>
                ) : 'Inactive'}
              </span>
            </div>

            {isActive && (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Billing Cycle</span>
                  <span className="capitalize">{plan?.billing_interval}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Price</span>
                  <span>₹{plan?.price}/{plan?.billing_interval === 'yearly' ? 'yr' : 'mo'}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Next Billing Date</span>
                  <span>{new Date(sub.current_period_end).toLocaleDateString()}</span>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            {!isActive && (
               <Button onClick={() => navigate('/pricing')}>View Plans</Button>
            )}
            {isActive && !sub?.cancel_at_period_end && (
              <>
                <Button variant="outline" onClick={() => navigate('/pricing')}>Change Plan</Button>
                <Button variant="destructive" onClick={handleCancel} disabled={canceling}>
                  {canceling ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                  Cancel Subscription
                </Button>
              </>
            )}
            {isActive && sub?.cancel_at_period_end && (
               <Button variant="outline" onClick={() => navigate('/pricing')}>Renew / Change Plan</Button>
            )}
          </CardFooter>
        </Card>

        {isPro && isActive && (
          <Card>
             <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600"/> Team Access</CardTitle>
              <CardDescription>Your plan includes team members</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="bg-gray-50 p-6 rounded-lg text-center border border-gray-100">
                  <p className="text-3xl font-bold text-gray-900 mb-2">Max {maxTeamMembers} Users</p>
                  <p className="text-sm text-gray-500 mb-6">Manage your team members and their access to Pro features.</p>
                  <Button onClick={() => navigate('/dashboard/team')} className="w-full">Manage Team</Button>
               </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

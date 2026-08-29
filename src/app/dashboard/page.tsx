import { useAuth } from '@/src/components/auth/auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card';
import { logout } from '@/src/lib/supabase/auth';
import { Button } from '@/src/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

export function Dashboard() {
  const { user, profile, subscription, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isPro = subscription?.plan_id?.includes('pro');

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>Log out</Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Name:</span> {profile?.full_name || 'N/A'}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-semibold">Role:</span> 
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {profile?.role || 'user'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>Manage your billing</CardDescription>
          </CardHeader>
          <CardContent>
            {hasActiveSubscription && subscription ? (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Current Plan:</span> 
                  <span className="ml-2 uppercase text-sm font-bold text-green-600">
                    {subscription.plan_id.replace('plan_', '').replace('_monthly', '').replace('_yearly', '')}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Status:</span> 
                  <span className="ml-2 capitalize">{subscription.status}</span>
                </div>
                <div>
                  <span className="font-semibold">Renews on:</span> 
                  <span className="ml-2">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                </div>
                {isPro && (
                  <div className="mt-4 pt-4 border-t text-sm text-slate-600">
                    You have Pro access, which includes up to 10 email accounts for your team. Contact support to add team members.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">You are currently on the free plan.</p>
                <Button asChild className="w-full">
                  <Link to="/pricing">Upgrade Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
          {hasActiveSubscription && (
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/payment-history">View Payment History</Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Calculations</CardTitle>
            <CardDescription>Your recent EMI calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You have no saved calculations yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

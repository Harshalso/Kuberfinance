import { useAuth } from '@/src/components/auth/auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { logout } from '@/src/lib/supabase/auth';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
            <CardTitle>Saved Calculations</CardTitle>
            <CardDescription>Your recent EMI calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You have no saved calculations yet.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>Manage your billing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You are currently on the free plan.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { useAuth } from '@/src/components/auth/auth-provider';
import { supabase } from '@/src/lib/supabase/client';
import { Loader2, UserPlus, X, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserMaxTeamMembers } from '@/src/lib/subscriptions/entitlements';

export function TeamDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const { data: sub, isLoading: subLoading } = useQuery({
    queryKey: ['team-subscription'],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('subscriptions')
        .select(`plan_id, status, current_period_end, subscription_plans(name, slug, price)`)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/team/members', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.members || [];
    },
    enabled: !!user
  });

  const inviteMutation = useMutation({
    mutationFn: async (inviteEmail: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setEmail('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message);
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (removeEmail: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/team/members/${encodeURIComponent(removeEmail)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!res.ok) throw new Error('Failed to remove member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    }
  });

  if (subLoading || membersLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
  }

  const plan = sub?.subscription_plans;
  const isPro = plan?.slug?.includes('pro');
  const isActive = sub?.status === 'active' && new Date(sub?.current_period_end) > new Date();

  if (!isPro || !isActive) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Team Management</h1>
        <p className="text-gray-500 mb-8">Team features are only available on the Pro plan.</p>
        <Button onClick={() => window.location.href = '/pricing'}>Upgrade to Pro</Button>
      </div>
    );
  }

  const maxMembers = getUserMaxTeamMembers(plan?.slug) - 1; // 10 total users = 1 owner + 9 members
  const currentCount = members?.length || 0;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate(email);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Team Management</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>Add a colleague to your Pro plan</CardDescription>
          </CardHeader>
          <form onSubmit={handleInvite}>
            <CardContent className="space-y-4">
               {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded flex gap-2 items-start">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
               )}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="colleague@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={inviteMutation.isPending || currentCount >= maxMembers}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={inviteMutation.isPending || currentCount >= maxMembers || !email}
              >
                {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Send Invite
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="md:col-span-2">
           <CardHeader>
             <div className="flex justify-between items-start">
                <div>
                   <CardTitle>Team Members</CardTitle>
                   <CardDescription>People with access to your Pro plan</CardDescription>
                </div>
                <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {currentCount} / {maxMembers} Members
                </div>
             </div>
           </CardHeader>
           <CardContent>
              {currentCount === 0 ? (
                 <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                   No team members yet. Invite someone to get started.
                 </div>
              ) : (
                <div className="space-y-4">
                  {members?.map((member: any) => (
                    <div key={member.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.member_email}</p>
                        <p className="text-xs text-gray-500">Added {new Date(member.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Remove ${member.member_email} from your team?`)) {
                            removeMutation.mutate(member.member_email);
                          }
                        }}
                        disabled={removeMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

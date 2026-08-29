import { useEffect, useState } from 'react';
import { useAuth } from '@/src/components/auth/auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { getAdminDashboardStats, AdminStats } from '@/src/lib/supabase/admin';
import { supabase } from '@/src/lib/supabase/client';
import { ShieldCheck, Users, Building2, Briefcase, Tags, FileText, Gift, Loader2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAdminDashboardStats();
        setStats(data);
        
        // Fetch 5 most recent audit logs
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('id, action, entity, created_at, profiles:user_id(full_name)')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (logs) setRecentLogs(logs);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name}. Here is what's happening on the platform.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Banks</CardTitle>
                <Building2 className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalBanks || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Institutions listed</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Briefcase className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalCompanies || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Company records</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Company Categories</CardTitle>
                <Tags className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalCategories || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Bank-company mappings</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                <FileText className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.activePolicies || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Published policy documents</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
                <Gift className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.activeOffers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Live promotional offers</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity & Imports</CardTitle>
                <CardDescription>Latest administrative actions across the platform.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/audit">View Full Log</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                  No recent activity found.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-2 rounded-full">
                          <ShieldCheck className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {log.profiles?.full_name || 'Admin'} performed <span className="font-bold text-primary">{log.action}</span> on {log.entity}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

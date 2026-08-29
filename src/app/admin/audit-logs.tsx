import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Loader2, ClipboardList, Search } from 'lucide-react';
import { Input } from '@/src/components/ui/input';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  profiles?: { full_name: string; email: string };
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select(`
            *,
            profiles:user_id(full_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          // If table doesn't exist, we just catch the error.
          console.error("Could not fetch audit logs. Table might not exist yet.", error);
        } else {
          setLogs(data as AuditLog[]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Review administrative actions and system events.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium">No Audit Logs Found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Administrative actions will appear here once tracked. If the table is missing, ensure the database schema includes an `audit_logs` table.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Admin User</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {log.profiles?.full_name || 'Unknown'} 
                        <span className="block text-xs font-normal text-slate-500">{log.profiles?.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{log.entity}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500 truncate max-w-[120px]" title={log.entity_id}>
                        {log.entity_id || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

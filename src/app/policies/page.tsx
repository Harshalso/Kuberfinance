import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { getActiveBanksWithPolicies } from '@/src/lib/supabase/policies';

export function Policies() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBanks() {
      try {
        const data = await getActiveBanksWithPolicies();
        setBanks(data);
      } catch (err: any) {
        console.error('Failed to load banks:', err);
        setError('Could not load bank policies.');
      } finally {
        setLoading(false);
      }
    }
    loadBanks();
  }, []);

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Bank Policies</h1>
          <p className="text-slate-600">Select a bank to view their latest loan policy guidelines, eligibility criteria, and rules.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        ) : banks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-slate-500">No active bank policies available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map((bank) => (
              <Link key={bank.id} to={`/bank-policies/${bank.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                      {bank.logo_url ? (
                        <img loading="lazy" src={bank.logo_url} alt={bank.name} className="h-8 w-8 object-contain" />
                      ) : (
                        <Building2 className="h-8 w-8" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bank.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-primary mt-4 group-hover:translate-x-1 transition-transform">
                      <FileText className="h-4 w-4 mr-2" />
                      View Policy Summary
                      <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Search, Building2, Calendar, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { getBanks, searchCompanyCategories } from '@/src/lib/supabase/companies';

export function CompanySearch() {
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 10;

  // Simple debounce implementation inside component to avoid missing hook dependencies
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function loadBanks() {
      try {
        const data = await getBanks();
        setBanks(data);
      } catch (err: any) {
        console.error('Failed to load banks:', err);
      }
    }
    loadBanks();
  }, []);

  const performSearch = useCallback(async (resetPage = false) => {
    if (!debouncedQuery && !selectedBank) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const targetPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const { data, count } = await searchCompanyCategories({
        bankId: selectedBank || undefined,
        query: debouncedQuery,
        page: targetPage,
        limit: LIMIT
      });
      
      setResults(data);
      setTotalCount(count);
    } catch (err: any) {
      setError('Failed to search companies.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedBank, page]);

  useEffect(() => {
    performSearch(true);
  }, [debouncedQuery, selectedBank]);

  useEffect(() => {
    if (page > 1) {
      performSearch(false);
    }
  }, [page]);

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Company Category Search</h1>
          <p className="text-slate-600">Search for company categories across different banks to determine loan eligibility.</p>
        </div>

        <Card className="mb-8 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Select Bank</Label>
                <select 
                  id="bank"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option value="">All Banks</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Company Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="search"
                    placeholder="Enter company name..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center mb-6">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row border-l-4 border-primary">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-slate-400" />
                          {result.company?.company_name}
                        </h3>
                        <p className="text-sm font-medium text-primary mt-1">{result.bank?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                          {result.category}
                        </span>
                        {result.sub_category && (
                          <p className="text-xs text-slate-500 mt-1">Sub: {result.sub_category}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 bg-slate-50 p-4 rounded-lg text-sm">
                      <div>
                        <p className="text-slate-500 mb-1 font-medium text-xs uppercase">Eligibility</p>
                        <p className="font-semibold text-slate-900">{result.eligibility_status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1 font-medium text-xs uppercase">Policy Version</p>
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          {result.policy_version || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1 font-medium text-xs uppercase">Effective Date</p>
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {result.effective_date ? new Date(result.effective_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1 font-medium text-xs uppercase">Last Updated</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(result.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {result.remarks && (
                      <div className="mt-4 text-sm text-slate-600 bg-amber-50 p-3 rounded-md border border-amber-100">
                        <strong className="text-amber-800">Remarks: </strong> {result.remarks}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {results.length === 0 && (debouncedQuery || selectedBank) && (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                <p className="text-slate-500">No company categories found matching your criteria.</p>
              </div>
            )}
            
            {!debouncedQuery && !selectedBank && results.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                <p className="text-slate-500">Select a bank or enter a company name to start searching.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalCount > LIMIT && (
              <div className="flex justify-between items-center mt-6 py-4">
                <p className="text-sm text-slate-500">
                  Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, totalCount)} of {totalCount} results
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * LIMIT >= totalCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

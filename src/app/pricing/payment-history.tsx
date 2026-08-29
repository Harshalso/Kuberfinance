import { useEffect, useState } from 'react';
import { useAuth } from '@/src/components/auth/auth-provider';
import { supabase } from '@/src/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Clock, CreditCard, ExternalLink } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { useLocation } from 'react-router-dom';

interface Transaction {
  id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payment_plans: { name: string };
}

export function PaymentHistory() {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check if user just completed a successful payment
  const isSuccess = location.state?.success;

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select(`
            id, order_id, payment_id, amount, currency, status, created_at,
            payment_plans(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setTransactions(data as unknown as Transaction[]);
        }
      } catch (err) {
        console.error("Failed to load payment history", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadHistory();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Success</Badge>;
      case 'failed':
      case 'failed_verification':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Failed</Badge>;
      case 'created':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'failed_verification': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'created': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Payment History</h1>
          <p className="text-slate-600">View your past transactions and active subscriptions.</p>
        </div>

        {isSuccess && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-3 shrink-0 text-green-500" />
            <div>
              <h4 className="font-semibold">Payment Successful</h4>
              <p className="text-sm mt-1 text-green-700">Thank you for your subscription. Your payment has been securely verified and your account is now active.</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CreditCard className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No transactions yet</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                  When you subscribe to a plan, your payment history will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium">Plan</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {tx.payment_plans?.name || 'Unknown Plan'}
                        </td>
                        <td className="px-6 py-4">
                          ₹{tx.amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tx.status)}
                            {getStatusBadge(tx.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-xs font-mono text-slate-500">
                            {tx.payment_id || tx.order_id}
                          </div>
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
    </div>
  );
}

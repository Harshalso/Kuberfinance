import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/components/auth/auth-provider';
import { loadRazorpayScript } from '@/src/lib/razorpay';

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  is_popular: boolean;
}

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from('payment_plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (error) throw error;
        setPlans(data as PaymentPlan[]);
      } catch (err: any) {
        console.error('Failed to load plans:', err);
        // Fallback for demo purposes if table doesn't exist
        setPlans([
          {
            id: 'plan_basic',
            name: 'Basic',
            description: 'Essential features for individuals.',
            price: 999,
            billing_cycle: 'monthly',
            features: ['Access to basic tools', 'Community support', 'Standard limits'],
            is_popular: false
          },
          {
            id: 'plan_pro',
            name: 'Pro',
            description: 'Advanced features for professionals.',
            price: 2499,
            billing_cycle: 'monthly',
            features: ['All Basic features', 'Priority support', 'Extended limits', 'Advanced analytics'],
            is_popular: true
          },
          {
            id: 'plan_enterprise',
            name: 'Enterprise',
            description: 'Full access for teams.',
            price: 9999,
            billing_cycle: 'yearly',
            features: ['All Pro features', '24/7 dedicated support', 'Unlimited usage', 'Custom integrations'],
            is_popular: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  const handleSubscribe = async (plan: PaymentPlan) => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/pricing' } });
      return;
    }

    try {
      setProcessingId(plan.id);
      
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Failed to load Razorpay SDK. Please check your connection.');
        setProcessingId(null);
        return;
      }

      // Get auth session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Create Order on Server
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId: plan.id, userId: user.id })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'React Dashboard',
        description: `Subscription for ${plan.name} Plan`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment signature on the server
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                planId: plan.id
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              navigate('/payment-history', { state: { success: true } });
            } else {
              setError('Payment verification failed.');
            }
          } catch (err) {
            setError('Payment verification error.');
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#0f172a'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment Failed:', response.error);
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while initiating payment.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="py-20 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-600">
            Choose the perfect plan for your needs. Secure payments powered by Razorpay.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center max-w-3xl mx-auto">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col h-full ${
                  plan.is_popular 
                    ? 'border-primary shadow-lg scale-105 z-10' 
                    : 'border-slate-200'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</span>
                    <span className="text-slate-500 ml-2">/ {plan.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.is_popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    disabled={processingId === plan.id}
                  >
                    {processingId === plan.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-16 text-center flex items-center justify-center text-sm text-slate-500">
          <ShieldCheck className="w-5 h-5 mr-2 text-slate-400" />
          Payments are securely processed by Razorpay. 256-bit SSL encryption.
        </div>
      </div>
    </div>
  );
}

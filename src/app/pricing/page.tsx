import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/components/auth/auth-provider';
import { loadRazorpayScript } from '@/src/lib/razorpay';
import { useQuery } from '@tanstack/react-query';

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState('');
  const [processingSlug, setProcessingSlug] = useState<string | null>(null);

  // Fetch current user subscription to determine button text
  const { data: currentSub } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_id, status, subscription_plans(slug)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user
  });

  const currentPlanArray = currentSub?.subscription_plans;
  const currentPlan = Array.isArray(currentPlanArray) ? currentPlanArray[0] : currentPlanArray;
  const activeSlug = currentPlan?.slug || 'free';

  const handleSubscribe = async (planSlug: string) => {
    if (!user) {
      navigate('/login', { state: { returnTo: '/pricing' } });
      return;
    }
    
    if (planSlug === 'free') {
      navigate('/dashboard');
      return;
    }

    try {
      setProcessingSlug(planSlug);
      
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Failed to load Razorpay SDK. Please check your connection.');
        setProcessingSlug(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Create Subscription on Server
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planSlug })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize checkout');
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Loan Portal",
        description: `Subscription: ${planSlug}`,
        handler: async function (response: any) {
          // Send to verification or just dashboard
          // Webhook handles fulfillment, so we just redirect
          navigate('/dashboard/billing', { state: { paymentSuccess: true } });
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function() {
            setProcessingSlug(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setProcessingSlug(null);
      });
      
      rzp.open();

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong');
      setProcessingSlug(null);
    }
  };

  const getButtonText = (planLevel: 'free' | 'basic' | 'pro', targetSlug: string) => {
    if (processingSlug === targetSlug) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }

    const isCurrentPlan = activeSlug === targetSlug || 
      (planLevel === 'free' && (!activeSlug || activeSlug === 'free')) ||
      (planLevel === 'basic' && activeSlug.startsWith('basic_')) ||
      (planLevel === 'pro' && activeSlug.startsWith('pro_'));

    if (isCurrentPlan) return 'Current Plan';
    if (planLevel === 'free') return 'Current Plan';
    
    // If user has basic and is viewing pro
    if (activeSlug.startsWith('basic') && planLevel === 'pro') {
      return 'Upgrade to Pro';
    }

    if (planLevel === 'basic') return 'Subscribe to Basic';
    return 'Subscribe to Pro';
  };

  const isCurrentPlan = (targetSlug: string) => activeSlug === targetSlug;

  return (
    <div className="container mx-auto py-16 px-4 md:px-8 max-w-7xl">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Choose the plan that fits your needs. Upgrade or cancel anytime.
        </p>

        {error && (
          <div className="mt-8 mx-auto max-w-md p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 text-left">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="mt-8 flex justify-center items-center space-x-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
          <button 
            type="button"
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 bg-indigo-600"
            role="switch" 
            aria-checked={billingCycle === 'yearly'}
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          >
            <span 
              aria-hidden="true" 
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`} 
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly <span className="text-green-600 text-xs font-bold ml-1 px-2 py-0.5 rounded-full bg-green-100">Save up to 16%</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
        {/* FREE PLAN */}
        <Card className="flex flex-col h-full border-gray-200 shadow-sm relative">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">FREE</CardTitle>
            <CardDescription className="text-sm">For individuals getting started</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              ₹0
              <span className="ml-1 text-xl font-medium text-gray-500"></span>
            </div>
            <p className="text-sm text-gray-500 mt-2 h-5">1 User</p>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">EMI Calculator</span></li>
              <li className="flex gap-x-3 opacity-40"><Check className="h-5 w-5 shrink-0" /> <span className="text-sm line-through">Company Category Search</span></li>
              <li className="flex gap-x-3 opacity-40"><Check className="h-5 w-5 shrink-0" /> <span className="text-sm line-through">Part Payment Calculator</span></li>
              <li className="flex gap-x-3 opacity-40"><Check className="h-5 w-5 shrink-0" /> <span className="text-sm line-through">Bank Policy access</span></li>
              <li className="flex gap-x-3 opacity-40"><Check className="h-5 w-5 shrink-0" /> <span className="text-sm line-through">Saved calculations</span></li>
              <li className="flex gap-x-3 opacity-40"><Check className="h-5 w-5 shrink-0" /> <span className="text-sm line-through">Team access (up to 10 users)</span></li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={activeSlug === 'free' ? "outline" : "secondary"}
              disabled={activeSlug !== 'free'}
              onClick={() => handleSubscribe('free')}
            >
              {getButtonText('free', 'free')}
            </Button>
          </CardFooter>
        </Card>

        {/* BASIC PLAN */}
        <Card className={`flex flex-col h-full shadow-md relative ${activeSlug.startsWith('basic') ? 'border-indigo-600' : 'border-gray-200'}`}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Basic</CardTitle>
            <CardDescription className="text-sm">For professionals needing more tools</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              {billingCycle === 'monthly' ? '₹149' : '₹1,499'}
              <span className="ml-1 text-xl font-medium text-gray-500">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <p className="text-sm text-green-600 font-medium mt-2 h-5">
              {billingCycle === 'yearly' && 'Save ₹289/year'}
            </p>
            <p className="text-sm text-gray-500 mt-2 h-5">1 User</p>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">EMI Calculator</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Company Category Search</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Part Payment Calculator</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Bank Policy access</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Saved calculations</span></li>
              <li className="flex gap-x-3 opacity-40"><Check className="h-5 w-5 shrink-0" /> <span className="text-sm line-through">Team access (up to 10 users)</span></li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700" 
              onClick={() => handleSubscribe(billingCycle === 'monthly' ? 'basic_monthly' : 'basic_yearly')}
              disabled={processingSlug !== null || activeSlug.startsWith('pro')}
              variant={activeSlug.startsWith('basic') ? "outline" : "default"}
            >
              {getButtonText('basic', billingCycle === 'monthly' ? 'basic_monthly' : 'basic_yearly')}
            </Button>
          </CardFooter>
        </Card>

        {/* PRO PLAN */}
        <Card className={`flex flex-col h-full border-indigo-600 shadow-xl relative ${activeSlug.startsWith('pro') ? 'ring-2 ring-indigo-600' : ''}`}>
          <div className="absolute -top-4 inset-x-0 flex justify-center">
             <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
               Recommended for Teams
             </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pro</CardTitle>
            <CardDescription className="text-sm">For loan offices and teams</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              {billingCycle === 'monthly' ? '₹999' : '₹9,999'}
              <span className="ml-1 text-xl font-medium text-gray-500">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <p className="text-sm text-green-600 font-medium mt-2 h-5">
              {billingCycle === 'yearly' && 'Save ₹1,989/year'}
            </p>
            <p className="text-sm text-gray-500 mt-2 h-5">Up to 10 Users</p>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">EMI Calculator</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Company Category Search</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Part Payment Calculator</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Bank Policy access</span></li>
              <li className="flex gap-x-3"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-gray-700">Saved calculations</span></li>
              <li className="flex gap-x-3"><ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-indigo-900 font-medium">Team access (up to 10 users)</span></li>
              <li className="flex gap-x-3"><ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" /> <span className="text-sm text-indigo-900 font-medium">Priority Tools</span></li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={() => handleSubscribe(billingCycle === 'monthly' ? 'pro_monthly' : 'pro_yearly')}
              disabled={processingSlug !== null}
            >
              {getButtonText('pro', billingCycle === 'monthly' ? 'pro_monthly' : 'pro_yearly')}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}

// @ts-nocheck
import express, { Router } from 'express';
import { getRazorpay, verifyWebhookSignature } from '../services/razorpay.js';
import { getSupabaseAdmin } from './supabase.js';

const router = Router();

// Middleware to authenticate Supabase JWT
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

router.post('/create', requireAuth, async (req, res) => {
  try {
    console.log("Razorpay key configured:", !!(process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID));
    console.log("Razorpay secret configured:", !!process.env.RAZORPAY_KEY_SECRET);
    console.log("Supabase URL configured:", !!(process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL));
    console.log("Supabase service key configured:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { planSlug } = req.body || {};
    const userId = (req as any).user.id;
    
    if (!planSlug) {
      return res.status(400).json({ error: 'Missing planSlug' });
    }

    const supabase = getSupabaseAdmin();
    
    // Retrieve the plan from Supabase
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', planSlug)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (!plan.razorpay_plan_id) {
       return res.status(400).json({ error: 'Selected plan is not a paid subscription plan' });
    }

    const rzp = getRazorpay();
    const shortUserId = userId.replace(/-/g, '').substring(0, 10);

    // Create a Razorpay Subscription using that Plan ID
    const subscription = await rzp.subscriptions.create({
      plan_id: plan.razorpay_plan_id,
      customer_notify: 1,
      total_count: plan.billing_interval === 'yearly' ? 10 : 120, // Arbitrary end, typically max count
      notes: {
        userId,
        planSlug
      }
    });

    // Store the pending subscription in Supabase
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await supabase.from('subscriptions').upsert({
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      user_id: userId,
      plan_id: plan.id, // Or keep slug depending on schema, let's keep plan_id as it was used before or add razorpay_subscription_id
      status: subscription.status, // "created"
      razorpay_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    return res.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error("CREATE_SUBSCRIPTION_ERROR", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return res.status(500).json({
      success: false,
      error: "Unable to create subscription"
    });
  }
});

router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const supabase = getSupabaseAdmin();

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!sub || !sub.razorpay_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found to cancel' });
    }

    const rzp = getRazorpay();
    // Allow cancellation at the end of the current billing period
    await rzp.subscriptions.cancel(sub.razorpay_subscription_id, false); 
    // false = cancel at end of billing cycle

    await supabase.from('subscriptions').update({
      cancel_at_period_end: true
    }).eq('id', sub.id);

    res.json({ success: true, message: 'Subscription will be canceled at the end of the billing period' });
  } catch (err: any) {
    console.error('Error canceling subscription:', err);
    res.status(500).json({ error: err?.error?.description || 'Failed to cancel subscription' });
  }
});

export default router;

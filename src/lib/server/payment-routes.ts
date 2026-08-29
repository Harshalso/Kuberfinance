// @ts-nocheck
import express, { Router } from 'express';
import { getRazorpay, verifyRazorpaySignature, verifyWebhookSignature } from '../services/razorpay';
import { getSupabaseAdmin } from './supabase';

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

// Create Razorpay Order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = (req as any).user.id;
    
    if (!planId) {
      return res.status(400).json({ error: 'Missing planId or userId' });
    }

    const supabase = getSupabaseAdmin();
    
    // Support both old and new schemas smoothly
    let plan = null;
    const { data: subPlan } = await supabase.from('subscription_plans').select('*').eq('id', planId).single();
    if (subPlan) plan = subPlan;
    else {
      const { data: oldPlan } = await supabase.from('payment_plans').select('*').eq('id', planId).single();
      if (oldPlan) plan = oldPlan;
    }

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const amountInPaise = Math.round(Number(plan.price) * 100);

    const rzp = getRazorpay();
    const shortUserId = userId.replace(/-/g, '').substring(0, 10);
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${shortUserId}_${Date.now().toString().slice(-8)}`,
      notes: { userId, planId }
    });

    try {
      await supabase.from('payment_transactions').insert({
        user_id: userId,
        plan_id: planId,
        order_id: order.id,
        amount: plan.price,
        status: 'created',
        currency: 'INR'
      });
    } catch (e) {
      console.warn('Could not insert transaction. Database might not have the table yet.', e);
    }

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err?.error?.description || 'Failed to create order' });
  }
});

// Verify Signature
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const authenticatedUserId = (req as any).user.id;
    
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    const supabase = getSupabaseAdmin();
    
    if (isValid) {
      const { data: tx } = await supabase
        .from('payment_transactions')
        .select('user_id, plan_id, status')
        .eq('order_id', razorpay_order_id)
        .single();
        
      if (!tx) return res.status(404).json({ error: 'Transaction not found' });
      if (tx.user_id !== authenticatedUserId) return res.status(403).json({ error: 'Forbidden' });
      if (tx.status === 'paid') return res.json({ success: true, message: 'Payment already verified' });

      let plan = null;
      const { data: subPlan } = await supabase.from('subscription_plans').select('*').eq('id', tx.plan_id).single();
      if (subPlan) plan = subPlan;
      else {
        const { data: oldPlan } = await supabase.from('payment_plans').select('*').eq('id', tx.plan_id).single();
        if (oldPlan) plan = oldPlan;
      }
      
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      const startDate = new Date();
      const endDate = new Date();
      const billingCycle = plan.billing_interval || plan.billing_cycle || 'monthly';
      if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
      else if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);

      await supabase.from('subscriptions').upsert({
        user_id: tx.user_id,
        plan_id: tx.plan_id,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      await supabase.from('payment_transactions')
        .update({ status: 'paid', razorpay_payment_id })
        .eq('order_id', razorpay_order_id);
        
      res.json({ success: true, message: 'Payment verified' });
    } else {
      await supabase.from('payment_transactions')
        .update({ status: 'failed_verification' })
        .eq('order_id', razorpay_order_id);
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyString = req.body.toString('utf8');
    const isValid = verifyWebhookSignature(bodyString, signature);
    
    if (!isValid) return res.status(400).send('Invalid signature');
    
    const payload = JSON.parse(bodyString);
    const event = payload.event;
    const supabase = getSupabaseAdmin();
    const eventId = req.headers['x-razorpay-event-id'] as string || `evt_${Date.now()}`;
    
    try {
      const { data: existingEvent } = await supabase.from('payment_events').select('id').eq('event_id', eventId).single();
      if (existingEvent) return res.json({ status: 'ok', message: 'Event already processed' });
      await supabase.from('payment_events').insert({ event_id: eventId, event_type: event, payload, status: 'processed' });
    } catch (e) {
      console.warn("Could not insert payment event", e);
    }

    if (event === 'payment.captured' || event === 'payment.authorized') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      
      const { data: tx } = await supabase.from('payment_transactions').select('user_id, plan_id, status').eq('order_id', orderId).single();
      if (!tx) return res.status(200).send('Transaction not found');
      if (tx.status === 'paid') return res.json({ status: 'ok' });

      await supabase.from('payment_transactions').update({ status: 'paid', razorpay_payment_id: payment.id }).eq('order_id', orderId);
      
      let plan = null;
      const { data: subPlan } = await supabase.from('subscription_plans').select('*').eq('id', tx.plan_id).single();
      if (subPlan) plan = subPlan;
      else {
        const { data: oldPlan } = await supabase.from('payment_plans').select('*').eq('id', tx.plan_id).single();
        if (oldPlan) plan = oldPlan;
      }
      
      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        const billingCycle = plan.billing_interval || plan.billing_cycle || 'monthly';
        if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);

        await supabase.from('subscriptions').upsert({
          user_id: tx.user_id,
          plan_id: tx.plan_id,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      await supabase.from('payment_transactions').update({ status: 'failed' }).eq('order_id', payment.order_id);
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Webhook Error');
  }
});

export default router;

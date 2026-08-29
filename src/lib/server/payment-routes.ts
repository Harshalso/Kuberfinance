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
  
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  
  // Attach user to request for downstream handlers
  (req as any).user = user;
  next();
};

// Create Razorpay Order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = (req as any).user.id; // Get trusted userId from token
    
    if (!planId) {
      return res.status(400).json({ error: 'Missing planId or userId' });
    }

    const supabase = getSupabaseAdmin();
    
    // Fetch plan details
    const { data: plan, error: planError } = await (supabase as any)
      .from('payment_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const amountInPaise = Math.round(plan.price * 100);

    // Create Razorpay order
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${userId}_${Date.now()}`,
      notes: {
        userId,
        planId
      }
    });

    // Record the pending order in DB (optional but good for tracking)
    await (supabase as any).from('payment_transactions').insert({
      user_id: userId,
      plan_id: planId,
      order_id: order.id,
      amount: plan.price,
      status: 'created',
      currency: 'INR'
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.VITE_RAZORPAY_KEY_ID });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Signature (Frontend Callback)
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const authenticatedUserId = (req as any).user.id;

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    const supabase = getSupabaseAdmin();

    if (isValid) {
      // 1. Fetch transaction from DB to get the TRUSTED userId and planId
      const { data: tx, error: txError } = await (supabase as any)
        .from('payment_transactions')
        .select('user_id, plan_id, status')
        .eq('order_id', razorpay_order_id)
        .single();
        
      if (txError || !tx) return res.status(404).json({ error: 'Transaction not found' });
      
      // Ensure the user verifying the payment is the one who created it
      if (tx.user_id !== authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden: Order belongs to a different user' });
      }
      
      // Idempotency check
      if (tx.status === 'paid') {
        return res.json({ success: true, message: 'Payment already verified' });
      }

      const { user_id: userId, plan_id: planId } = tx;

      // Fetch plan to get duration
      const { data: plan } = await (supabase as any)
        .from('payment_plans')
        .select('*')
        .eq('id', planId)
        .single();
        
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      // Calculate end date based on billing cycle
      const startDate = new Date();
      const endDate = new Date();
      if (plan.billing_cycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billing_cycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1); // fallback
      }

      // Upsert subscription
      const { error: subError } = await (supabase as any).from('subscriptions').upsert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      // Update transaction status
      await (supabase as any).from('payment_transactions')
        .update({ status: 'paid', payment_id: razorpay_payment_id })
        .eq('order_id', razorpay_order_id);

      if (subError) throw subError;

      res.json({ success: true, message: 'Payment verified and subscription activated' });
    } else {
      // Update transaction status to failed
      await (supabase as any).from('payment_transactions')
        .update({ status: 'failed_verification' })
        .eq('order_id', razorpay_order_id);
        
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (err: any) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Razorpay Webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    
    // req.body is now a Buffer because of express.raw() in server.ts
    const bodyString = req.body.toString('utf8');

    const isValid = verifyWebhookSignature(bodyString, signature);
    
    if (!isValid) {
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(bodyString);
    const event = payload.event;
    
    const supabase = getSupabaseAdmin();
    
    const eventId = req.headers['x-razorpay-event-id'] as string || `evt_${Date.now()}`;
    // Check idempotency
    const { data: existingEvent } = await (supabase as any).from('payment_events').select('id').eq('event_id', eventId).single();
    if (existingEvent) {
      return res.json({ status: 'ok', message: 'Event already processed' });
    }
    await (supabase as any).from('payment_events').insert({ event_id: eventId, event_type: event, payload, status: 'processed' });

    if (event === 'payment.captured' || event === 'payment.authorized') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      
      // Fetch transaction from DB to check idempotency and get user_id/plan_id securely
      const { data: tx, error: txError } = await (supabase as any)
        .from('payment_transactions')
        .select('user_id, plan_id, status')
        .eq('order_id', orderId)
        .single();
        
      if (txError || !tx) {
        console.error('Webhook: Transaction not found for order', orderId);
        return res.status(200).send('Transaction not found, ignoring'); // 200 so razorpay doesn't retry
      }
      
      if (tx.status === 'paid') {
         return res.json({ status: 'ok', message: 'Already processed' });
      }
      
      // Update transaction
      await (supabase as any).from('payment_transactions')
        .update({ status: 'paid', payment_id: payment.id })
        .eq('order_id', orderId);
        
      // Activate subscription using secure database relationships
      const userId = tx.user_id;
      const planId = tx.plan_id;
      
      if (userId && planId) {
         const { data: plan } = await (supabase as any).from('payment_plans').select('*').eq('id', planId).single();
         if (plan) {
           const startDate = new Date();
           const endDate = new Date();
           if (plan.billing_cycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
           else if (plan.billing_cycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
           
           await (supabase as any).from('subscriptions').upsert({
             user_id: userId,
             plan_id: planId,
             status: 'active',
             current_period_start: startDate.toISOString(),
             current_period_end: endDate.toISOString(),
             updated_at: new Date().toISOString()
           }, { onConflict: 'user_id' });
         }
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      
      await (supabase as any).from('payment_transactions')
        .update({ status: 'failed', error_message: payment.error_description })
        .eq('order_id', orderId);
    }

    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Webhook Error:', err);
    res.status(500).send('Webhook Error');
  }
});

export default router;

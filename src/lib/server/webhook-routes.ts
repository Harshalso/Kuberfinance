// @ts-nocheck
import express, { Router } from 'express';
import { verifyWebhookSignature } from '../services/razorpay.js';
import { getSupabaseAdmin } from './supabase.js';

const router = Router();

router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyString = req.body.toString('utf8');
    const isValid = verifyWebhookSignature(bodyString, signature);
    
    if (!isValid) return res.status(400).send('Invalid signature');
    
    const payload = JSON.parse(bodyString);
    const event = payload.event;
    const supabase = getSupabaseAdmin();
    const eventId = req.headers['x-razorpay-event-id'] as string || `evt_${Date.now()}`;
    
    // Idempotent webhook processing
    try {
      const { data: existingEvent } = await supabase.from('payment_events').select('id').eq('event_id', eventId).single();
      if (existingEvent) return res.json({ status: 'ok', message: 'Event already processed' });
      await supabase.from('payment_events').insert({ event_id: eventId, event_type: event, payload, status: 'processed' });
    } catch (e) {
      console.warn("Could not insert payment event", e);
    }

    if (event === 'subscription.activated' || event === 'subscription.charged') {
      const subscriptionInfo = payload.payload.subscription.entity;
      const razorpaySubId = subscriptionInfo.id;
      const planId = subscriptionInfo.plan_id;
      const userId = subscriptionInfo.notes?.userId;
      
      if (!userId) {
        // Fallback: try finding by razorpay_subscription_id
        const { data: sub } = await supabase.from('subscriptions').select('user_id').eq('razorpay_subscription_id', razorpaySubId).single();
        if (!sub) return res.status(200).send('User ID not found in notes or db');
      }
      
      const uid = userId || (await supabase.from('subscriptions').select('user_id').eq('razorpay_subscription_id', razorpaySubId).single()).data?.user_id;

      // get plan from subscription_plans based on razorpay_plan_id
      const { data: plan } = await supabase.from('subscription_plans').select('id').eq('razorpay_plan_id', planId).single();

      if (plan && uid) {
        const currentPeriodStart = new Date(subscriptionInfo.current_start * 1000).toISOString();
        const currentPeriodEnd = new Date(subscriptionInfo.current_end * 1000).toISOString();

        await supabase.from('subscriptions').upsert({
          user_id: uid,
          plan_id: plan.id,
          status: 'active',
          razorpay_subscription_id: razorpaySubId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }

    } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
       const subscriptionInfo = payload.payload.subscription.entity;
       const razorpaySubId = subscriptionInfo.id;
       await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('razorpay_subscription_id', razorpaySubId);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Webhook Error');
  }
});

export default router;

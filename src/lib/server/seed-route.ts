// @ts-nocheck
import express, { Router } from 'express';
import { getSupabaseAdmin } from './supabase.js';

const router = Router();

router.get('/seed-plans', async (req, res) => {
  const supabase = getSupabaseAdmin();
  const plans = [
    {
      slug: 'free',
      name: 'Free',
      price: 0,
      currency: 'INR',
      billing_interval: 'lifetime',
      razorpay_plan_id: null,
      max_users: 1,
      is_active: true
    },
    {
      slug: 'basic_monthly',
      name: 'Basic Monthly',
      price: 149,
      currency: 'INR',
      billing_interval: 'monthly',
      razorpay_plan_id: 'plan_TVZ7tVBDFfNMsl',
      max_users: 1,
      is_active: true
    },
    {
      slug: 'basic_yearly',
      name: 'Basic Yearly',
      price: 1499,
      currency: 'INR',
      billing_interval: 'yearly',
      razorpay_plan_id: 'plan_TVZLYAncT1QBwC',
      max_users: 1,
      is_active: true
    },
    {
      slug: 'pro_monthly',
      name: 'Pro Monthly',
      price: 999,
      currency: 'INR',
      billing_interval: 'monthly',
      razorpay_plan_id: 'plan_TVZN2zGY2wgUBt',
      max_users: 10,
      is_active: true
    },
    {
      slug: 'pro_yearly',
      name: 'Pro Yearly',
      price: 9999,
      currency: 'INR',
      billing_interval: 'yearly',
      razorpay_plan_id: 'plan_TVZOR5tR3CDfvo',
      max_users: 10,
      is_active: true
    }
  ];

  try {
    for (const plan of plans) {
      await supabase.from('subscription_plans').upsert(plan, { onConflict: 'slug' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

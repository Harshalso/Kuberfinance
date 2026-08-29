import fs from 'fs';
const code = `// @ts-nocheck
import express, { Router } from 'express';
import { getSupabaseAdmin } from './supabase.js';
import { getRazorpay } from '../services/razorpay.js';

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
      razorpay_plan_id: null,
      max_users: 1,
      is_active: true
    },
    {
      slug: 'basic_yearly',
      name: 'Basic Yearly',
      price: 1499,
      currency: 'INR',
      billing_interval: 'yearly',
      razorpay_plan_id: null,
      max_users: 1,
      is_active: true
    },
    {
      slug: 'pro_monthly',
      name: 'Pro Monthly',
      price: 999,
      currency: 'INR',
      billing_interval: 'monthly',
      razorpay_plan_id: null,
      max_users: 10,
      is_active: true
    },
    {
      slug: 'pro_yearly',
      name: 'Pro Yearly',
      price: 9999,
      currency: 'INR',
      billing_interval: 'yearly',
      razorpay_plan_id: null,
      max_users: 10,
      is_active: true
    }
  ];

  try {
    const rzp = getRazorpay();
    const createdPlans = [];
    
    for (const plan of plans) {
      let razorpay_plan_id = null;
      
      // If it's a paid plan, create it in Razorpay
      if (plan.price > 0 && plan.billing_interval !== 'lifetime') {
        const rzpPlan = await rzp.plans.create({
          period: plan.billing_interval === 'yearly' ? 'yearly' : 'monthly',
          interval: 1,
          item: {
            name: plan.name,
            amount: plan.price * 100, // paise
            currency: plan.currency,
            description: \`\${plan.name} Plan\`
          }
        });
        razorpay_plan_id = rzpPlan.id;
      }

      const planData = { ...plan, razorpay_plan_id };
      await supabase.from('subscription_plans').upsert(planData, { onConflict: 'slug' });
      createdPlans.push(planData);
    }

    res.json({ success: true, message: "Plans successfully synced with Razorpay!", plans: createdPlans });
  } catch (err: any) {
    console.error("SEED_ERROR", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;
`;
fs.writeFileSync('src/lib/server/seed-route.ts', code);

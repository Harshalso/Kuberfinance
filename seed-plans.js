import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
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

  for (const plan of plans) {
    const { data, error } = await supabase.from('subscription_plans').upsert(plan, { onConflict: 'slug' });
    if (error) {
      console.error('Error inserting plan:', plan.slug, error);
    } else {
      console.log('Inserted:', plan.slug);
    }
  }
}

seed();

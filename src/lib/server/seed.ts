// @ts-nocheck
import { getSupabaseAdmin } from './supabase';

export async function seedPlans() {
  const supabase = getSupabaseAdmin();
  
  const plans = [
    { name: 'Basic', slug: 'basic-monthly', billing_interval: 'monthly', price: 149, currency: 'INR', max_users: 1, is_active: true },
    { name: 'Pro', slug: 'pro-monthly', billing_interval: 'monthly', price: 999, currency: 'INR', max_users: 10, is_active: true },
    { name: 'Basic Annual', slug: 'basic-yearly', billing_interval: 'yearly', price: 1499, currency: 'INR', max_users: 1, is_active: true },
    { name: 'Pro Annual', slug: 'pro-yearly', billing_interval: 'yearly', price: 9999, currency: 'INR', max_users: 10, is_active: true }
  ];

  const oldPlans = [
    { name: 'Basic', razorpay_plan_id: 'plan_basic_monthly', price: 149, duration: 'monthly', active: true },
    { name: 'Pro', razorpay_plan_id: 'plan_pro_monthly', price: 999, duration: 'monthly', active: true },
    { name: 'Basic Annual', razorpay_plan_id: 'plan_basic_yearly', price: 1499, duration: 'yearly', active: true },
    { name: 'Pro Annual', razorpay_plan_id: 'plan_pro_yearly', price: 9999, duration: 'yearly', active: true }
  ];

  try {
    const { error } = await supabase.from('subscription_plans').upsert(plans, { onConflict: 'slug' });
    if (error) throw error;
    console.log("Success inserting into subscription_plans.");
  } catch (e) {
    console.log("subscription_plans does not exist yet. Falling back to payment_plans.");
    const { error } = await supabase.from('payment_plans').upsert(oldPlans, { onConflict: 'razorpay_plan_id' });
    if (error) console.error("Error inserting into old payment_plans:", error);
    else console.log("Success inserting old plans.");
  }
}

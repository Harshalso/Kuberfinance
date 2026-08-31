import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const rzp = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function test() {
  const { data: plan } = await supabase.from('subscription_plans').select('*').eq('slug', 'pro_monthly').single();
  console.log("Plan:", plan);

  if (!plan) return;

  try {
    const subscription = await rzp.subscriptions.create({
      plan_id: plan.razorpay_plan_id,
      customer_notify: 1,
      total_count: plan.billing_interval === 'yearly' ? 10 : 120,
      notes: {
        userId: '12345678-1234-1234-1234-123456789012',
        planSlug: 'pro_monthly'
      }
    });
    console.log("Sub:", subscription);

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const { data: inserted, error: insertError } = await supabase.from('subscriptions').upsert({
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      user_id: '12345678-1234-1234-1234-123456789012',
      plan_id: plan.id,
      status: subscription.status,
      razorpay_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    console.log("Insert Error:", insertError);
  } catch (error) {
    console.log("ERROR:", error);
  }
}
test();

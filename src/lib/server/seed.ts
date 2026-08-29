import { getSupabaseAdmin } from './supabase';

export async function seedPlans() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('payment_plans').upsert([
    { name: 'Basic', razorpay_plan_id: 'plan_basic_monthly', price: 149, duration: 'monthly', active: true },
    { name: 'Pro', razorpay_plan_id: 'plan_pro_monthly', price: 999, duration: 'monthly', active: true },
    { name: 'Basic Annual', razorpay_plan_id: 'plan_basic_yearly', price: 1499, duration: 'yearly', active: true },
    { name: 'Pro Annual', razorpay_plan_id: 'plan_pro_yearly', price: 9999, duration: 'yearly', active: true }
  ], { onConflict: 'razorpay_plan_id' });
  
  if (error) console.error("Error inserting:", error);
  else console.log("Success inserting plans.");

  // We should also deactivate the previous ones if we want to ensure only the newly seeded ones are active.
  const { error: error2 } = await supabase.from('payment_plans').update({ active: false }).in('razorpay_plan_id', ['plan_basic', 'plan_pro', 'plan_enterprise'], { onConflict: 'razorpay_plan_id' });
  if (error2) console.error("Error updating old:", error2);
  else console.log("Success updating old plans.");
}

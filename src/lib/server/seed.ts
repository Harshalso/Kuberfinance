import { getSupabaseAdmin } from './supabase';

export async function seedPlans() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('payment_plans').upsert([
    { id: 'plan_basic_monthly', name: 'Basic', description: 'Essential features for individuals.', price: 149, billing_cycle: 'monthly', features: '["User Registration & Login", "EMI Calculator", "Company Category Search", "Part Payment Calculator", "Personal Account (1 email)", "Access to Bank Policies", "Saved Calculations"]', is_popular: false, active: true },
    { id: 'plan_pro_monthly', name: 'Pro', description: 'Advanced features for professionals.', price: 999, billing_cycle: 'monthly', features: '["Everything in Basic", "Up to 10 registered email accounts", "Designed for teams, loan offices and finance professionals", "Priority access to new features"]', is_popular: true, active: true },
    { id: 'plan_basic_yearly', name: 'Basic Annual', description: 'Annual savings for individuals.', price: 1499, billing_cycle: 'yearly', features: '["User Registration & Login", "EMI Calculator", "Company Category Search", "Part Payment Calculator", "Personal Account (1 email)", "Access to Bank Policies", "Saved Calculations"]', is_popular: false, active: true },
    { id: 'plan_pro_yearly', name: 'Pro Annual', description: 'Annual savings for professionals.', price: 9999, billing_cycle: 'yearly', features: '["Everything in Basic", "Up to 10 email accounts", "Team-oriented access", "Priority access to new features"]', is_popular: true, active: true }
  ]);
  
  if (error) console.error("Error inserting:", error);
  else console.log("Success inserting plans.");

  const { error: error2 } = await supabase.from('payment_plans').update({ active: false }).in('id', ['plan_basic', 'plan_pro', 'plan_enterprise']);
  if (error2) console.error("Error updating old:", error2);
  else console.log("Success updating old plans.");
}

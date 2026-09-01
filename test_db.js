import { getSupabaseAdmin } from './src/lib/server/supabase.js';
const supabase = getSupabaseAdmin();
supabase.from('subscription_plans').select('*').then(({data, error}) => {
  console.log("PLANS IN DB:", data);
  console.log("ERROR:", error);
});

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function fix() {
  const { data, error } = await supabase.rpc('execute_sql', { sql_string: 'ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS razorpay_plan_id text;' });
  console.log("RPC result:", error || data);
}
fix();

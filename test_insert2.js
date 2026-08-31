import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('subscriptions').upsert({
      user_id: '00000000-0000-0000-0000-000000000000',
      plan_id: '17336835-43f0-4e06-bdb6-7fa9e64ebc35',
      status: 'pending',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      razorpay_subscription_id: 'sub_123',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  console.log("Error:", error);
}
test();

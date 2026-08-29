import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('subscriptions').upsert({
      user_id: '00000000-0000-0000-0000-000000000000',
      plan_id: '00000000-0000-0000-0000-000000000000',
      status: 'created',
      razorpay_subscription_id: 'sub_123',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  console.log("Error:", error);
}
test();

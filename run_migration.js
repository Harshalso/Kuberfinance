import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'subscriptions\';' });
  if (error) {
     console.log("RPC Failed. Getting rows:");
     const {data: rows} = await supabase.from('subscriptions').select('*').limit(1);
     console.log(rows);
  } else {
     console.log(data);
  }
}
run();

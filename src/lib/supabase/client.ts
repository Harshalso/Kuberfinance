/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Client-side Supabase instance.
// NEVER use the service_role key here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

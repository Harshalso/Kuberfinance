/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Support both build-time env vars and runtime injected env vars
const env = (window as any).ENV || import.meta.env;

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co';

// Client-side Supabase instance.
// NEVER use the service_role key here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

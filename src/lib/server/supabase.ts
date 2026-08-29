import { createClient } from '@supabase/supabase-js';

// Server-side ONLY Supabase client using Service Role Key
// This bypasses RLS and should never be exposed to the client.
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.warn('Supabase Admin keys are missing. Some backend features may not work.');
      // Create a dummy client to avoid crashing on import
      supabaseAdmin = createClient(url || 'https://dummy.supabase.co', key || 'dummy-key');
    } else {
      supabaseAdmin = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
  }
  return supabaseAdmin;
}

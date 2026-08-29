import { supabase, isSupabaseConfigured } from './client';
import { UserProfile } from '@/src/types';
import { LoginFormValues, RegisterFormValues, ForgotPasswordFormValues, ResetPasswordFormValues } from '../validators/auth';

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Database is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your settings.");
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getCurrentProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // Profile not found. This happens if RLS prevented insertion during signup.
      // Since we are now authenticated, we can safely insert it.
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || 'User',
            role: 'user'
          })
          .select()
          .single();
          
        if (!insertError && newProfile) {
          return newProfile as UserProfile;
        } else {
          console.error("Failed to create profile during fetch:", insertError);
        }
      }
    } else {
      console.error("Error fetching profile:", error);
    }
    return null;
  }
  
  return data as UserProfile;
}

export async function login({ email, password }: LoginFormValues) {
  ensureConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function register({ email, password, fullName }: RegisterFormValues) {
  ensureConfigured();
  // 1. Create Auth User
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });
  
  if (error) throw error;
  
  // 2. Insert Profile (the RLS policy allows the user to insert their own profile)
  // By default, the database role is 'user'
  if (data.user && data.session) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      role: 'user'
    });
    
    if (profileError && profileError.code !== '42501') {
      console.error("Failed to create profile:", profileError);
    }
  }
  
  return data;
}

export async function logout() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword({ email }: ForgotPasswordFormValues) {
  ensureConfigured();
  const redirectUrl = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  if (error) throw error;
}

export async function updatePassword({ password }: ResetPasswordFormValues) {
  ensureConfigured();
  const { error } = await supabase.auth.updateUser({
    password: password
  });
  if (error) throw error;
}

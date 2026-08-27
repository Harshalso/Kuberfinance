import { supabase } from './client';
import { UserProfile } from '@/src/types';
import { LoginFormValues, RegisterFormValues, ForgotPasswordFormValues, ResetPasswordFormValues } from '../validators/auth';

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getCurrentProfile(userId: string): Promise<UserProfile | null> {
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function register({ email, password, fullName }: RegisterFormValues) {
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword({ email }: ForgotPasswordFormValues) {
  const redirectUrl = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  if (error) throw error;
}

export async function updatePassword({ password }: ResetPasswordFormValues) {
  const { error } = await supabase.auth.updateUser({
    password: password
  });
  if (error) throw error;
}

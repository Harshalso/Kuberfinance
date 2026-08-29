import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase/client';
import { getCurrentProfile } from '@/src/lib/supabase/auth';
import { UserProfile, Subscription } from '@/src/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  subscription: null,
  hasActiveSubscription: false,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async (userId: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    // Check if the current period end is in the future
    if (data && new Date(data.current_period_end) > new Date()) {
      let planSlug = 'free';
      const { data: sPlan } = await supabase.from('subscription_plans').select('slug').eq('id', data.plan_id).single();
      if (sPlan && sPlan.slug) {
        planSlug = sPlan.slug;
      } else {
        const { data: oPlan } = await supabase.from('payment_plans').select('razorpay_plan_id').eq('id', data.plan_id).single();
        if (oPlan && oPlan.razorpay_plan_id) planSlug = oPlan.razorpay_plan_id;
      }
      setSubscription({ ...data, plan_id: planSlug } as Subscription);
    } else {
      setSubscription(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await getCurrentProfile(session.user.id);
        setProfile(p);
        await fetchSubscription(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await getCurrentProfile(session.user.id);
        setProfile(p);
        await fetchSubscription(session.user.id);
      } else {
        setProfile(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      subscription,
      hasActiveSubscription: !!subscription || profile?.role === 'admin',
      loading,
      isAdmin: profile?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

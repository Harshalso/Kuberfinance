
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  bank_id: string;
  type: string;
  is_active: boolean;
  valid_until: string;
  created_at: string;
}

export interface HotOffer {
  id: string;
  title: string;
  description: string;
  offer_type: string;
  image?: string;
  priority: number;
  start_date?: string;
  end_date?: string;
  active: boolean;
  terms_apply: boolean;
  cta_text?: string;
  cta_link?: string;
  created_at?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

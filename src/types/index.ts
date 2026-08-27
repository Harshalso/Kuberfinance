// Global Type Definitions

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  offer_type: string;
  image_url: string;
  active: boolean;
  priority: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

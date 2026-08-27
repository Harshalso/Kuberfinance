import { supabase } from './client';
import type { Offer } from '@/src/types';

export async function getActiveOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
  
  return data as Offer[];
}

import { supabase } from './client';
import type { Offer, HotOffer } from '@/src/types';

export async function getActiveOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
  return data as Offer[];
}

export async function getHotOffers(): Promise<HotOffer[]> {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('hot_offers')
      .select('*')
      .eq('active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false });

    if (error) {
      console.warn("Hot offers table not found or error, using fallback data:", error);
      throw error;
    }
    return data as HotOffer[];
  } catch (err) {
    // Fallback data in case migration hasn't been run yet
    return [
      {
        id: '1',
        title: 'Summer Savings Festival',
        description: 'Reduced processing fees for qualifying new personal loans this summer.',
        offer_type: 'Personal Loan',
        image: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=800&q=80',
        priority: 10,
        active: true,
        terms_apply: true,
        cta_text: 'Apply Now',
        cta_link: '/offers'
      },
      {
        id: '2',
        title: 'Premium Salary Account',
        description: 'Open a premium salary account today with exclusive benefits for corporate employees.',
        offer_type: 'Bank Account',
        image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80',
        priority: 5,
        active: true,
        terms_apply: false,
        cta_text: 'Learn More',
        cta_link: '/offers'
      }
    ] as HotOffer[];
  }
}

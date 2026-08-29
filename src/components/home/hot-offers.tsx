import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Info } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/src/components/ui/card';
import { getHotOffers } from '@/src/lib/supabase/offers';
import type { HotOffer } from '@/src/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/src/components/ui/dialog';

export function HotOffers() {
  const [offers, setOffers] = useState<HotOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      try {
        const data = await getHotOffers();
        setOffers(data);
      } catch (err) {
        console.error("Failed to load hot offers:", err);
      } finally {
        setLoadingOffers(false);
      }
    }
    loadOffers();
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Featured Opportunities</h2>
            <p className="text-lg text-slate-600 mt-4 leading-relaxed">Exclusive rates, institutional updates, and priority financial instruments available for a limited time.</p>
          </div>
        </div>

        {loadingOffers ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-xl border bg-slate-100 animate-pulse"></div>
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Dialog key={offer.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer overflow-hidden hover:border-primary/50 hover:shadow-md transition-all group flex flex-col h-full bg-white relative">
                    {offer.image && (
                      <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                        <img loading="lazy" src={offer.image} alt={offer.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {offer.offer_type}
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      {!offer.image && (
                        <div className="inline-flex w-max rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                          {offer.offer_type}
                        </div>
                      )}
                      <CardTitle className="text-xl leading-tight">{offer.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-slate-600 line-clamp-3">{offer.description}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        {offer.end_date && (
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Ends {new Date(offer.end_date).toLocaleDateString()}
                          </div>
                        )}
                        {offer.terms_apply && (
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold ml-auto border border-slate-200 px-2 py-0.5 rounded">
                            T&C Apply
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-slate-50/50 pt-4">
                      <Button variant="ghost" className="w-full text-primary group-hover:bg-primary/5">
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                  {offer.image && (
                    <div className="w-full h-56 bg-slate-100 relative">
                      <img loading="lazy" src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                      <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {offer.offer_type}
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <DialogHeader className={offer.image ? 'mt-0' : 'mt-2'}>
                      {!offer.image && (
                        <div className="inline-flex w-max rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                          {offer.offer_type}
                        </div>
                      )}
                      <DialogTitle className="text-2xl">{offer.title}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="mt-4 space-y-4">
                      <p className="text-slate-600 leading-relaxed text-sm">
                        {offer.description}
                      </p>
                      
                      <div className="flex flex-col gap-2 pt-2 pb-2">
                        {offer.start_date && (
                          <div className="flex justify-between text-sm text-slate-600">
                            <span className="font-medium">Starts:</span>
                            <span>{new Date(offer.start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {offer.end_date && (
                          <div className="flex justify-between text-sm text-slate-600">
                            <span className="font-medium">Ends:</span>
                            <span className="text-amber-600 font-semibold">{new Date(offer.end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {offer.terms_apply && (
                      <div className="mt-4 flex items-start text-xs text-slate-400 bg-slate-50 p-3 rounded-md">
                        <Info className="w-4 h-4 mr-2 shrink-0" />
                        <span>Terms and conditions apply. Offers are subject to final approval and eligibility requirements as per institutional policies.</span>
                      </div>
                    )}
                    
                    <DialogFooter className="mt-6 pt-4 border-t">
                      <Button asChild className="w-full sm:w-auto">
                        <a href={offer.cta_link || '#'} target={offer.cta_link?.startsWith('http') ? '_blank' : undefined}>
                          {offer.cta_text || 'Learn More'} <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <p className="text-slate-500">No active offers available right now. Check back later.</p>
          </div>
        )}
      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { supabase } from '@/src/lib/supabase/client';
import type { HotOffer } from '@/src/types';

export function AdminOffers() {
  const [offers, setOffers] = useState<HotOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<HotOffer>>({
    title: '',
    description: '',
    offer_type: '',
    image: '',
    priority: 0,
    start_date: '',
    end_date: '',
    active: true,
    terms_apply: false,
    cta_text: '',
    cta_link: ''
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  async function fetchOffers() {
    try {
      const { data, error } = await supabase
        .from('hot_offers')
        .select('*')
        .order('priority', { ascending: false });
        
      if (error) throw error;
      setOffers(data || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const payload = { ...formData };
      if (!payload.start_date) payload.start_date = null as any;
      if (!payload.end_date) payload.end_date = null as any;
      
      if (payload.id) {
        await supabase.from('hot_offers').update(payload).eq('id', payload.id);
      } else {
        await supabase.from('hot_offers').insert(payload);
      }
      setIsDialogOpen(false);
      setFormData({
        title: '', description: '', offer_type: '', image: '', priority: 0, 
        start_date: '', end_date: '', active: true, terms_apply: false, cta_text: '', cta_link: ''
      });
      fetchOffers();
    } catch (err) {
      console.error('Failed to save offer:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await supabase.from('hot_offers').delete().eq('id', id);
      fetchOffers();
    } catch (err) {
      console.error('Failed to delete offer:', err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offer Management</h1>
          <p className="text-muted-foreground">Create and manage Hot Offers displayed on the homepage.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({
              title: '', description: '', offer_type: '', image: '', priority: 0, 
              start_date: '', end_date: '', active: true, terms_apply: false, cta_text: '', cta_link: ''
            })}>
              <Plus className="w-4 h-4 mr-2" />
              New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{formData.id ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Summer Savings Festival" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Description *</label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Offer Type *</label>
                <Input value={formData.offer_type} onChange={e => setFormData({...formData, offer_type: e.target.value})} placeholder="Personal Loan" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority (Higher = First)</label>
                <Input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Image URL</label>
                <Input value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date (Optional)</label>
                <Input type="datetime-local" value={formData.start_date ? formData.start_date.slice(0,16) : ''} onChange={e => setFormData({...formData, start_date: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date (Optional)</label>
                <Input type="datetime-local" value={formData.end_date ? formData.end_date.slice(0,16) : ''} onChange={e => setFormData({...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">CTA Text</label>
                <Input value={formData.cta_text || ''} onChange={e => setFormData({...formData, cta_text: e.target.value})} placeholder="Apply Now" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">CTA Link</label>
                <Input value={formData.cta_link || ''} onChange={e => setFormData({...formData, cta_link: e.target.value})} placeholder="/offers" />
              </div>
              
              <div className="col-span-2 flex gap-6 mt-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="rounded border-slate-300 text-primary focus:ring-primary" />
                  <span className="text-sm font-medium">Active (Visible)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.terms_apply} onChange={e => setFormData({...formData, terms_apply: e.target.checked})} className="rounded border-slate-300 text-primary focus:ring-primary" />
                  <span className="text-sm font-medium">Show "Terms Apply" Label</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.title || !formData.description || !formData.offer_type}>Save Offer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading offers...</div>
            ) : offers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No offers created yet.</div>
            ) : (
              offers.map(offer => (
                <div key={offer.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {offer.image && (
                    <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <img loading="lazy" src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{offer.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${offer.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {offer.active ? 'Active' : 'Draft'}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        {offer.offer_type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">{offer.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Priority: {offer.priority}</span>
                      {offer.start_date && <span>Starts: {new Date(offer.start_date).toLocaleDateString()}</span>}
                      {offer.end_date && <span>Ends: {new Date(offer.end_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setFormData(offer);
                      setIsDialogOpen(true);
                    }}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(offer.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// @ts-nocheck
import express, { Router } from 'express';
import { getSupabaseAdmin } from './supabase';

const router = Router();

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

router.get('/members', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_id', userId);
      
    if (error) {
       // If table doesn't exist, return empty
       if (error.code === '42P01') {
          return res.json({ members: [] });
       }
       throw error;
    }
    
    res.json({ members: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invite', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { email } = req.body;
    
    if (!email) return res.status(400).json({ error: 'Email required' });

    const supabase = getSupabaseAdmin();
    
    // Check owner's plan
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end, subscription_plans(slug)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .single();

    const planSlug = sub?.subscription_plans?.slug || 'free';
    
    if (!planSlug.includes('pro')) {
       return res.status(403).json({ error: 'Only Pro owners can manage team members. Basic and Free cannot.' });
    }

    // Check member limit
    const { data: currentMembers, error: listError } = await supabase
      .from('team_members')
      .select('id, member_email')
      .eq('owner_id', userId);

    const membersCount = currentMembers?.length || 0;
    // 1 owner + 9 members = 10 total users
    if (membersCount >= 9) {
      return res.status(400).json({ error: 'Maximum team limit reached (10 users total, 9 invites).' });
    }
    
    if (currentMembers?.some(m => m.member_email === email)) {
       return res.status(400).json({ error: 'Duplicate email: This member is already invited.' });
    }

    // Insert
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({ owner_id: userId, member_email: email });

    if (insertError) {
      if (insertError.code === '42P01') {
         return res.status(500).json({ error: 'Team members table does not exist. Please run migration.' });
      }
      throw insertError;
    }

    res.json({ success: true, message: 'Member invited successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/members/:email', requireAuth, async (req, res) => {
   try {
    const userId = (req as any).user.id;
    const { email } = req.params;
    
    const supabase = getSupabaseAdmin();
    await supabase.from('team_members').delete().match({ owner_id: userId, member_email: email });
    
    res.json({ success: true });
   } catch (err: any) {
     res.status(500).json({ error: err.message });
   }
});

export default router;

import express from 'express';
import paymentRoutes from '../src/lib/server/payment-routes';
import { getSupabaseAdmin } from '../src/lib/server/supabase';
import { getEntitlementsForPlan } from '../src/lib/subscriptions/entitlements';

const app = express();

app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use('/api/payment', paymentRoutes);

// Entitlements checking route
app.get("/api/entitlements/check", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const { feature } = req.query;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gte('current_period_end', new Date().toISOString())
    .single();

  let planSlug = 'free';
  
  if (sub && sub.plan_id) {
    // First try subscription_plans
    const { data: sPlan } = await supabase.from('subscription_plans').select('slug').eq('id', sub.plan_id).single();
    if (sPlan && sPlan.slug) {
      planSlug = sPlan.slug;
    } else {
      // Fallback to payment_plans
      const { data: oPlan } = await supabase.from('payment_plans').select('razorpay_plan_id').eq('id', sub.plan_id).single();
      if (oPlan && oPlan.razorpay_plan_id) {
        planSlug = oPlan.razorpay_plan_id;
      }
    }
  }

  const entitlements = getEntitlementsForPlan(planSlug);

  if (feature) {
    const hasAccess = !!(entitlements as any)[feature as string];
    return res.json({ access: hasAccess, plan: planSlug });
  }
  
  res.json({ entitlements, plan: planSlug });
});

export default app;

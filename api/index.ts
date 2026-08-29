// @ts-nocheck
import express from 'express';
import paymentRoutes from '../src/lib/server/payment-routes.js';
import subscriptionRoutes from '../src/lib/server/subscription-routes.js';
import webhookRoutes from '../src/lib/server/webhook-routes.js';
import seedRoutes from '../src/lib/server/seed-route.js';
import teamRoutes from '../src/lib/server/team-routes.js';
import { getSupabaseAdmin } from '../src/lib/server/supabase.js';
import { getEntitlementsForPlan } from '../src/lib/subscriptions/entitlements.js';

const app = express();

// Use webhook routes BEFORE global JSON parser if they need raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
// also keeping the old webhook path just in case
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use('/api/payment', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/team', teamRoutes);

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
  } else if (user.email) {
    // Check if user is a team member
     const { data: teamMember } = await supabase.from('team_members').select('owner_id').eq('member_email', user.email).single();
     if (teamMember) {
        const { data: ownerSub } = await supabase
          .from('subscriptions')
          .select('plan_id')
          .eq('user_id', teamMember.owner_id)
          .eq('status', 'active')
          .gte('current_period_end', new Date().toISOString())
          .single();

        if (ownerSub && ownerSub.plan_id) {
           const { data: ownerPlan } = await supabase.from('subscription_plans').select('slug').eq('id', ownerSub.plan_id).single();
           if (ownerPlan && ownerPlan.slug?.includes('pro')) {
              planSlug = ownerPlan.slug;
           }
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

// Global error handler to prevent HTML error responses from unhandled crashes or bad JSON parsing
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("EXPRESS_GLOBAL_ERROR", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});

// Vercel expects a default export function
export default app;

// Disable Vercel's default body parser so Express can handle it properly (prevents hanging)
export const config = {
  api: {
    bodyParser: false,
  },
};

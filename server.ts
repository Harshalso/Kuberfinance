import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import 'dotenv/config';
import paymentRoutes from './src/lib/server/payment-routes';
import subscriptionRoutes from './src/lib/server/subscription-routes';
import webhookRoutes from './src/lib/server/webhook-routes';
import seedRoutes from './src/lib/server/seed-route';
import teamRoutes from './src/lib/server/team-routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ==========================================
  // SERVER-SIDE API ROUTES (BUSINESS LOGIC)
  // ==========================================

  // Webhooks must be parsed as raw buffers for signature verification
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
  app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
  
  // Middleware for parsing JSON requests for all other routes
  app.use(express.json());
  
  // Mount payment routes
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
    
    // We'd typically import getSupabaseAdmin from payment-routes or a shared location
    // Since we are adding it directly here:
    const { getSupabaseAdmin } = await import('./src/lib/server/supabase.js');
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const feature = req.query.feature as string;
    
    // Fetch active subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end')
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

    const { getEntitlementsForPlan } = await import('./src/lib/subscriptions/entitlements.js');
    const entitlements = getEntitlementsForPlan(planSlug);

    if (feature) {
      const hasAccess = !!(entitlements as any)[feature];
      return res.json({ access: hasAccess, plan: planSlug });
    }
    
    res.json({ entitlements, plan: planSlug });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ==========================================
  // VITE & FRONTEND SERVING
  // ==========================================

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    

    // Serve static assets EXCEPT index.html (so we can inject env vars)
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', async (req, res) => {
      try {
        let html = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
        
        // Inject runtime environment variables for the frontend
        const envScript = `<script>window.ENV = ${JSON.stringify({
          SUPABASE_URL: process.env.SUPABASE_URL,
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
        })};</script>`;
        
        html = html.replace('</head>', `${envScript}</head>`);
        res.send(html);
      } catch (err) {
        console.error("Error serving index.html:", err);
        res.status(500).send("Server Error");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

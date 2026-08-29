import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import 'dotenv/config';
import paymentRoutes from './src/lib/server/payment-routes';
import { seedPlans } from './src/lib/server/seed';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ==========================================
  // SERVER-SIDE API ROUTES (BUSINESS LOGIC)
  // ==========================================

  // Webhooks must be parsed as raw buffers for signature verification
  app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
  
  // Middleware for parsing JSON requests for all other routes
  app.use(express.json());
  
  // Mount payment routes
  app.use('/api/payment', paymentRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/seed", async (req, res) => {
    await seedPlans();
    res.json({ success: true });
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

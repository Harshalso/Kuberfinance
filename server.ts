import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // ==========================================
  // SERVER-SIDE API ROUTES (BUSINESS LOGIC)
  // ==========================================
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example secure route that would use Razorpay secrets
  // IMPORTANT: Razorpay secret keys must only be used here, never in the frontend
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      // Implementation for Razorpay order creation would go here
      // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      res.json({ message: "Order creation endpoint ready for implementation" });
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Example secure route for Supabase admin tasks
  // IMPORTANT: Supabase service_role key must only be used here, never in the frontend
  app.post("/api/admin/users", async (req, res) => {
    try {
      // Implementation for Supabase Admin logic would go here using process.env.SUPABASE_SERVICE_ROLE_KEY
      res.json({ message: "Admin users endpoint ready for implementation" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin data" });
    }
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

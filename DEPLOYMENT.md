# Deployment Checklist

This document serves as the comprehensive deployment checklist for taking the Loan Finance Portal to production.

## 1. Supabase Setup
- [ ] Create a new Supabase project in your desired region.
- [ ] Ensure **Enable Email Confirmations** is turned ON in Authentication settings (to prevent arbitrary signups).
- [ ] Execute all SQL migrations in order (`supabase/migrations/*`).
- [ ] Configure Supabase SMTP settings with a production email provider (e.g., Resend, SendGrid) to replace the default rate-limited Supabase mailer.
- [ ] Add your production site URL (e.g., `https://yourdomain.com`) to the **Site URL** and **Redirect URLs** in Authentication settings.

## 2. Razorpay Setup
- [ ] Complete KYC to activate your Razorpay Live mode.
- [ ] Generate Live API Keys (`Key Id` and `Key Secret`).
- [ ] Configure Webhooks in the Razorpay Dashboard.
    - Webhook URL: `https://yourdomain.com/api/payment/webhook`
    - Secret: Generate a secure, high-entropy string.
    - Active Events: `payment.captured`

## 3. GitHub
- [ ] Create a private repository.
- [ ] Push the main branch. 
- [ ] **Crucial**: Ensure `.env` is present in `.gitignore` so no secrets are accidentally committed.

## 4. Vercel (or preferred hosting)
- [ ] Import the GitHub repository into Vercel.
- [ ] Set the Framework Preset to **Vite** (for frontend-only deployment) or configure the build command to `npm run build` and output directory to `dist`.
- [ ] *If using the full-stack Express server*, you must deploy this application as a Docker container (e.g., Google Cloud Run, Render, or AWS AppRunner) because Express APIs run as a long-lived Node.js process, not Serverless Functions. 
- [ ] Add the following Environment Variables in your hosting provider:

### Required Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key

# Supabase Server Key (NEVER PREFIX WITH VITE_)
SUPABASE_SERVICE_ROLE_KEY=your_secret_service_role_key

# Razorpay Client Keys
VITE_RAZORPAY_KEY_ID=your_razorpay_live_key_id

# Razorpay Server Secrets (NEVER PREFIX WITH VITE_)
RAZORPAY_KEY_SECRET=your_razorpay_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_secure_webhook_secret

# AI Features
GEMINI_API_KEY=your_gemini_api_key

# App URL (Must match the production domain)
APP_URL=https://yourdomain.com
```

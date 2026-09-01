import fs from 'fs';
const file = 'src/lib/server/subscription-routes.ts';
let code = fs.readFileSync(file, 'utf-8');
code = code.replace(
  /details: error\?\.error\?\.description \|\| error\?\.message \|\| String\(error\)/,
  `details: error?.error?.description === "Authentication failed" ? "Razorpay Authentication failed. Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in Vercel are invalid or do not match. Please verify them in your Vercel Environment Variables." : (error?.error?.description || error?.message || String(error))`
);
fs.writeFileSync(file, code);

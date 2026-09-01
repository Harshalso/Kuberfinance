import fs from 'fs';
const file = 'src/lib/server/subscription-routes.ts';
let code = fs.readFileSync(file, 'utf-8');
code = code.replace(
  /Razorpay Authentication failed\. Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in Vercel are invalid or do not match\. Please verify them in your Vercel Environment Variables\./g,
  `Razorpay Authentication failed. Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET are invalid or do not match. Please verify them in your AI Studio Settings > Secrets.`
);
fs.writeFileSync(file, code);

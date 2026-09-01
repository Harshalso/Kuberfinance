import fs from 'fs';
const file = 'src/lib/server/subscription-routes.ts';
let code = fs.readFileSync(file, 'utf-8');
code = code.replace(
  /Razorpay Authentication failed\. Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET are invalid or do not match\. Please verify them in your AI Studio Settings > Secrets\./g,
  `Razorpay Authentication failed. Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET are invalid. If you just updated them, you must restart your server or click Redeploy in Vercel for them to take effect.`
);
fs.writeFileSync(file, code);

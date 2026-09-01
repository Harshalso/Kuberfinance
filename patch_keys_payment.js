import fs from 'fs';
let code = fs.readFileSync('src/lib/server/payment-routes.ts', 'utf-8');
code = code.replace(
  /keyId: process\.env\.VITE_RAZORPAY_KEY_ID \|\| process\.env\.NEXT_PUBLIC_RAZORPAY_KEY_ID/g,
  'keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID'
);
fs.writeFileSync('src/lib/server/payment-routes.ts', code);

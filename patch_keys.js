import fs from 'fs';

function replacePreferRazorpayKeyId(filePath) {
  let code = fs.readFileSync(filePath, 'utf-8');
  code = code.replace(
    /process\.env\.VITE_RAZORPAY_KEY_ID \|\| process\.env\.NEXT_PUBLIC_RAZORPAY_KEY_ID \|\| process\.env\.RAZORPAY_KEY_ID/g,
    'process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID'
  );
  code = code.replace(
    /process\.env\.VITE_RAZORPAY_KEY_SECRET \|\| process\.env\.RAZORPAY_KEY_SECRET/g,
    'process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET'
  );
  fs.writeFileSync(filePath, code);
}

replacePreferRazorpayKeyId('src/lib/services/razorpay.ts');
replacePreferRazorpayKeyId('src/lib/server/subscription-routes.ts');
replacePreferRazorpayKeyId('src/lib/server/payment-routes.ts');

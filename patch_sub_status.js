import fs from 'fs';
const file = 'src/lib/server/subscription-routes.ts';
let code = fs.readFileSync(file, 'utf-8');
code = code.replace(
  /status: subscription\.status, \/\/ "created"/g,
  `status: subscription.status === 'created' ? 'pending' : (subscription.status === 'authenticated' ? 'pending' : subscription.status), // Map Razorpay statuses to DB constraint`
);
fs.writeFileSync(file, code);

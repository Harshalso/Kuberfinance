import fs from 'fs';
const file = 'src/lib/services/razorpay.ts';
const code = `import Razorpay from 'razorpay';
import crypto from 'crypto';

export function getRazorpay(): Razorpay {
  const key_id = process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing from the environment variables.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

export function verifyRazorpaySignature(
  order_id: string,
  payment_id: string,
  signature: string
): boolean {
  const secret = process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(order_id + "|" + payment_id)
    .digest('hex');

  return generated_signature === signature;
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.VITE_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}
`;
fs.writeFileSync(file, code);

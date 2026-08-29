import Razorpay from 'razorpay';
import crypto from 'crypto';

// Server-side Razorpay instance
let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    // Vite uses process.env in Node.js server environment
    const key_id = process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.warn('Razorpay keys are missing. Payment features will not work.');
      // Initialize with dummy values so the server doesn't crash on start,
      // but will fail gracefully when attempting to create an order.
      razorpayInstance = new Razorpay({
        key_id: key_id || 'dummy_key',
        key_secret: key_secret || 'dummy_secret',
      });
    } else {
      razorpayInstance = new Razorpay({
        key_id,
        key_secret,
      });
    }
  }
  return razorpayInstance;
}

export function verifyRazorpaySignature(
  order_id: string,
  payment_id: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
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
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

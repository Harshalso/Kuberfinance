import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { verifyRazorpaySignature, verifyWebhookSignature } from './razorpay';

describe('Razorpay Signature Verification', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
  });

  it('should verify correct payment signature', () => {
    const order_id = 'order_123';
    const payment_id = 'pay_123';
    
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(order_id + "|" + payment_id)
      .digest('hex');

    expect(verifyRazorpaySignature(order_id, payment_id, signature)).toBe(true);
  });

  it('should reject invalid payment signature', () => {
    expect(verifyRazorpaySignature('order_123', 'pay_123', 'invalid_signature')).toBe(false);
  });

  it('should fail payment signature if secret is missing', () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    expect(verifyRazorpaySignature('order_123', 'pay_123', 'any')).toBe(false);
  });

  it('should verify correct webhook signature', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    
    const signature = crypto
      .createHmac('sha256', 'test_webhook_secret')
      .update(body)
      .digest('hex');

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it('should reject invalid webhook signature', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    expect(verifyWebhookSignature(body, 'invalid_signature')).toBe(false);
  });

  it('should fail webhook signature if secret is missing', () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect(verifyWebhookSignature('body', 'any')).toBe(false);
  });
});

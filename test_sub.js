import { getRazorpay } from './src/lib/services/razorpay.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const rzp = getRazorpay();
  console.log("Rzp keys:", rzp.key_id, rzp.key_secret);
  try {
    const res = await rzp.subscriptions.create({
      plan_id: 'plan_TVZ7tVBDFfNMsl',
      customer_notify: 1,
      total_count: 120
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error creating subscription:", err);
  }
}
test();

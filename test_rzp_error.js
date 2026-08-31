import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const rzp = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function test() {
  try {
    const subscription = await rzp.subscriptions.create({
      plan_id: 'plan_TVZN2zGY2wgUBt',
      customer_notify: 1,
      total_count: 120,
      notes: {
        userId: '1234',
        planSlug: 'pro_monthly'
      }
    });
    console.log("Sub:", subscription);
  } catch (error) {
    console.log("ERROR:", JSON.stringify(error, null, 2));
  }
}
test();

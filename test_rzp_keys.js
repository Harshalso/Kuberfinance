import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const key_id = process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

console.log("key_id length:", key_id?.length);
console.log("key_secret length:", key_secret?.length);

const rzp = new Razorpay({ key_id, key_secret });
rzp.plans.all().then(() => console.log("SUCCESS")).catch(e => console.log("ERROR:", e.error?.description || e));

import dotenv from 'dotenv';
dotenv.config();

const key_id = process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

console.log("key_id:", `'${key_id}'`);
console.log("key_secret:", `'${key_secret}'`);

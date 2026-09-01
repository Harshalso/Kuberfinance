import dotenv from 'dotenv';
dotenv.config();
console.log("Current Key ID:", process.env.RAZORPAY_KEY_ID);
console.log("Current Key Secret:", process.env.RAZORPAY_KEY_SECRET);

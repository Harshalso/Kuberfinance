import Razorpay from 'razorpay';
const rzp = new Razorpay({ key_id: 'dummy_key', key_secret: 'dummy_secret' });
rzp.orders.create({ amount: 100, currency: 'INR', receipt: '123' })
  .then(res => console.log("RESOLVED:", res))
  .catch(err => console.error("REJECTED:", err));

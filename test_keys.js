import Razorpay from 'razorpay';
const rzp = new Razorpay({
  key_id: 'rzp_test_invalid1234',
  key_secret: 'invalidsecret'
});
rzp.plans.all().then(console.log).catch(err => console.log("ERROR:", err.error.description));

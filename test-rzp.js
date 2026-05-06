const Razorpay = require('razorpay');

const rzp = new Razorpay({
  key_id: 'rzp_test_SfoBPeivut59Ui',
  key_secret: 'g1FMB8M410IjaNqIMwu6wnyF'
});

rzp.orders.create({
  amount: 2000000,
  currency: 'INR',
  receipt: 'rcpt_1234567890'
}).then(order => {
  console.log('Order created:', order);
}).catch(err => {
  console.error('Razorpay Error:', err);
});

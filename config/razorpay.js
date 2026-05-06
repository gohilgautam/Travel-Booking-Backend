const Razorpay = require('razorpay');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

logger.info('Razorpay instance created (test keys)');
module.exports = razorpay;
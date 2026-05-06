const { body } = require('express-validator');

exports.createOrder = [
  body('bookingId').isMongoId().withMessage('Invalid booking ID'),
];

exports.verifyPayment = [
  body('razorpayOrderId').notEmpty().withMessage('Order ID required'),
  body('razorpayPaymentId').notEmpty().withMessage('Payment ID required'),
  body('razorpaySignature').notEmpty().withMessage('Signature required'),
];

exports.refundPayment = [
  body('reason').optional().isString().withMessage('Refund reason must be a string'),
];
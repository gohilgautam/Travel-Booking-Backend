const express = require('express');
const {
  createOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  refundPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const paymentValidation = require('../validations/paymentValidation');

const router = express.Router();

router.post('/create-order', protect, ...paymentValidation.createOrder, createOrder);
router.post('/verify', protect, ...paymentValidation.verifyPayment, verifyPayment);
router.get('/mine', protect, getMyPayments);
router.get('/', protect, isAdmin, getAllPayments);
router.get('/:id', protect, getPaymentById);
router.post('/:id/refund', protect, isAdmin, ...paymentValidation.refundPayment, refundPayment);

module.exports = router;

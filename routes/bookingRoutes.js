const express = require('express');
const { createBooking, getMyBookings, getBookingById, cancelBooking, downloadInvoice } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { bookingValidation } = require('../validations/bookingValidation');

const router = express.Router();

router.post('/', protect, ...bookingValidation, createBooking);
router.get('/mine', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/:id/invoice', protect, downloadInvoice);

module.exports = router;
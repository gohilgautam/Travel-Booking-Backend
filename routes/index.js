const express = require('express');
const router = express.Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/admin', require('../modules/admin/admin.routes'));
router.use('/packages', require('../modules/package/package.routes'));
// Nested reviews under packages
router.use('/packages/:packageId/reviews', require('../modules/review/review.routes'));
router.use('/bookings', require('../modules/booking/booking.routes'));
router.use('/payments', require('../modules/payment/payment.routes'));
router.use('/wishlist', require('../modules/wishlist/wishlist.routes'));
router.use('/coupons', require('../modules/coupon/coupon.routes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/media', require('../modules/media/media.routes'));

module.exports = router;
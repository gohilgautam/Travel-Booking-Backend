const express = require('express');
const couponController = require('./coupon.controller');
const { protect } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, isAdmin, couponController.getCoupons);
router.post('/', protect, isAdmin, couponController.createCoupon);
router.put('/:id', protect, isAdmin, couponController.updateCoupon);
router.delete('/:id', protect, isAdmin, couponController.deleteCoupon);

module.exports = router;

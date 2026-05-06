const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin } = require('../middleware/roleMiddleware');

// All admin routes require auth + admin role
router.use(protect, isAdmin);

// Dashboard
router.get('/dashboard', admin.getDashboardStats);

// User management
router.get('/users', admin.getAllUsers);
router.get('/users/:id', admin.getUserById);
router.put('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.patch('/users/:id/block', admin.blockUser);
router.patch('/users/:id/unblock', admin.unblockUser);

// Booking management
router.get('/bookings', admin.getAllBookings);
router.patch('/bookings/:id/status', admin.updateBookingStatus);
router.patch('/bookings/:id/assign', admin.assignBookingToAdmin);

// Review management
router.get('/reviews', admin.getAllReviews);
router.patch('/reviews/:id/approve', admin.approveReview);
router.patch('/reviews/:id/reject', admin.rejectReview);
router.delete('/reviews/:id', admin.deleteReview);

// Coupon management
router.get('/coupons', admin.getAllCoupons);
router.post('/coupons', admin.createCoupon);
router.put('/coupons/:id', admin.updateCoupon);
router.delete('/coupons/:id', admin.deleteCoupon);

// Notification / Email
router.get('/notifications', admin.getNotifications);
router.post('/notifications/send', admin.sendNotification);

// Admin management (super admin only)
router.get('/admins', isSuperAdmin, admin.getAllAdmins);
router.post('/admins', isSuperAdmin, admin.createAdmin);
router.put('/admins/:id', isSuperAdmin, admin.updateAdmin);
router.patch('/admins/:id/activate', isSuperAdmin, admin.activateAdmin);
router.patch('/admins/:id/deactivate', isSuperAdmin, admin.deactivateAdmin);
router.delete('/admins/:id', isSuperAdmin, admin.removeAdmin);

module.exports = router;
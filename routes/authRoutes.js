const express = require('express');
const router = express.Router();
const {
  register, login, adminLogin, logout, getMe, updateProfile,
  changePassword, forgotPassword, verifyOtp, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../validations/authValidation');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', ...registerValidation, register);
router.post('/login', ...loginValidation, login);
router.post('/admin/login', ...loginValidation, adminLogin);
router.post('/forgot-password', ...forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', ...verifyOtpValidation, verifyOtp);
router.post('/reset-password', ...resetPasswordValidation, resetPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, ...changePasswordValidation, changePassword);

module.exports = router;
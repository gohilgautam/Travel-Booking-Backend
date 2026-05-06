const User = require('../models/User');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');
const ApiError = require('../utils/helpers').ApiError;
const crypto = require('crypto');
const logger = require('../utils/logger');

const forwardOrRespond = (next, res, error) => {
    if (typeof next === 'function') return next(error);
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error?.message || 'Internal Server Error' });
};

exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return forwardOrRespond(next, res, new ApiError('Validation failed', 400, errors.array()));
        const { name, email, password, phone } = req.body;
        const user = await authService.registerUser(name, email, password, phone);
        const token = authService.generateToken(user._id);
        res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone, address: user.address, createdAt: user.createdAt } });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return forwardOrRespond(next, res, new ApiError('Validation failed', 400, errors.array()));
        const { email: identifier, password } = req.body;
        const { user, token } = await authService.loginUser(identifier, password);
        if (user.isBlocked) return forwardOrRespond(next, res, new ApiError('Your account has been blocked. Contact support.', 403));
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone, address: user.address, createdAt: user.createdAt } });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.adminLogin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return forwardOrRespond(next, res, new ApiError('Validation failed', 400, errors.array()));
        const { email, password } = req.body;
        const { user, token } = await authService.loginAdmin(email, password);
        if (user.isBlocked) return forwardOrRespond(next, res, new ApiError('Your admin account has been blocked.', 403));
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone }
        });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.logout = async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully. Remove JWT on client side.' });
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpire');
        res.json({ success: true, user });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const updates = { name: req.body.name, phone: req.body.phone, address: req.body.address };
        if (req.file) updates.avatar = req.file.path;
        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
        res.json({ success: true, user });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.changePassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return forwardOrRespond(next, res, new ApiError('Validation failed', 400, errors.array()));

        const { currentPassword, newPassword } = req.body;
        if (currentPassword === newPassword) {
            return forwardOrRespond(next, res, new ApiError('New password must be different from current password', 400));
        }
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return forwardOrRespond(next, res, new ApiError('User not found', 404));
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return forwardOrRespond(next, res, new ApiError('Current password is incorrect', 400));
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return forwardOrRespond(next, res, new ApiError('Validation failed', 400, errors.array()));

        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return forwardOrRespond(next, res, new ApiError('No user found with this email', 404));

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // Reset count if it's a new day
        if (user.otpSendDate) {
            const lastSendDay = new Date(user.otpSendDate.getFullYear(), user.otpSendDate.getMonth(), user.otpSendDate.getDate()).getTime();
            if (lastSendDay !== today) {
                user.otpSendCount = 0;
            }
        }

        if (user.otpSendCount >= 15) {
            return forwardOrRespond(next, res, new ApiError('You have exceeded the maximum limit of 15 OTP requests per day. Please try again tomorrow.', 429));
        }

        if (user.otpLockoutUntil && user.otpLockoutUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.otpLockoutUntil - Date.now()) / 60000);
            return forwardOrRespond(next, res, new ApiError(`Too many failed attempts. Try again in ${minutesLeft} minutes.`, 429));
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        user.otpSendCount = (user.otpSendCount || 0) + 1;
        user.otpSendDate = now;
        await user.save({ validateBeforeSave: false });
        
        logger.info(`Sending forgot password OTP to ${email}`);
        const sent = await emailService.sendOtp(email, otp);
        
        if (!sent) {
            logger.error(`Failed to send OTP to ${email}`);
            const mailError = emailService.getLastEmailError?.();
            const message = mailError?.code === 'EAUTH'
                ? 'OTP could not be sent because SMTP authentication failed. Check SMTP_USER and SMTP_PASS app password.'
                : 'OTP could not be sent. Please check email settings.';
            return forwardOrRespond(next, res, new ApiError(message, 500));
        }
        res.json({ success: true, message: `OTP sent to ${email}` });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return forwardOrRespond(next, res, new ApiError('Validation failed', 400, errors.array()));

        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return forwardOrRespond(next, res, new ApiError('No user found', 404));

        if (user.otpLockoutUntil && user.otpLockoutUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.otpLockoutUntil - Date.now()) / 60000);
            return forwardOrRespond(next, res, new ApiError(`Too many failed attempts. Try again in ${minutesLeft} minutes.`, 429));
        }

        if (user.otp !== otp || !user.otpExpire || user.otpExpire < Date.now()) {
            user.otpFailedCount = (user.otpFailedCount || 0) + 1;
            
            if (user.otpFailedCount >= 3) {
                user.otpLockoutUntil = Date.now() + 30 * 60 * 1000; // 30 minutes lockout
                user.otpFailedCount = 0; // Reset count for after lockout expires
                await user.save({ validateBeforeSave: false });
                return forwardOrRespond(next, res, new ApiError(`Too many failed attempts. Try again in 30 minutes.`, 429));
            }
            
            await user.save({ validateBeforeSave: false });
            return forwardOrRespond(next, res, new ApiError(`Invalid or expired OTP. You have ${3 - user.otpFailedCount} attempts left.`, 400));
        }

        // Generate a temporary reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpFailedCount = 0;
        user.otpLockoutUntil = undefined;
        await user.save({ validateBeforeSave: false });
        res.json({ success: true, resetToken, message: 'OTP verified' });
    } catch (error) { forwardOrRespond(next, res, error); }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return forwardOrRespond(next, res, new ApiError('Validation failed', 400, errors.array()));

        const { resetToken, newPassword } = req.body;
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
        if (!user) return forwardOrRespond(next, res, new ApiError('Reset token is invalid or expired', 400));
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.json({ success: true, message: 'Password reset successful. Please login.' });
    } catch (error) { forwardOrRespond(next, res, error); }
};

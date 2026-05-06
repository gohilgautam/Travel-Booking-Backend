const User = require('../models/User');
const Package = require('../models/Package');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const ApiError = require('../utils/helpers').ApiError;
const authService = require('../services/authService');
const Payment = require('../models/Payment');
const invoiceService = require('../services/invoiceService');

// ─── Dashboard Stats ────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalBookings, totalPackages, totalRevenue, recentBookings, topPackages] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Package.countDocuments({ active: true }),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.find().sort('-createdAt').limit(5)
        .populate('user', 'name email')
        .populate('package', 'title'),
      Booking.aggregate([
        { $group: { _id: '$package', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'packages', localField: '_id', foreignField: '_id', as: 'pkg' } },
        { $unwind: '$pkg' },
        { $project: { title: '$pkg.title', emoji: '$pkg.emoji', count: 1, revenue: 1 } },
      ]),
    ]);

    // Monthly revenue for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalPackages,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentBookings,
        topPackages,
        monthlyRevenue,
      },
    });
  } catch (error) { next(error); }
};

// ─── User Management ─────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, blocked, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;
    if (blocked !== undefined) query.isBlocked = blocked === 'true';
    const users = await User.find(query).select('-password -otp').skip((page - 1) * limit).limit(Number(limit)).sort('-createdAt');
    const total = await User.countDocuments(query);
    res.json({ success: true, count: users.length, total, data: users });
  } catch (error) { next(error); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp');
    if (!user) throw new ApiError('User not found', 404);
    const bookings = await Booking.find({ user: user._id }).populate('package', 'title price').sort('-createdAt').limit(10);
    res.json({ success: true, data: { user, bookings } });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    if (!user) throw new ApiError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new ApiError('User not found', 404);
    await Booking.deleteMany({ user: req.params.id });
    res.json({ success: true, message: 'User and their bookings deleted' });
  } catch (error) { next(error); }
};

exports.blockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select('-password');
    if (!user) throw new ApiError('User not found', 404);
    res.json({ success: true, message: 'User blocked', data: user });
  } catch (error) { next(error); }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select('-password');
    if (!user) throw new ApiError('User not found', 404);
    res.json({ success: true, message: 'User unblocked', data: user });
  } catch (error) { next(error); }
};

// ─── Admin Management (Super Admin) ──────────────────────────────
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('-password');
    res.json({ success: true, data: admins });
  } catch (error) { next(error); }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      // Promote existing user to admin
      existing.role = 'admin';
      await existing.save();
      return res.json({ success: true, message: 'User promoted to admin', data: existing });
    }
    const user = await User.create({ name, email, password, role: 'admin', isBlocked: false });
    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError('Admin not found', 404);
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw new ApiError('Target user is not an admin', 400);
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    await user.save();

    res.json({ success: true, message: 'Admin details updated', data: user });
  } catch (error) { next(error); }
};

exports.activateAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError('Admin not found', 404);
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw new ApiError('Target user is not an admin', 400);
    }
    user.isBlocked = false;
    await user.save();
    res.json({ success: true, message: 'Admin activated', data: user });
  } catch (error) { next(error); }
};

exports.deactivateAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError('Admin not found', 404);
    if (user.role === 'superadmin') throw new ApiError('Cannot deactivate super admin', 403);
    if (user.role !== 'admin') throw new ApiError('Target user is not an admin', 400);
    user.isBlocked = true;
    await user.save();
    res.json({ success: true, message: 'Admin deactivated', data: user });
  } catch (error) { next(error); }
};

exports.removeAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError('User not found', 404);
    if (user.role === 'superadmin') throw new ApiError('Cannot remove super admin', 403);
    user.role = 'user';
    await user.save();
    res.json({ success: true, message: 'Admin role removed' });
  } catch (error) { next(error); }
};

// ─── Booking Management ──────────────────────────────────────────
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.travelDate = {};
      if (startDate) query.travelDate.$gte = new Date(startDate);
      if (endDate) query.travelDate.$lte = new Date(endDate);
    }
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('package', 'title destination price emoji')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Booking.countDocuments(query);
    res.json({ success: true, count: bookings.length, total, data: bookings });
  } catch (error) { next(error); }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user', 'name email')
      .populate('package', 'title destination location duration price');
    if (!booking) throw new ApiError('Booking not found', 404);
    // Send email on confirmation
    if (status === 'confirmed') {
      const payment = await Payment.findOne({ booking: booking._id });
      let invoiceBuffer = null;
      if (payment) {
        try {
          invoiceBuffer = await invoiceService.generateInvoice(booking, payment);
        } catch (invErr) {
          console.error('Invoice generation failed:', invErr);
        }
      }

      let formattedDate = 'N/A';
      try {
        if (booking.travelDate) {
          formattedDate = new Date(booking.travelDate).toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Date formatting failed:', e);
      }

      await emailService.sendBookingConfirmation(booking.user.email, {
        userName: booking.user.name,
        packageTitle: booking.package.title,
        travelDate: formattedDate,
        numberOfTravelers: booking.numberOfTravelers,
        totalAmount: booking.totalAmount,
        bookingId: booking._id,
      }, invoiceBuffer);
    }
    res.json({ success: true, data: booking });
  } catch (error) { next(error); }
};

exports.assignBookingToAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.body;
    const adminUser = await User.findById(adminId);
    if (!adminUser || !['admin', 'superadmin'].includes(adminUser.role)) {
      throw new ApiError('Valid admin is required for assignment', 400);
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { assignedAdmin: adminId },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('package', 'title')
      .populate('assignedAdmin', 'name email role');

    if (!booking) throw new ApiError('Booking not found', 404);

    res.json({ success: true, message: 'Booking assigned successfully', data: booking });
  } catch (error) { next(error); }
};

// ─── Review Management ───────────────────────────────────────────
exports.getAllReviews = async (req, res, next) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;
    const query = {};
    if (approved !== undefined) query.approved = approved === 'true';
    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .populate('package', 'title')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Review.countDocuments(query);
    res.json({ success: true, count: reviews.length, total, data: reviews });
  } catch (error) { next(error); }
};

exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!review) throw new ApiError('Review not found', 404);
    res.json({ success: true, data: review });
  } catch (error) { next(error); }
};

exports.rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { approved: false }, { new: true });
    if (!review) throw new ApiError('Review not found', 404);
    res.json({ success: true, data: review });
  } catch (error) { next(error); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) throw new ApiError('Review not found', 404);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) { next(error); }
};

// ─── Coupon Management ───────────────────────────────────────────
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) { next(error); }
};

exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, data: coupons });
  } catch (error) { next(error); }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) throw new ApiError('Coupon not found', 404);
    res.json({ success: true, data: coupon });
  } catch (error) { next(error); }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) { next(error); }
};

// ─── Notification / Email ────────────────────────────────────────
exports.sendNotification = async (req, res, next) => {
  try {
    const { subject, body, type, recipients } = req.body; // recipients: 'all' | 'users' | [email,...]
    let emails = [];
    if (recipients === 'all') {
      const users = await User.find().select('email');
      emails = users.map(u => u.email);
    } else if (recipients === 'users') {
      const users = await User.find({ role: 'user' }).select('email');
      emails = users.map(u => u.email);
    } else if (Array.isArray(recipients)) {
      emails = recipients;
    }
    const results = await Promise.all(emails.map(email => emailService.sendCustomEmail(email, subject, body)));
    const sent = results.filter(Boolean).length;
    const notification = await Notification.create({
      type: type || 'custom', subject, body,
      sentTo: emails, sentBy: req.user._id,
      status: sent === emails.length ? 'sent' : 'failed',
    });
    res.json({ success: true, message: `Email sent to ${sent}/${emails.length} recipients`, data: notification });
  } catch (error) { next(error); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find().populate('sentBy', 'name').sort('-createdAt').limit(50);
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

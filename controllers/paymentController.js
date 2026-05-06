const mongoose = require('mongoose');
const razorpay = require('../config/razorpay');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const ApiError = require('../utils/helpers').ApiError;
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const invoiceService = require('../services/invoiceService');

// Create Razorpay order
exports.createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ApiError('Validation failed', 400, errors.array()));

    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('package');
    if (!booking) throw new ApiError('Booking not found', 404);
    if (booking.user.toString() !== req.user.id) throw new ApiError('Not authorized', 403);

    const amount = Math.round(booking.totalAmount * 100); // Razorpay expects amount in paise
    const receipt = `rcpt_${booking._id.toString().slice(-10)}`;

    let order;
    try {
      order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt,
        notes: { bookingId: booking._id.toString(), userId: req.user.id },
      });
    } catch (rzpError) {
      console.error('Razorpay Order Creation Error:', rzpError);
      throw new ApiError(
        rzpError.error?.description || 'Failed to create payment order with Razorpay',
        rzpError.statusCode || 500
      );
    }

    // Save payment record with 'created' status
    const payment = await Payment.create({
      booking: booking._id,
      user: req.user.id,
      razorpayOrderId: order.id,
      amount: booking.totalAmount,
      receipt,
    });

    booking.payment = payment._id;
    await booking.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
    });
  } catch (error) {
    next(error);
  }
};

// Verify payment signature and update status
exports.verifyPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400, errors.array());
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // 🔐 Verify Signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed' },
        { session }
      );

      throw new ApiError('Payment verification failed', 400);
    }

    // 🚫 Prevent double processing
    const existingPayment = await Payment.findOne({ razorpayOrderId }).session(session);
    if (!existingPayment) {
      throw new ApiError('Payment not found', 404);
    }
    if (existingPayment.status === 'paid' && existingPayment.razorpayPaymentId) {
      await session.commitTransaction(); // Already done, just return success
      session.endSession();
      return res.json({ success: true, message: 'Payment already processed' });
    }

    // 💳 Update Payment
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
      },
      { new: true, session }
    );

    // 📦 Update Booking
    const booking = await Booking.findByIdAndUpdate(
      payment.booking,
      { status: 'confirmed' },
      { new: true, session }
    )
      .populate('package', 'title destination location duration price')
      .populate('user', 'name email');

    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    // 🧾 Commit DB changes first
    await session.commitTransaction();
    session.endSession();

    // 📧 Send Emails (non-blocking)
    try {
      const invoiceBuffer = await invoiceService.generateInvoice(booking, payment);

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

      await Notification.create({
        type: 'booking_confirmation',
        subject: 'Booking Confirmed — Travelora',
        body: `Booking ${booking._id} confirmed for ${booking.user.email}`,
        sentTo: [booking.user.email],
        sentBy: booking.user._id,
        status: 'sent',
      });

    } catch (emailErr) {
      logger.error(`Email/Invoice failed for booking ${booking._id}: ${emailErr.message}`);
    }

    res.json({
      success: true,
      message: 'Payment successful',
      payment,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('booking', 'travelDate status totalAmount')
      .sort('-createdAt');
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('user', 'name email role')
      .populate('booking', 'travelDate status totalAmount')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Payment.countDocuments(query);

    res.json({ success: true, count: payments.length, total, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('booking', 'travelDate status totalAmount');
    if (!payment) throw new ApiError('Payment not found', 404);

    const isOwner = payment.user && payment.user._id.toString() === req.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) throw new ApiError('Not authorized', 403);

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ApiError('Validation failed', 400, errors.array()));

    const payment = await Payment.findById(req.params.id).populate('booking');
    if (!payment) throw new ApiError('Payment not found', 404);
    if (payment.status !== 'paid') {
      throw new ApiError('Only paid transactions can be refunded', 400);
    }

    const refundAmount = req.body.amount ? Number(req.body.amount) : payment.amount;
    let refund;
    if (payment.razorpayPaymentId) {
      refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason: req.body.reason || 'Admin initiated refund' },
      });
    }

    payment.status = 'refunded';
    payment.refundAmount = refundAmount;
    payment.refundReason = req.body.reason || 'Admin initiated refund';
    payment.refundId = refund?.id || `manual_refund_${payment._id.toString().slice(-8)}`;
    payment.refundedAt = new Date();
    await payment.save();

    await Booking.findByIdAndUpdate(payment.booking._id, { status: 'refunded' });

    res.json({ success: true, message: 'Payment refunded', data: payment });
  } catch (error) {
    next(error);
  }
};

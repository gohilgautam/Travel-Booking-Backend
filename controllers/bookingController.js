const Booking = require('../models/Booking');
const Package = require('../models/Package');
const ApiError = require('../utils/helpers').ApiError;
const bookingService = require('../services/bookingService');
const invoiceService = require('../services/invoiceService');
const Payment = require('../models/Payment');

const { validationResult } = require('express-validator');

exports.createBooking = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return next(new ApiError('Validation failed', 400, errors.array()));

        const { packageId, travelDate, numberOfTravelers, couponCode, specialRequests } = req.body;
        const booking = await bookingService.createBooking(req.user.id, packageId, travelDate, numberOfTravelers, couponCode, specialRequests);
        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('package', 'title images price')
            .populate('user', 'name email')
            .populate('payment')
            .sort('-createdAt');
        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        next(error);
    }
};

exports.getBookingById = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('package')
            .populate('payment');
        if (!booking) throw new ApiError('Booking not found', 404);
        // Ensure owner or admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new ApiError('Not authorized', 403);
        }
        res.json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) throw new ApiError('Booking not found', 404);
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new ApiError('Not authorized', 403);
        }
        booking.status = 'cancelled';
        await booking.save();
        res.json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

exports.downloadInvoice = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('package')
            .populate('user', 'name email phone');
        
        if (!booking) throw new ApiError('Booking not found', 404);

        // Ensure owner or admin
        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new ApiError('Not authorized', 403);
        }

        const payment = await Payment.findOne({ booking: booking._id });
        if (!payment) throw new ApiError('Payment details not found', 404);

        const pdfBuffer = await invoiceService.generateInvoice(booking, payment);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Invoice_${booking._id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
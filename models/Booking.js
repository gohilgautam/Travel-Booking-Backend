const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
        bookingDate: { type: Date, default: Date.now },
        travelDate: { type: Date, required: true },
        numberOfTravelers: { type: Number, required: true, min: 1 },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
            default: 'pending',
        },
        payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
        coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
        specialRequests: { type: String },
        assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cancellationReason: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
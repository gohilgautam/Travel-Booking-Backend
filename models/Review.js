const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
        rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
        comment: { type: String, required: [true, 'Comment is required'] },
        approved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Prevent duplicate reviews from same user for same package
reviewSchema.index({ user: 1, package: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
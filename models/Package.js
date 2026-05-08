const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
    {
        title: { type: String, required: [true, 'Package title is required'] },
        description: { type: String, required: [true, 'Description is required'] },
        destination: { type: String, required: true },
        subDestinations: [String],
        location: { type: String },
        category: { type: String, default: 'other' },
        duration: { type: Number, required: true }, // in days
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        emoji: { type: String, default: '🌍' },
        gradient: { type: String, default: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
        highlights: [String],
        includes: [String],
        amenities: [String],
        itinerary: [String],
        maxGroupSize: { type: Number, default: 10 },
        seats: { type: Number, default: 50, min: 0 },
        startDate: { type: Date },
        endDate: { type: Date },
        featured: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
        travelMode: {
            type: String,
            enum: ['Flight', 'Train', 'Bus', 'Cruise', 'Car', 'Mixed'],
            default: 'Mixed'
        },
        contact: { type: String },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
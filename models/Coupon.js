const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minBookingAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    applicablePackages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Package' }],
    applicableCategories: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
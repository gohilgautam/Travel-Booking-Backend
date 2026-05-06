const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/helpers').ApiError;

exports.createBooking = async (userId, packageId, travelDate, numberOfTravelers, couponCode, specialRequests) => {
  const pkg = await Package.findById(packageId);
  if (!pkg) throw new ApiError('Package not found', 404);
  if (!pkg.active) throw new ApiError('This package is not currently available', 400);
  if (pkg.seats < numberOfTravelers) throw new ApiError('Not enough seats available', 400);

  let totalAmount = pkg.discountPrice || pkg.price;
  totalAmount *= numberOfTravelers;

  // Apply coupon if provided
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon || coupon.expiryDate < new Date() || coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError('Invalid or expired coupon', 400);
    }
    if (totalAmount < coupon.minBookingAmount) {
      throw new ApiError(`Minimum booking amount ${coupon.minBookingAmount} required for this coupon`, 400);
    }
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (totalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }
    totalAmount = Math.max(0, totalAmount - discount);
    // Increment coupon usage
    coupon.usedCount += 1;
    await coupon.save();
  }

  const booking = await Booking.create({
    user: userId,
    package: packageId,
    travelDate,
    numberOfTravelers,
    totalAmount,
    specialRequests,
    coupon: coupon ? coupon._id : undefined,
  });

  pkg.seats -= numberOfTravelers;
  await pkg.save();

  return booking.populate('package', 'title images destination location duration price');
};
const Wishlist = require('../models/Wishlist');
const ApiError = require('../utils/helpers').ApiError;

exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user.id }).populate('package');
    res.json({ success: true, count: wishlist.length, data: wishlist });
  } catch (error) {
    next(error);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const { packageId } = req.body;
    const entry = await Wishlist.create({ user: req.user.id, package: packageId });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError('Already in wishlist', 400));
    }
    next(error);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const entry = await Wishlist.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!entry) throw new ApiError('Wishlist item not found', 404);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};
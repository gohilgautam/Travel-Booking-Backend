const Review = require('../models/Review');
const ApiError = require('../utils/helpers').ApiError;

exports.getPackageReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ package: req.params.packageId })
      .populate('user', 'name avatar')
      .sort('-createdAt');
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({
      user: req.user.id,
      package: req.params.packageId,
      rating,
      comment,
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError('You have already reviewed this package', 400));
    }
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);
    if (!review) throw new ApiError('Review not found', 404);
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError('Not authorized', 403);
    }
    review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError('Review not found', 404);
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError('Not authorized', 403);
    }
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
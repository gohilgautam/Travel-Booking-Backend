const ApiError = require('../utils/helpers').ApiError;

/**
 * Middleware to restrict access to admin users only.
 * Assumes `protect` middleware has already run and attached `req.user`.
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(new ApiError('Admin access required. You are not authorized.', 403));
  }
};

module.exports = adminMiddleware;
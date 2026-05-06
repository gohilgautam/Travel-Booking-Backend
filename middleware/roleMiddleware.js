const ApiError = require('../utils/helpers').ApiError;

/**
 * Middleware to restrict access to admin users only.
 * Assumes `protect` middleware has already run and attached `req.user`.
 */
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    return next(new ApiError('Admin access required. You are not authorized.', 403));
  }
};

/**
 * Middleware to restrict access to super admin users only.
 * Assumes `protect` middleware has already run and attached `req.user`.
 */
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    return next(new ApiError('Super admin access required. You are not authorized.', 403));
  }
};

module.exports = { isAdmin, isSuperAdmin };

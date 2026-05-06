const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/helpers').ApiError;

exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) return next(new ApiError('Not authorized, no token', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return next(new ApiError('User not found', 401));
    }
    next();
  } catch (error) {
    return next(new ApiError('Not authorized, token failed', 401));
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(new ApiError('Admin access required', 403));
  }
};
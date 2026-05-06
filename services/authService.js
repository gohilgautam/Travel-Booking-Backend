const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/helpers').ApiError;
const { isMainAdminEmail } = require('../shared/constants/mainAdmins');

exports.registerUser = async (name, email, password, phone) => {
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    throw new ApiError('User already exists with this email or phone', 400);
  }
  const role = isMainAdminEmail(email) ? 'superadmin' : 'user';
  const user = await User.create({ name, email, password, role, phone });
  return user;
};

exports.loginUser = async (identifier, password) => {
  const user = await User.findOne({ 
    $or: [
      { email: identifier },
      { phone: identifier }
    ] 
  }).select('+password');
  if (!user) {
    throw new ApiError('Invalid email or password', 401);
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid email or password', 401);
  }
  const token = generateToken(user._id);
  return { user, token };
};

exports.loginAdmin = async (email, password) => {
  const { user, token } = await exports.loginUser(email, password);
  if (!['admin', 'superadmin'].includes(user.role)) {
    throw new ApiError('Admin credentials required', 403);
  }
  return { user, token };
};

exports.generateToken = generateToken;

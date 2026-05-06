const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for the given user ID.
 * @param {string} userId - The MongoDB user ID.
 * @returns {string} - The signed JWT.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;

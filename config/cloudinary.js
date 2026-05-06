const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_SECRET,
});

logger.info('Cloudinary configured');
module.exports = cloudinary;

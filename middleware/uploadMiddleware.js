const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/helpers').ApiError;

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ApiError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
});

const uploadToCloudinary = (file, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);

      resolve({
        ...file,
        path: result.secure_url,
        filename: result.public_id,
      });
    });

    stream.end(file.buffer);
  });

const withCloudinaryUpload = (multerMiddleware, options) => (req, res, next) => {
  multerMiddleware(req, res, async (error) => {
    if (error) return next(error);

    try {
      if (req.file) {
        req.file = await uploadToCloudinary(req.file, options);
      }

      if (req.files && req.files.length > 0) {
        req.files = await Promise.all(req.files.map((file) => uploadToCloudinary(file, options)));
      }

      next();
    } catch (uploadError) {
      next(uploadError);
    }
  });
};

const avatarUpload = {
  single: (fieldName) =>
    withCloudinaryUpload(upload.single(fieldName), {
      folder: 'travel_planner/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png'],
      transformation: [{ width: 200, height: 200, crop: 'fill' }],
    }),
};

const uploadSingleAvatar = avatarUpload.single('avatar');
const uploadPackageImages = withCloudinaryUpload(upload.array('images', 5), {
  folder: 'travel_planner/packages',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 800, height: 600, crop: 'limit' }],
});

module.exports = avatarUpload;
module.exports.uploadSingleAvatar = uploadSingleAvatar;
module.exports.uploadPackageImages = uploadPackageImages;

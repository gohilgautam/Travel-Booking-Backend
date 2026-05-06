const cloudinary = require('../../config/cloudinary');
const { ApiError } = require('../../utils/helpers');
const Media = require('./media.model');

exports.getGallery = async (req, res, next) => {
  try {
    const items = await Media.find().sort('-createdAt');
    res.json({ success: true, count: items.length, data: items });
  } catch (error) { next(error); }
};

exports.uploadGalleryImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError('At least one image is required', 400);
    }

    const docs = await Media.insertMany(
      req.files.map((file) => ({
        title: req.body.title || '',
        url: file.path,
        public_id: file.filename,
        folder: 'travel_planner/gallery',
        uploadedBy: req.user._id,
      }))
    );

    res.status(201).json({ success: true, count: docs.length, data: docs });
  } catch (error) { next(error); }
};

exports.deleteGalleryImage = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) throw new ApiError('Media not found', 404);

    await cloudinary.uploader.destroy(media.public_id);
    await media.deleteOne();

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) { next(error); }
};

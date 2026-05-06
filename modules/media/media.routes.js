const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { uploadPackageImages } = require('../../middleware/uploadMiddleware');
const mediaController = require('./media.controller');

const router = express.Router();

router.get('/', protect, isAdmin, mediaController.getGallery);
router.post('/upload', protect, isAdmin, uploadPackageImages, mediaController.uploadGalleryImages);
router.delete('/:id', protect, isAdmin, mediaController.deleteGalleryImage);

module.exports = router;

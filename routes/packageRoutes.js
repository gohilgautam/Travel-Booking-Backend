const express = require('express');
const {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  enablePackage,
  disablePackage,
  toggleStatus,
  toggleFeatured,
} = require('../controllers/packageController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { packageValidation } = require('../validations/packageValidation');
const { uploadPackageImages } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getPackages);
router.get('/category/:category', getPackages);
router.get('/:id', getPackage);

// Admin routes
router.post('/', protect, isAdmin, uploadPackageImages, ...packageValidation, createPackage);
router.put('/:id', protect, isAdmin, uploadPackageImages, updatePackage);
router.delete('/:id', protect, isAdmin, deletePackage);
router.patch('/:id/enable', protect, isAdmin, enablePackage);
router.patch('/:id/disable', protect, isAdmin, disablePackage);
router.patch('/:id/featured', protect, isAdmin, toggleFeatured);
router.patch('/:id/toggle-status', protect, isAdmin, toggleStatus);

module.exports = router;

const { body } = require('express-validator');

exports.bookingValidation = [
  body('packageId').isMongoId().withMessage('Invalid package ID'),
  body('travelDate').isISO8601().toDate().withMessage('Valid travel date is required'),
  body('numberOfTravelers').isInt({ min: 1 }).withMessage('At least 1 traveler required'),
];
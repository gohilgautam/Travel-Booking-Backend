const { body } = require('express-validator');

exports.packageValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('destination').notEmpty().withMessage('Destination is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];
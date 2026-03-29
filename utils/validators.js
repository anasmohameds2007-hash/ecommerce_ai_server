const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Rules
 * Centralized validation rules for all API endpoints
 */

// Auth Validations
const authValidations = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  
  updatePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ]
};

// User Validations
const userValidations = {
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[\d\s\-+()]+$/).withMessage('Please enter a valid phone number')
  ],
  
  addAddress: [
    body('street')
      .trim()
      .notEmpty().withMessage('Street address is required'),
    body('city')
      .trim()
      .notEmpty().withMessage('City is required'),
    body('state')
      .trim()
      .notEmpty().withMessage('State is required'),
    body('zipCode')
      .trim()
      .notEmpty().withMessage('ZIP code is required'),
    body('country')
      .optional()
      .trim(),
    body('isDefault')
      .optional()
      .isBoolean().withMessage('isDefault must be a boolean')
  ]
};

// Product Validations
const productValidations = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Product name is required')
      .isLength({ max: 100 }).withMessage('Product name cannot exceed 100 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Product description is required'),
    body('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isIn(['electronics', 'fashion', 'home', 'sports', 'books', 'toys', 'beauty', 'automotive', 'grocery', 'other'])
      .withMessage('Invalid category'),
    body('images')
      .isArray({ min: 1 }).withMessage('At least one product image is required'),
    body('inventory.quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Product name cannot exceed 100 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category')
      .optional()
      .trim()
      .isIn(['electronics', 'fashion', 'home', 'sports', 'books', 'toys', 'beauty', 'automotive', 'grocery', 'other'])
      .withMessage('Invalid category')
  ],
  
  review: [
    body('rating')
      .notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
  ]
};

// Cart Validations
const cartValidations = {
  addItem: [
    body('productId')
      .notEmpty().withMessage('Product ID is required')
      .isMongoId().withMessage('Invalid product ID'),
    body('quantity')
      .optional()
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('variant')
      .optional()
      .isObject().withMessage('Variant must be an object')
  ],
  
  updateQuantity: [
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
  ]
};

// Common Validations
const commonValidations = {
  mongoId: (fieldName) => [
    param(fieldName)
      .isMongoId().withMessage(`Invalid ${fieldName} format`)
  ],
  
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .trim(),
    query('order')
      .optional()
      .isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
  ]
};

/**
 * Validation error handler middleware
 * Checks for validation errors and returns formatted response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

module.exports = {
  authValidations,
  userValidations,
  productValidations,
  cartValidations,
  commonValidations,
  handleValidationErrors
};

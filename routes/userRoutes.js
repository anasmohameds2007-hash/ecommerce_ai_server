const express = require('express');
const { userController } = require('../controllers');
const { authenticate, authorizeAdmin } = require('../middleware');
const { userValidations, commonValidations, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

/**
 * User Routes
 * Base path: /api/users
 */

// Profile routes (authenticated users)
router.get('/profile', authenticate, userController.getProfile);

router.put('/profile',
  authenticate,
  userValidations.updateProfile,
  handleValidationErrors,
  userController.updateProfile
);

// Address routes
router.post('/addresses',
  authenticate,
  userValidations.addAddress,
  handleValidationErrors,
  userController.addAddress
);

router.put('/addresses/:addressId',
  authenticate,
  userValidations.addAddress,
  handleValidationErrors,
  userController.updateAddress
);

router.delete('/addresses/:addressId', authenticate, userController.deleteAddress);

// Wishlist routes
router.get('/wishlist', authenticate, userController.getWishlist);

router.post('/wishlist/:productId',
  authenticate,
  commonValidations.mongoId('productId'),
  handleValidationErrors,
  userController.addToWishlist
);

router.delete('/wishlist/:productId',
  authenticate,
  commonValidations.mongoId('productId'),
  handleValidationErrors,
  userController.removeFromWishlist
);

// Admin routes
router.get('/',
  authenticate,
  authorizeAdmin,
  commonValidations.pagination,
  handleValidationErrors,
  userController.getAllUsers
);

router.get('/:id',
  authenticate,
  authorizeAdmin,
  commonValidations.mongoId('id'),
  handleValidationErrors,
  userController.getUserById
);

router.put('/:id/role',
  authenticate,
  authorizeAdmin,
  commonValidations.mongoId('id'),
  handleValidationErrors,
  userController.updateUserRole
);

router.put('/:id/status',
  authenticate,
  authorizeAdmin,
  commonValidations.mongoId('id'),
  handleValidationErrors,
  userController.updateUserStatus
);

router.delete('/:id',
  authenticate,
  authorizeAdmin,
  commonValidations.mongoId('id'),
  handleValidationErrors,
  userController.deleteUser
);

module.exports = router;

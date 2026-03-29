const express = require('express');
const { cartController } = require('../controllers');
const { authenticate } = require('../middleware');
const { cartValidations, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

/**
 * Cart Routes
 * Base path: /api/cart
 */

// All cart routes require authentication
router.use(authenticate);

// Get cart
router.get('/', cartController.getCart);

// Validate cart
router.get('/validate', cartController.validateCart);

// Add item to cart
router.post('/items',
  cartValidations.addItem,
  handleValidationErrors,
  cartController.addItemToCart
);

// Update item quantity
router.put('/items/:itemId',
  cartValidations.updateQuantity,
  handleValidationErrors,
  cartController.updateItemQuantity
);

// Remove item from cart
router.delete('/items/:itemId', cartController.removeItemFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

// Apply coupon
router.post('/coupon', cartController.applyCoupon);

// Remove coupon
router.delete('/coupon', cartController.removeCoupon);

// Sync cart (merge local cart with server)
router.post('/sync', cartController.syncCart);

module.exports = router;

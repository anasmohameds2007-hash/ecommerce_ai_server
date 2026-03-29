const { Cart, Product } = require('../models');
const { asyncHandler } = require('../utils');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  errorResponse
} = require('../utils/response');

/**
 * Cart Controller
 * Handles shopping cart operations
 */

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.userId })
    .populate('items.product', 'name price images inventory category');

  if (!cart) {
    // Return empty cart if none exists
    return successResponse(res, 'Cart retrieved successfully', {
      cart: {
        items: [],
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        itemCount: 0,
        coupon: null
      }
    });
  }

  successResponse(res, 'Cart retrieved successfully', { cart });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Private
 */
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;
  const userId = req.user.userId;

  // Validate product exists and is active
  const product = await Product.findById(productId);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  if (!product.isActive) {
    return errorResponse(res, 'Product is not available', 400);
  }

  // Check inventory
  if (product.inventory.quantity < quantity) {
    return errorResponse(res, 'Insufficient inventory', 400);
  }

  // Calculate price (consider variant price adjustment)
  let price = product.price;
  if (variant && variant.priceAdjustment) {
    price += variant.priceAdjustment;
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: []
    });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(item => {
    const productMatch = item.product.toString() === productId.toString();
    const variantMatch = variant
      ? (item.variant?.name === variant.name && item.variant?.option === variant.option)
      : !item.variant;
    return productMatch && variantMatch;
  });

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // Check inventory for new quantity
    if (product.inventory.quantity < newQuantity) {
      return errorResponse(res, 'Insufficient inventory for requested quantity', 400);
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      variant,
      price
    });
  }

  await cart.save();

  // Populate and return updated cart
  await cart.populate('items.product', 'name price images inventory category');

  createdResponse(res, 'Item added to cart', { cart });
});

/**
 * @desc    Update item quantity in cart
 * @route   PUT /api/cart/items/:itemId
 * @access  Private
 */
const updateItemQuantity = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.userId;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return notFoundResponse(res, 'Cart not found');
  }

  const item = cart.items.id(itemId);

  if (!item) {
    return notFoundResponse(res, 'Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item
    item.deleteOne();
  } else {
    // Check product inventory
    const product = await Product.findById(item.product);
    if (product && product.inventory.quantity < quantity) {
      return errorResponse(res, 'Insufficient inventory', 400);
    }
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product', 'name price images inventory category');

  successResponse(res, 'Cart updated successfully', { cart });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:itemId
 * @access  Private
 */
const removeItemFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.userId;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return notFoundResponse(res, 'Cart not found');
  }

  const item = cart.items.id(itemId);

  if (!item) {
    return notFoundResponse(res, 'Item not found in cart');
  }

  item.deleteOne();
  await cart.save();
  await cart.populate('items.product', 'name price images inventory category');

  successResponse(res, 'Item removed from cart', { cart });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return successResponse(res, 'Cart is already empty');
  }

  cart.items = [];
  cart.coupon = { code: null, discount: 0, discountType: 'percentage' };
  await cart.save();

  successResponse(res, 'Cart cleared successfully', { cart });
});

/**
 * @desc    Apply coupon to cart
 * @route   POST /api/cart/coupon
 * @access  Private
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const { code, discount, discountType = 'percentage' } = req.body;
  const userId = req.user.userId;

  // Validate coupon data
  if (!code || discount === undefined) {
    return errorResponse(res, 'Coupon code and discount are required', 400);
  }

  if (discountType === 'percentage' && (discount < 0 || discount > 100)) {
    return errorResponse(res, 'Percentage discount must be between 0 and 100', 400);
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return notFoundResponse(res, 'Cart not found');
  }

  if (cart.items.length === 0) {
    return errorResponse(res, 'Cannot apply coupon to empty cart', 400);
  }

  cart.coupon = {
    code,
    discount,
    discountType
  };

  await cart.save();
  await cart.populate('items.product', 'name price images inventory category');

  successResponse(res, 'Coupon applied successfully', { cart });
});

/**
 * @desc    Remove coupon from cart
 * @route   DELETE /api/cart/coupon
 * @access  Private
 */
const removeCoupon = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return notFoundResponse(res, 'Cart not found');
  }

  cart.coupon = {
    code: null,
    discount: 0,
    discountType: 'percentage'
  };

  await cart.save();
  await cart.populate('items.product', 'name price images inventory category');

  successResponse(res, 'Coupon removed successfully', { cart });
});

/**
 * @desc    Sync cart (merge local cart with server cart)
 * @route   POST /api/cart/sync
 * @access  Private
 */
const syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of { productId, quantity, variant }
  const userId = req.user.userId;

  if (!Array.isArray(items)) {
    return errorResponse(res, 'Items must be an array', 400);
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  // Validate and add each item
  for (const item of items) {
    const { productId, quantity, variant } = item;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) continue;
    if (product.inventory.quantity < quantity) continue;

    let price = product.price;
    if (variant && variant.priceAdjustment) {
      price += variant.priceAdjustment;
    }

    // Check if item exists
    const existingItemIndex = cart.items.findIndex(cartItem => {
      const productMatch = cartItem.product.toString() === productId.toString();
      const variantMatch = variant
        ? (cartItem.variant?.name === variant.name && cartItem.variant?.option === variant.option)
        : !cartItem.variant;
      return productMatch && variantMatch;
    });

    if (existingItemIndex > -1) {
      // Update to higher quantity
      cart.items[existingItemIndex].quantity = Math.max(
        cart.items[existingItemIndex].quantity,
        quantity
      );
    } else {
      cart.items.push({ product: productId, quantity, variant, price });
    }
  }

  await cart.save();
  await cart.populate('items.product', 'name price images inventory category');

  successResponse(res, 'Cart synced successfully', { cart });
});

/**
 * @desc    Validate cart (check inventory availability)
 * @route   GET /api/cart/validate
 * @access  Private
 */
const validateCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart) {
    return successResponse(res, 'Cart is empty', { valid: true, issues: [] });
  }

  const issues = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      issues.push({
        itemId: item._id,
        productId: item.product?._id,
        issue: 'Product no longer available',
        severity: 'error'
      });
    } else if (product.inventory.quantity < item.quantity) {
      issues.push({
        itemId: item._id,
        productId: product._id,
        productName: product.name,
        issue: 'Insufficient inventory',
        requested: item.quantity,
        available: product.inventory.quantity,
        severity: 'warning'
      });
    }
  }

  const valid = issues.filter(i => i.severity === 'error').length === 0;

  successResponse(res, 'Cart validation complete', {
    valid,
    issues,
    canCheckout: valid && issues.length === 0
  });
});

module.exports = {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  syncCart,
  validateCart
};

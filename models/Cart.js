const mongoose = require('mongoose');

/**
 * Cart Schema
 * Manages user shopping carts with item details
 */
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
    default: 1
  },
  variant: {
    name: String,
    option: String
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user - creates index automatically
  },
  items: [cartItemSchema],
  coupon: {
    code: {
      type: String,
      default: null
    },
    discount: {
      type: Number,
      default: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries (user already indexed via unique: true)
// Additional indexes can be added here if needed

/**
 * Virtual for calculating subtotal
 */
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

/**
 * Virtual for calculating total discount
 */
cartSchema.virtual('discountAmount').get(function() {
  const subtotal = this.subtotal;
  if (!this.coupon || !this.coupon.code) return 0;
  
  if (this.coupon.discountType === 'percentage') {
    return (subtotal * this.coupon.discount) / 100;
  } else {
    return Math.min(this.coupon.discount, subtotal);
  }
});

/**
 * Virtual for calculating total
 */
cartSchema.virtual('total').get(function() {
  return this.subtotal - this.discountAmount;
});

/**
 * Virtual for item count
 */
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Include virtuals in JSON output
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

/**
 * Pre-save middleware to update lastUpdated
 */
cartSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

/**
 * Instance method to add item to cart
 */
cartSchema.methods.addItem = async function(productId, quantity = 1, variant = null, price) {
  const existingItemIndex = this.items.findIndex(item => {
    const productMatch = item.product.toString() === productId.toString();
    const variantMatch = variant 
      ? (item.variant?.name === variant.name && item.variant?.option === variant.option)
      : !item.variant;
    return productMatch && variantMatch;
  });

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      variant,
      price
    });
  }

  await this.save();
  return this;
};

/**
 * Instance method to update item quantity
 */
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const itemIndex = this.items.findIndex(item => item._id.toString() === itemId);
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    this.items[itemIndex].quantity = quantity;
  }

  await this.save();
  return this;
};

/**
 * Instance method to remove item from cart
 */
cartSchema.methods.removeItem = async function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId);
  await this.save();
  return this;
};

/**
 * Instance method to clear cart
 */
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.coupon = { code: null, discount: 0, discountType: 'percentage' };
  await this.save();
  return this;
};

/**
 * Instance method to apply coupon
 */
cartSchema.methods.applyCoupon = async function(code, discount, discountType = 'percentage') {
  this.coupon = { code, discount, discountType };
  await this.save();
  return this;
};

/**
 * Instance method to remove coupon
 */
cartSchema.methods.removeCoupon = async function() {
  this.coupon = { code: null, discount: 0, discountType: 'percentage' };
  await this.save();
  return this;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

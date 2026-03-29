const mongoose = require('mongoose');

/**
 * Product Schema
 * Defines the structure for product documents in the e-commerce database
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative'],
    default: 0
  },
  images: [{
    type: String,
    required: [true, 'At least one product image is required']
  }],
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        'electronics',
        'fashion',
        'home',
        'sports',
        'books',
        'toys',
        'beauty',
        'automotive',
        'grocery',
        'other'
      ],
      message: 'Please select a valid category'
    }
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  sku: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined values while maintaining uniqueness
  },
  inventory: {
    quantity: {
      type: Number,
      required: [true, 'Inventory quantity is required'],
      min: [0, 'Inventory cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    }
  },
  attributes: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],
  variants: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      label: String,
      priceAdjustment: {
        type: Number,
        default: 0
      },
      quantity: {
        type: Number,
        default: 0
      }
    }]
  }],
  ratings: {
    average: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      maxlength: 100
    },
    comment: {
      type: String,
      maxlength: 1000
    },
    images: [String],
    helpful: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number, // in grams
    default: 0
  },
  dimensions: {
    length: Number, // in cm
    width: Number,
    height: Number
  },
  seo: {
    title: {
      type: String,
      maxlength: 70
    },
    description: {
      type: String,
      maxlength: 160
    },
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'ratings.average': -1 });

/**
 * Virtual for checking if product is in stock
 */
productSchema.virtual('inStock').get(function() {
  return this.inventory.quantity > 0;
});

/**
 * Virtual for checking if product is low in stock
 */
productSchema.virtual('lowStock').get(function() {
  return this.inventory.quantity > 0 && 
         this.inventory.quantity <= this.inventory.lowStockThreshold;
});

/**
 * Virtual for discount percentage
 */
productSchema.virtual('discountPercentage').get(function() {
  if (this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Include virtuals in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

/**
 * Static method to search products
 */
productSchema.statics.search = async function(query, options = {}) {
  const { category, minPrice, maxPrice, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = options;
  
  const searchQuery = { isActive: true };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (category) {
    searchQuery.category = category;
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};
    if (minPrice !== undefined) searchQuery.price.$gte = minPrice;
    if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice;
  }
  
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;
  
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    this.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(searchQuery)
  ]);
  
  return {
    products,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Instance method to add a review
 */
productSchema.methods.addReview = async function(userId, reviewData) {
  const existingReview = this.reviews.find(
    review => review.user.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('User has already reviewed this product');
  }
  
  this.reviews.push({
    user: userId,
    ...reviewData
  });
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = totalRating / this.reviews.length;
  this.ratings.count = this.reviews.length;
  
  await this.save();
  return this;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

const { Product } = require('../models');
const { asyncHandler } = require('../utils');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  errorResponse,
  paginatedResponse
} = require('../utils/response');

/**
 * Product Controller
 * Handles product CRUD operations and search
 */

/**
 * @desc    Get all products with filters and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    order = 'desc',
    search,
    featured,
    inStock
  } = req.query;

  // Build query
  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  if (inStock === 'true') {
    query['inventory.quantity'] = { $gt: 0 };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Build sort options
  const sortOptions = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(query)
  ]);

  successResponse(res, 'Products retrieved successfully', {
    products,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalProducts: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  });
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('reviews.user', 'name avatar');

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  successResponse(res, 'Product retrieved successfully', { product });
});

/**
 * @desc    Get product by slug (if slug field exists)
 * @route   GET /api/products/slug/:slug
 * @access  Public
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('reviews.user', 'name avatar');

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  successResponse(res, 'Product retrieved successfully', { product });
});

/**
 * @desc    Create new product (Admin only)
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;

  // Generate SKU if not provided
  if (!productData.sku) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    productData.sku = `SKU-${timestamp}-${random}`;
  }

  const product = await Product.create(productData);

  createdResponse(res, 'Product created successfully', { product });
});

/**
 * @desc    Update product (Admin only)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  // Update fields
  const allowedUpdates = [
    'name', 'description', 'price', 'comparePrice', 'images',
    'category', 'subcategory', 'brand', 'inventory', 'attributes',
    'variants', 'tags', 'isActive', 'isFeatured', 'weight', 'dimensions', 'seo'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  successResponse(res, 'Product updated successfully', { product });
});

/**
 * @desc    Delete product (Admin only)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  // Soft delete - mark as inactive
  product.isActive = false;
  await product.save();

  successResponse(res, 'Product deleted successfully');
});

/**
 * @desc    Hard delete product (Admin only - permanent)
 * @route   DELETE /api/products/:id/permanent
 * @access  Private/Admin
 */
const permanentDeleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  await product.deleteOne();

  successResponse(res, 'Product permanently deleted');
});

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q, ...options } = req.query;

  if (!q) {
    return errorResponse(res, 'Search query is required', 400);
  }

  const result = await Product.search(q, options);

  successResponse(res, 'Search results', result);
});

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 12, ...filters } = req.query;

  const result = await Product.search(null, {
    category,
    page,
    limit,
    ...filters
  });

  successResponse(res, `Products in ${category} category`, result);
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured/list
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({ isFeatured: true, isActive: true })
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  successResponse(res, 'Featured products retrieved', { products });
});

/**
 * @desc    Get related products
 * @route   GET /api/products/:id/related
 * @access  Public
 */
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true
  })
    .limit(4)
    .select('name price images ratings category');

  successResponse(res, 'Related products retrieved', {
    products: relatedProducts
  });
});

/**
 * @desc    Add product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
const addReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user.userId;

  const product = await Product.findById(productId);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  // Check if user already reviewed
  const existingReview = product.reviews.find(
    review => review.user.toString() === userId.toString()
  );

  if (existingReview) {
    return errorResponse(res, 'You have already reviewed this product', 400);
  }

  // Add review
  product.reviews.push({
    user: userId,
    rating,
    title,
    comment
  });

  // Recalculate average rating
  const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  product.ratings.average = totalRating / product.reviews.length;
  product.ratings.count = product.reviews.length;

  await product.save();

  // Populate user info before sending response
  await product.populate('reviews.user', 'name avatar');

  createdResponse(res, 'Review added successfully', {
    reviews: product.reviews,
    ratings: product.ratings
  });
});

/**
 * @desc    Update product review
 * @route   PUT /api/products/:id/reviews/:reviewId
 * @access  Private
 */
const updateReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const { id: productId, reviewId } = req.params;
  const userId = req.user.userId;

  const product = await Product.findById(productId);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  const review = product.reviews.id(reviewId);

  if (!review) {
    return notFoundResponse(res, 'Review not found');
  }

  // Check if user owns the review
  if (review.user.toString() !== userId.toString()) {
    return errorResponse(res, 'Not authorized to update this review', 403);
  }

  // Update review
  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;

  // Recalculate average rating
  const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  product.ratings.average = totalRating / product.reviews.length;

  await product.save();

  successResponse(res, 'Review updated successfully', {
    reviews: product.reviews,
    ratings: product.ratings
  });
});

/**
 * @desc    Delete product review
 * @route   DELETE /api/products/:id/reviews/:reviewId
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { id: productId, reviewId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const product = await Product.findById(productId);

  if (!product) {
    return notFoundResponse(res, 'Product not found');
  }

  const review = product.reviews.id(reviewId);

  if (!review) {
    return notFoundResponse(res, 'Review not found');
  }

  // Check if user owns the review or is admin
  if (review.user.toString() !== userId.toString() && userRole !== 'admin') {
    return errorResponse(res, 'Not authorized to delete this review', 403);
  }

  // Remove review
  review.deleteOne();

  // Recalculate average rating
  if (product.reviews.length > 0) {
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.ratings.average = totalRating / product.reviews.length;
    product.ratings.count = product.reviews.length;
  } else {
    product.ratings.average = 0;
    product.ratings.count = 0;
  }

  await product.save();

  successResponse(res, 'Review deleted successfully', {
    reviews: product.reviews,
    ratings: product.ratings
  });
});

/**
 * @desc    Get all categories
 * @route   GET /api/products/categories/all
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });

  successResponse(res, 'Categories retrieved', { categories });
});

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  permanentDeleteProduct,
  searchProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getRelatedProducts,
  addReview,
  updateReview,
  deleteReview,
  getCategories
};

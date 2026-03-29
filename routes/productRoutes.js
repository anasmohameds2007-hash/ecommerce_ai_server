const express = require('express');
const { productController } = require('../controllers');
const { authenticate, authorizeAdmin } = require('../middleware');
const { productValidations, commonValidations, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

/**
 * Product Routes
 * Base path: /api/products
 */

// Public routes
router.get('/',
  commonValidations.pagination,
  handleValidationErrors,
  productController.getProducts
);

router.get('/search',
  commonValidations.pagination,
  handleValidationErrors,
  productController.searchProducts
);

router.get('/categories/all', productController.getCategories);

router.get('/featured/list', productController.getFeaturedProducts);

router.get('/category/:category',
  commonValidations.pagination,
  handleValidationErrors,
  productController.getProductsByCategory
);

router.get('/slug/:slug', productController.getProductBySlug);

router.get('/:id/related',
  commonValidations.mongoId('id'),
  handleValidationErrors,
  productController.getRelatedProducts
);

router.get('/:id',
  commonValidations.mongoId('id'),
  handleValidationErrors,
  productController.getProductById
);

// Protected routes - Reviews
router.post('/:id/reviews',
  authenticate,
  commonValidations.mongoId('id'),
  productValidations.review,
  handleValidationErrors,
  productController.addReview
);

router.put('/:id/reviews/:reviewId',
  authenticate,
  commonValidations.mongoId('id'),
  commonValidations.mongoId('reviewId'),
  handleValidationErrors,
  productController.updateReview
);

router.delete('/:id/reviews/:reviewId',
  authenticate,
  commonValidations.mongoId('id'),
  commonValidations.mongoId('reviewId'),
  handleValidationErrors,
  productController.deleteReview
);

// Admin routes
router.post('/',
  authenticate,
  authorizeAdmin,
  productValidations.create,
  handleValidationErrors,
  productController.createProduct
);

router.put('/:id',
  authenticate,
  authorizeAdmin,
  commonValidations.mongoId('id'),
  productValidations.update,
  handleValidationErrors,
  productController.updateProduct
);

router.delete('/:id',
  authenticate,
  authorizeAdmin,
  commonValidations.mongoId('id'),
  handleValidationErrors,
  productController.deleteProduct
);

router.delete('/:id/permanent',
  authenticate,
  authorizeAdmin,
  commonValidations.mongoId('id'),
  handleValidationErrors,
  productController.permanentDeleteProduct
);

module.exports = router;

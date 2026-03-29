/**
 * Controllers Index
 * Central export point for all controllers
 */

const authController = require('./authController');
const userController = require('./userController');
const productController = require('./productController');
const cartController = require('./cartController');

module.exports = {
  authController,
  userController,
  productController,
  cartController
};

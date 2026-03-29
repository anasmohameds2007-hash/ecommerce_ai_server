/**
 * Routes Index
 * Central export point for all routes
 */

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');

module.exports = {
  authRoutes,
  userRoutes,
  productRoutes,
  cartRoutes
};

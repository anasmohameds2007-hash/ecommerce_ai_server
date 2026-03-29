/**
 * Models Index
 * Central export point for all models
 */

const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');

module.exports = {
  User,
  Product,
  Cart
};

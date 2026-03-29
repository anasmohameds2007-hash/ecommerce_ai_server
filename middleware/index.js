/**
 * Middleware Index
 * Central export point for all middleware
 */

const auth = require('./auth');
const { errorHandler, notFoundHandler } = require('./errorHandler');

module.exports = {
  ...auth,
  errorHandler,
  notFoundHandler
};

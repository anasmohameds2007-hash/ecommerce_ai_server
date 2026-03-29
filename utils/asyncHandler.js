/**
 * Async Handler Utility
 * Wraps async route handlers to catch errors automatically
 * Eliminates need for try-catch blocks in every controller
 */

/**
 * Wrapper for async route handlers
 * Catches errors and passes them to Express error handling middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;

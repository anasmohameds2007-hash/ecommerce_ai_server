const { User } = require('../models');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { unauthorizedResponse, forbiddenResponse, errorResponse } = require('../utils/response');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req);

    if (!token) {
      return unauthorizedResponse(res, 'Access denied. No token provided.');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Find user by ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      return unauthorizedResponse(res, 'User not found.');
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, 'Account is deactivated.');
    }

    // Attach user info to request object
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return unauthorizedResponse(res, 'Token has expired. Please login again.');
    }
    if (error.message === 'Invalid token') {
      return unauthorizedResponse(res, 'Invalid token.');
    }
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Authorization Middleware - Admin Only
 * Ensures the authenticated user has admin role
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required.');
  }

  if (req.user.role !== 'admin') {
    return forbiddenResponse(res, 'Admin access required.');
  }

  next();
};

/**
 * Authorization Middleware - Specific Roles
 * @param  {...string} roles - Allowed roles
 * @returns {Function} - Express middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return forbiddenResponse(res, `Access restricted to: ${roles.join(', ')}`);
    }

    next();
  };
};

/**
 * Authorization Middleware - Owner or Admin
 * Ensures user is either the resource owner or an admin
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 */
const authorizeOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required.');
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (req.user.userId.toString() !== ownerId.toString()) {
        return forbiddenResponse(res, 'You do not have permission to access this resource.');
      }

      next();
    } catch (error) {
      return errorResponse(res, 'Authorization check failed.', 500);
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorizeAdmin,
  authorizeRoles,
  authorizeOwnerOrAdmin
};

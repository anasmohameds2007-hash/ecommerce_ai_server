const { User } = require('../models');
const { generateToken, generateTokenPair } = require('../utils/jwt');
const { asyncHandler } = require('../utils');
const {
  successResponse,
  createdResponse,
  errorResponse,
  conflictResponse,
  unauthorizedResponse
} = require('../utils/response');

/**
 * Auth Controller
 * Handles user authentication operations
 */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return conflictResponse(res, 'User with this email already exists');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password
  });

  // Generate token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  // Return user data (without password) and token
  createdResponse(res, 'User registered successfully', {
    user: user.toPublicProfile(),
    token
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return unauthorizedResponse(res, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    return unauthorizedResponse(res, 'Account is deactivated. Please contact support.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return unauthorizedResponse(res, 'Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  successResponse(res, 'Login successful', {
    user: user.toPublicProfile(),
    token
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return unauthorizedResponse(res, 'User not found');
  }

  successResponse(res, 'User profile retrieved', {
    user: user.toPublicProfile()
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    return unauthorizedResponse(res, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isPasswordValid) {
    return unauthorizedResponse(res, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  successResponse(res, 'Password updated successfully', {
    token
  });
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // by removing the token from storage
  // Optional: Add token to a blacklist in Redis for enhanced security
  successResponse(res, 'Logout successful');
});

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user || !user.isActive) {
    return unauthorizedResponse(res, 'Invalid token');
  }

  const tokens = generateTokenPair(user);

  successResponse(res, 'Token refreshed successfully', tokens);
});

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  logout,
  refreshToken
};

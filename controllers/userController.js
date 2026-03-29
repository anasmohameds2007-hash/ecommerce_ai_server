const { User } = require('../models');
const { asyncHandler } = require('../utils');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  errorResponse
} = require('../utils/response');

/**
 * User Controller
 * Handles user profile and management operations
 */

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate('wishlist', 'name price images ratings');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  successResponse(res, 'Profile retrieved successfully', {
    user: user.toPublicProfile()
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Update fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatar) user.avatar = avatar;

  await user.save();

  successResponse(res, 'Profile updated successfully', {
    user: user.toPublicProfile()
  });
});

/**
 * @desc    Add address to user profile
 * @route   POST /api/users/addresses
 * @access  Private
 */
const addAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // If this address is set as default, unset other defaults
  if (isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  // Add new address
  user.addresses.push({
    street,
    city,
    state,
    zipCode,
    country: country || 'India',
    isDefault: isDefault || false
  });

  await user.save();

  createdResponse(res, 'Address added successfully', {
    addresses: user.addresses
  });
});

/**
 * @desc    Update address
 * @route   PUT /api/users/addresses/:addressId
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { street, city, state, zipCode, country, isDefault } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const address = user.addresses.id(addressId);

  if (!address) {
    return notFoundResponse(res, 'Address not found');
  }

  // If this address is set as default, unset other defaults
  if (isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  // Update fields
  if (street) address.street = street;
  if (city) address.city = city;
  if (state) address.state = state;
  if (zipCode) address.zipCode = zipCode;
  if (country) address.country = country;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await user.save();

  successResponse(res, 'Address updated successfully', {
    addresses: user.addresses
  });
});

/**
 * @desc    Delete address
 * @route   DELETE /api/users/addresses/:addressId
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const address = user.addresses.id(addressId);

  if (!address) {
    return notFoundResponse(res, 'Address not found');
  }

  address.deleteOne();
  await user.save();

  successResponse(res, 'Address deleted successfully', {
    addresses: user.addresses
  });
});

/**
 * @desc    Add product to wishlist
 * @route   POST /api/users/wishlist/:productId
 * @access  Private
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Check if already in wishlist
  if (user.wishlist.includes(productId)) {
    return successResponse(res, 'Product already in wishlist', {
      wishlist: user.wishlist
    });
  }

  user.wishlist.push(productId);
  await user.save();

  successResponse(res, 'Product added to wishlist', {
    wishlist: user.wishlist
  });
});

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/users/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  successResponse(res, 'Product removed from wishlist', {
    wishlist: user.wishlist
  });
});

/**
 * @desc    Get user's wishlist with product details
 * @route   GET /api/users/wishlist
 * @access  Private
 */
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate('wishlist', 'name price images ratings category');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  successResponse(res, 'Wishlist retrieved successfully', {
    wishlist: user.wishlist
  });
});

// Admin Controllers

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role } = req.query;

  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    query.role = role;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(query)
  ]);

  successResponse(res, 'Users retrieved successfully', {
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalUsers: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  });
});

/**
 * @desc    Get single user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  successResponse(res, 'User retrieved successfully', { user });
});

/**
 * @desc    Update user role (Admin only)
 * @route   PUT /api/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  user.role = role;
  await user.save();

  successResponse(res, 'User role updated successfully', {
    user: user.toPublicProfile()
  });
});

/**
 * @desc    Deactivate/Activate user (Admin only)
 * @route   PUT /api/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Prevent deactivating self
  if (user._id.toString() === req.user.userId.toString()) {
    return errorResponse(res, 'Cannot change your own status', 400);
  }

  user.isActive = isActive;
  await user.save();

  successResponse(res, `User ${isActive ? 'activated' : 'deactivated'} successfully`, {
    user: user.toPublicProfile()
  });
});

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Prevent deleting self
  if (user._id.toString() === req.user.userId.toString()) {
    return errorResponse(res, 'Cannot delete your own account', 400);
  }

  await user.deleteOne();

  successResponse(res, 'User deleted successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser
};

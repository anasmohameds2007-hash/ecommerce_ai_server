const express = require('express');
const passport = require('passport');
const { authController } = require('../controllers');
const { authenticate } = require('../middleware');
const { authValidations, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

/**
 * Auth Routes
 * Base path: /api/auth
 */

// Public routes
router.post('/register', 
  authValidations.register,
  handleValidationErrors,
  authController.register
);

router.post('/login',
  authValidations.login,
  handleValidationErrors,
  authController.login
);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Redirect to frontend with token
    const token = req.user.token;
    const user = req.user.toPublicProfile();
    // Use production URL in production, localhost in development
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://ecommerce-ai-client-l8dc.vercel.app'  // Updated Vercel URL
      : 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

// Protected routes
router.get('/me', authenticate, authController.getMe);

router.put('/update-password',
  authenticate,
  authValidations.updatePassword,
  handleValidationErrors,
  authController.updatePassword
);

router.post('/logout', authenticate, authController.logout);

router.post('/refresh', authenticate, authController.refreshToken);

module.exports = router;

const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Biometric Login
router.post('/biometric-login', authController.biometricLogin);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout - use optionalAuth so it works even if token is expired
router.post('/logout', optionalAuth, authController.logout);

// Admin: Force logout user (invalidates all their refresh tokens)
router.post('/force-logout/:userId', authenticateToken, requireAdmin, authController.forceLogoutUser);

// Change password
router.post('/change-password', authenticateToken, authController.changePassword);

// Forgot password - request password reset
router.post('/forgot-password', authController.forgotPassword);

// Reset password - using reset token
router.post('/reset-password', authController.resetPassword);

module.exports = router;

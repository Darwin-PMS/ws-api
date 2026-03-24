const express = require('express');
const authController = require('../../../controllers/authController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/biometric-login', authController.biometricLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', optionalAuth, authController.logout);
router.post('/force-logout/:userId', authenticateToken, requireAdmin, authController.forceLogoutUser);
router.post('/change-password', authenticateToken, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;

const express = require('express');
const authController = require('../../../controllers/authController');
const adminController = require('../../../controllers/adminController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', optionalAuth, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/profile', authenticateToken, adminController.getProfile);

module.exports = router;

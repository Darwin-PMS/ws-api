const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes (require authentication)
router.get('/', authenticateToken, themeController.getCurrentTheme);
router.get('/:themeId', authenticateToken, themeController.getThemeById);
router.get('/user/:userId', authenticateToken, themeController.getUserTheme);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, themeController.getAllThemes);
router.post('/', authenticateToken, requireAdmin, themeController.createTheme);
router.put('/:themeId', authenticateToken, requireAdmin, themeController.updateTheme);
router.delete('/:themeId', authenticateToken, requireAdmin, themeController.deleteTheme);
router.put('/user/:userId', authenticateToken, requireAdmin, themeController.assignThemeToUser);

module.exports = router;

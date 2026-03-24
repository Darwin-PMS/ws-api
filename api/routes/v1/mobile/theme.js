const express = require('express');
const themeController = require('../../../controllers/themeController');
const { authenticateToken, optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/current', optionalAuth, themeController.getCurrentTheme);
router.get('/', optionalAuth, themeController.getAllThemes);
router.get('/preference', authenticateToken, themeController.getThemePreference);
router.put('/preference', authenticateToken, themeController.setThemePreference);
router.put('/user', authenticateToken, themeController.assignThemeToUser);
router.get('/:themeId', optionalAuth, themeController.getThemeById);

module.exports = router;

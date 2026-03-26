const express = require('express');
const router = express.Router();
const adminThemeController = require('../../../controllers/adminThemeController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', adminThemeController.getAllThemes);
router.get('/stats', adminThemeController.getThemeStats);
router.get('/user-preferences', adminThemeController.getUserThemePreferences);
router.get('/:themeId', adminThemeController.getThemeById);
router.post('/', adminThemeController.createTheme);
router.put('/:themeId', adminThemeController.updateTheme);
router.delete('/:themeId', adminThemeController.deleteTheme);
router.put('/:themeId/default', adminThemeController.setDefaultTheme);
router.post('/user-preference', adminThemeController.setUserThemePreference);

module.exports = router;

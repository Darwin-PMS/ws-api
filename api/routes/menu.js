const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes (require authentication)
router.get('/', authenticateToken, menuController.getMenusForUser);
router.get('/primary', authenticateToken, menuController.getPrimaryMenu);
router.get('/:menuId', authenticateToken, menuController.getMenuById);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, menuController.getAllMenus);
router.post('/', authenticateToken, requireAdmin, menuController.createMenu);
router.put('/:menuId', authenticateToken, requireAdmin, menuController.updateMenu);
router.delete('/:menuId', authenticateToken, requireAdmin, menuController.deleteMenu);

module.exports = router;

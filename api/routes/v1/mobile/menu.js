const express = require('express');
const menuController = require('../../../controllers/menuController');
const { authenticateToken, optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/user', authenticateToken, menuController.getMenusForUser);
router.get('/', optionalAuth, menuController.getAllMenus);
router.get('/:menuId', optionalAuth, menuController.getMenuById);

module.exports = router;

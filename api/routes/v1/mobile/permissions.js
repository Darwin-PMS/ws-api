const express = require('express');
const permissionController = require('../../../controllers/permissionController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/current', authenticateToken, permissionController.getCurrentPermissions);
router.get('/user', authenticateToken, permissionController.getUserPermissions);
router.put('/user', authenticateToken, permissionController.updateUserPermissions);

module.exports = router;

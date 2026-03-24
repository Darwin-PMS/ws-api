const express = require('express');
const adminController = require('../../../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', adminController.getActivityLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const safeRouteController = require('../../../controllers/safeRouteController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/all', safeRouteController.adminGetAllRoutes);
router.get('/stats', safeRouteController.getRouteStats);
router.get('/hotspots', safeRouteController.getIncidentHotspots);

module.exports = router;

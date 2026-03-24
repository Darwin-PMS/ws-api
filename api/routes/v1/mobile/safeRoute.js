const express = require('express');
const router = express.Router();
const safeRouteController = require('../../../controllers/safeRouteController');
const { authenticateToken } = require('../../../middleware/auth');

router.use(authenticateToken);

router.post('/analyze', safeRouteController.analyzeRoute);
router.get('/history', safeRouteController.getRouteHistory);
router.post('/save', safeRouteController.saveRouteAnalysis);
router.get('/my-routes', safeRouteController.getUserRoutes);
router.get('/stats', safeRouteController.getRouteStats);
router.get('/hotspots', safeRouteController.getIncidentHotspots);

module.exports = router;

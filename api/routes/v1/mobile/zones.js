const express = require('express');
const zoneController = require('../../../controllers/zoneController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

// Mobile user routes (for zone_head and other roles)
// Get current user's zones
router.get('/my-zones', authenticateToken, zoneController.getMyZones);

// Get current user's primary zone
router.get('/my-zone', authenticateToken, zoneController.getMyZone);

// Get SOS alerts for my zone
router.get('/my-zone/sos-alerts', authenticateToken, zoneController.getMyZoneSOSAlerts);

module.exports = router;

const express = require('express');
const zoneController = require('../../../controllers/zoneController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all zones
router.get('/', zoneController.getAllZones);

// Get zone by ID
router.get('/:id', zoneController.getZoneById);

// Create zone
router.post('/', zoneController.createZone);

// Update zone
router.put('/:id', zoneController.updateZone);

// Delete zone
router.delete('/:id', zoneController.deleteZone);

// Assign user to zone
router.post('/:zoneId/assign', zoneController.assignUserToZone);

// Bulk assign users to zone
router.post('/:zoneId/assign-bulk', zoneController.bulkAssignUsersToZone);

// Remove user from zone
router.delete('/:zoneId/users/:userId', zoneController.removeUserFromZone);

// Get users in zone
router.get('/:zoneId/users', zoneController.getZoneUsers);

// Get zone SOS alerts
router.get('/:zoneId/sos-alerts', zoneController.getZoneSOSAlerts);

// Get zone analytics
router.get('/:zoneId/analytics', zoneController.getZoneAnalytics);

module.exports = router;

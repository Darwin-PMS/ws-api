const express = require('express');
const trackingController = require('../controllers/trackingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// User Location Tracking endpoints
router.get('/locations', authenticateToken, requireAdmin, trackingController.getAllLocations);
router.get('/family/:familyId', authenticateToken, trackingController.getFamilyLocations);
router.get('/user/:userId', authenticateToken, trackingController.getUserLocation);
router.get('/user/:userId/history', authenticateToken, trackingController.getUserLocationHistory);
router.post('/user/:userId/location', authenticateToken, trackingController.updateUserLocation);

// Emergency Services endpoints
router.get('/nearby', authenticateToken, trackingController.getNearbyEmergencyServices);

// Geofencing endpoints
router.get('/geofences', authenticateToken, trackingController.getGeofences);
router.post('/geofences', authenticateToken, requireAdmin, trackingController.createGeofence);
router.put('/geofences/:id', authenticateToken, requireAdmin, trackingController.updateGeofence);
router.delete('/geofences/:id', authenticateToken, requireAdmin, trackingController.deleteGeofence);

// Heatmap data
router.get('/heatmap', authenticateToken, requireAdmin, trackingController.getHeatmapData);

module.exports = router;

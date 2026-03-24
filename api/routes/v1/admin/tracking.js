const express = require('express');
const trackingController = require('../../../controllers/trackingController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/locations', trackingController.getAllLocations);
router.get('/family/:familyId', trackingController.getFamilyLocations);
router.get('/user/:userId', trackingController.getUserLocation);
router.get('/user/:userId/history', trackingController.getUserLocationHistory);
router.post('/user/:userId/location', trackingController.updateUserLocation);
router.get('/user/:userId/predict', trackingController.predictRoute);
router.get('/user/:userId/status', trackingController.getUserOfflineStatus);
router.get('/nearby', trackingController.getNearbyEmergencyServices);
router.get('/geofences', trackingController.getGeofences);
router.post('/geofences', trackingController.createGeofence);
router.put('/geofences/:id', trackingController.updateGeofence);
router.delete('/geofences/:id', trackingController.deleteGeofence);
router.get('/heatmap', trackingController.getHeatmapData);

module.exports = router;

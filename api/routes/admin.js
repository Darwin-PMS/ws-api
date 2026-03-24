const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// SOS Alert management
router.get('/sos-alerts', adminController.getAllSOSAlerts);
router.get('/sos-alerts/:id', adminController.getSOSAlertById);
router.put('/sos-alerts/:id/resolve', adminController.resolveSOSAlert);

// Statistics
router.get('/stats', adminController.getStats);

// Activity logs
router.get('/activity', adminController.getActivityLogs);

// Family management
router.get('/families', adminController.getAllFamilies);
router.get('/families/:id', adminController.getFamilyById);
router.put('/families/:id', adminController.updateFamily);
router.delete('/families/:id', adminController.deleteFamily);

// Device management
router.get('/devices', adminController.getAllDevices);
router.get('/devices/:id', adminController.getDeviceById);
router.post('/devices', adminController.addDevice);
router.put('/devices/:id', adminController.updateDevice);
router.put('/devices/:id/toggle', adminController.toggleDevice);
router.delete('/devices/:id', adminController.deleteDevice);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Admin profile
router.get('/profile', adminController.getProfile);

module.exports = router;

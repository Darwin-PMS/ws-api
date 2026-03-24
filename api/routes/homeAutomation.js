const express = require('express');
const homeAutomationController = require('../controllers/homeAutomationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all devices
router.get('/devices', homeAutomationController.getDevices);

// Get device by ID
router.get('/devices/:deviceId', homeAutomationController.getDevice);

// Add new device
router.post('/devices', homeAutomationController.addDevice);

// Update device
router.put('/devices/:deviceId', homeAutomationController.updateDevice);

// Delete device
router.delete('/devices/:deviceId', homeAutomationController.deleteDevice);

// Control device
router.post('/devices/:deviceId/control', homeAutomationController.controlDevice);

// Get rooms
router.get('/rooms', homeAutomationController.getRooms);

// Get devices by room
router.get('/rooms/:room', homeAutomationController.getDevicesByRoom);

// Get devices by type
router.get('/types/:deviceType', homeAutomationController.getDevicesByType);

// Get statistics
router.get('/statistics', homeAutomationController.getStatistics);

module.exports = router;

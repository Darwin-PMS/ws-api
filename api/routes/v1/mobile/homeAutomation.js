const express = require('express');
const homeAutomationController = require('../../../controllers/homeAutomationController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/devices', authenticateToken, homeAutomationController.getDevices);
router.get('/devices/:deviceId', authenticateToken, homeAutomationController.getDevice);
router.post('/devices/:deviceId/control', authenticateToken, homeAutomationController.controlDevice);
router.post('/devices', authenticateToken, homeAutomationController.addDevice);
router.put('/devices/:deviceId', authenticateToken, homeAutomationController.updateDevice);
router.delete('/devices/:deviceId', authenticateToken, homeAutomationController.deleteDevice);

module.exports = router;

const express = require('express');
const adminController = require('../../../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', adminController.getAllDevices);
router.get('/stats', adminController.getDeviceStats);
router.get('/:id', adminController.getDeviceById);
router.post('/', adminController.addDevice);
router.put('/:id', adminController.updateDevice);
router.post('/:id/control', adminController.controlDevice);
router.put('/:id/toggle', adminController.toggleDevice);
router.delete('/:id', adminController.deleteDevice);

module.exports = router;

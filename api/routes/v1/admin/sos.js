const express = require('express');
const adminController = require('../../../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', adminController.getAllSOSAlerts);
router.get('/:id', adminController.getSOSAlertById);
router.put('/:id/resolve', adminController.resolveSOSAlert);
router.post('/:id/notify', adminController.notifySOSAlertContacts);
router.post('/:id/emergency-contact', adminController.sendEmergencyContact);

module.exports = router;

const express = require('express');
const sosController = require('../../../controllers/sosController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.post('/trigger', authenticateToken, sosController.triggerSOS);
router.get('/active', authenticateToken, sosController.getActiveSOS);
router.get('/history', authenticateToken, sosController.getSOSHistory);
router.put('/:alertId/resolve', authenticateToken, sosController.resolveSOS);
router.delete('/:alertId', authenticateToken, sosController.deleteSOS);
router.post('/location-update', authenticateToken, sosController.updateLocation);

module.exports = router;

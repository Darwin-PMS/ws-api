const express = require('express');
const sosController = require('../controllers/sosController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// SOS Alert endpoints
router.post('/trigger', authenticateToken, sosController.triggerSOS);
router.get('/active', authenticateToken, sosController.getActiveSOS);
router.get('/history', authenticateToken, sosController.getSOSHistory);
router.put('/:id/resolve', authenticateToken, sosController.resolveSOS);
router.delete('/:id', authenticateToken, sosController.cancelSOS);

module.exports = router;

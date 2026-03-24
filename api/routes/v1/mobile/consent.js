const express = require('express');
const consentController = require('../../../controllers/consentController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/consent-settings', authenticateToken, consentController.getConsentSettings);
router.put('/consent-settings', authenticateToken, consentController.updateConsentSettings);
router.get('/audit-logs', authenticateToken, consentController.getAuditLogs);

module.exports = router;

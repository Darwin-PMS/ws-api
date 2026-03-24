// Consent Routes - Express router for consent and privacy settings endpoints

const express = require('express');
const consentController = require('../controllers/consentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's consent settings
router.get('/consent-settings', consentController.getConsentSettings);

// Update consent settings
router.put('/consent-settings', consentController.updateConsentSettings);

// Get audit logs for user
router.get('/audit-logs', consentController.getAuditLogs);

module.exports = router;

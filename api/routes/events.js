// Events Routes - Express router for event ingestion and context endpoints

const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ==================== LOCATION EVENTS ====================

// Send a single location event
router.post('/families/:familyId/location', eventController.handleLocationEvent);

// Send batch location events
router.post('/families/:familyId/locations/batch', eventController.handleBatchLocationEvents);

// ==================== SUGGESTIONS ====================

// Get suggestions for a family
router.get('/families/:familyId/suggestions', eventController.getSuggestions);

// Respond to a suggestion
router.post('/suggestions/:suggestionId/respond', eventController.respondToSuggestion);

// ==================== ACTIVITY LOGS ====================

// Get activity logs for a family
router.get('/families/:familyId/activity-logs', eventController.getActivityLogs);

// Create an activity log manually
router.post('/families/:familyId/activity-logs', eventController.createActivityLog);

module.exports = router;

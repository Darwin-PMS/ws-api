const express = require('express');
const eventController = require('../../../controllers/eventController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.post('/families/:familyId/location', authenticateToken, eventController.handleLocationEvent);
router.post('/families/:familyId/locations/batch', authenticateToken, eventController.handleBatchLocationEvents);
router.get('/families/:familyId/suggestions', authenticateToken, eventController.getSuggestions);
router.post('/suggestions/:suggestionId/respond', authenticateToken, eventController.respondToSuggestion);
router.get('/families/:familyId/activity-logs', authenticateToken, eventController.getActivityLogs);
router.post('/families/:familyId/activity-logs', authenticateToken, eventController.createActivityLog);

module.exports = router;

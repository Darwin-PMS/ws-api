// Behavior Analysis Routes
const express = require('express');
const router = express.Router();
const behaviorController = require('../controllers/behaviorController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware.authenticateToken);

// Behavior Analysis endpoints
router.post('/analyze', behaviorController.analyzeLocation);
router.get('/anomalies', behaviorController.getAnomalies);
router.get('/summary/:userId', behaviorController.getBehaviorSummary);
router.post('/feedback', behaviorController.submitFeedback);
router.get('/settings/:userId', behaviorController.getSettings);
router.put('/settings/:userId', behaviorController.updateSettings);
router.get('/routines/:userId', behaviorController.getRoutines);
router.post('/routines/learn', behaviorController.learnRoutines);
router.get('/alerts/:userId', behaviorController.getAlerts);
router.put('/alerts/:alertId/resolve', behaviorController.resolveAlert);

module.exports = router;

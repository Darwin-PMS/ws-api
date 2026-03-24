const express = require('express');
const behaviorController = require('../../../controllers/behaviorController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.post('/analyze', authenticateToken, behaviorController.analyzeLocation);
router.get('/anomalies', authenticateToken, behaviorController.getAnomalies);
router.get('/summary/:userId', authenticateToken, behaviorController.getBehaviorSummary);
router.post('/feedback', authenticateToken, behaviorController.submitFeedback);
router.get('/settings/:userId', authenticateToken, behaviorController.getSettings);
router.put('/settings/:userId', authenticateToken, behaviorController.updateSettings);
router.get('/routines/:userId', authenticateToken, behaviorController.getRoutines);
router.post('/routines/learn', authenticateToken, behaviorController.learnRoutines);
router.get('/alerts/:userId', authenticateToken, behaviorController.getAlerts);
router.put('/alerts/:alertId/resolve', authenticateToken, behaviorController.resolveAlert);

module.exports = router;

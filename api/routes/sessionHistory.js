const express = require('express');
const sessionHistoryController = require('../controllers/sessionHistoryController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize session history table (run once)
router.post('/initialize', sessionHistoryController.initializeTable);

// Record a session event (can use optional auth to allow recording even with expired token)
router.post('/record', optionalAuth, sessionHistoryController.recordSession);

// Get user's session history
router.get('/user/:userId', authenticateToken, sessionHistoryController.getUserSessionHistory);

// Get all session history (admin only)
router.get('/all', authenticateToken, requireAdmin, sessionHistoryController.getAllSessionHistory);

// Get user's last session
router.get('/user/:userId/last', authenticateToken, sessionHistoryController.getLastSession);

// Get active sessions count
router.get('/user/:userId/active-count', authenticateToken, sessionHistoryController.getActiveSessionsCount);

module.exports = router;

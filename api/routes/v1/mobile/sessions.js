const express = require('express');
const sessionHistoryController = require('../../../controllers/sessionHistoryController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/history', authenticateToken, sessionHistoryController.getUserSessionHistory);

module.exports = router;

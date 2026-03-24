const express = require('express');
const settingsController = require('../../../controllers/settingsController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/groq-key', authenticateToken, settingsController.getGroqKey);

module.exports = router;

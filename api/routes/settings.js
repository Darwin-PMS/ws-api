const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

// Get Groq API Key (requires authentication)
router.get('/groq-key', authenticateToken, settingsController.getGroqKey);

// Update Groq API Key (admin only)
router.put('/groq-key', authenticateToken, settingsController.updateGroqKey);

// Get all settings (admin only)
router.get('/', authenticateToken, settingsController.getAllSettings);

module.exports = router;

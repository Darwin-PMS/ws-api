const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

/**
 * Get a setting by key
 * @param {string} key - The setting key
 * @returns {Promise<Object|null>} The setting object or null
 */
async function getSetting(key) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM app_settings WHERE setting_key = ?', [key]);
    return rows[0] || null;
}

/**
 * Get Groq API Key
 * GET /api/settings/groq-key
 */
async function getGroqKey(req, res) {
    try {
        const setting = await getSetting('groq_key');

        // Check database first, then fall back to environment variable
        let apiKey = setting?.setting_value;
        if (!apiKey || apiKey.trim() === '') {
            apiKey = process.env.GROQ_API_KEY;
        }

        if (!apiKey || apiKey.trim() === '') {
            return res.status(404).json({
                success: false,
                message: 'Groq API key not configured'
            });
        }

        res.json({
            success: true,
            data: {
                key: apiKey
            }
        });
    } catch (error) {
        console.error('Error fetching Groq key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Groq API key'
        });
    }
}

/**
 * Update Groq API Key (Admin only)
 * PUT /api/settings/groq-key
 */
async function updateGroqKey(req, res) {
    try {
        const { key } = req.body;
        const pool = getPool();

        if (!key) {
            return res.status(400).json({
                success: false,
                message: 'API key is required'
            });
        }

        // Check if setting exists
        const existing = await getSetting('groq_key');

        if (existing) {
            // Update existing
            await pool.query(
                'UPDATE app_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
                [key, 'groq_key']
            );
        } else {
            // Create new
            await pool.query(
                'INSERT INTO app_settings (id, setting_key, setting_value, description, is_encrypted) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), 'groq_key', key, 'Groq API key for AI chat functionality', true]
            );
        }

        res.json({
            success: true,
            message: 'Groq API key updated successfully'
        });
    } catch (error) {
        console.error('Error updating Groq key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Groq API key'
        });
    }
}

/**
 * Get all settings (Admin only)
 * GET /api/settings
 */
async function getAllSettings(req, res) {
    try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT id, setting_key, description, is_encrypted, created_at, updated_at FROM app_settings');

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings'
        });
    }
}

module.exports = {
    getGroqKey,
    updateGroqKey,
    getAllSettings
};

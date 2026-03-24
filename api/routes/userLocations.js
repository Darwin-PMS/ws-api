const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

/**
 * Save user location (for mobile app)
 * POST /api/users/:userId/locations
 */
router.post('/:userId/locations', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { latitude, longitude, accuracy, address, speed } = req.body;

        // Validate required fields
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }

        const connection = await db.getConnection();

        try {
            // Insert location record
            const query = `
                INSERT INTO user_locations 
                (user_id, latitude, longitude, status, address, speed, accuracy, timestamp)
                VALUES (?, ?, ?, 'safe', ?, ?, ?, NOW())
            `;

            await connection.execute(query, [
                userId,
                latitude,
                longitude,
                address || null,
                speed || null,
                accuracy || null,
            ]);

            res.status(200).json({
                success: true,
                message: 'Location saved successfully',
                data: {
                    user_id: userId,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    timestamp: new Date(),
                },
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error saving location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save location',
            error: error.message,
        });
    }
});

/**
 * Get user location history
 * GET /api/users/:userId/locations?limit=50&hours=24
 */
router.get('/:userId/locations', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, hours = 24 } = req.query;

        const connection = await db.getConnection();

        try {
            const query = `
                SELECT 
                    id,
                    user_id,
                    latitude,
                    longitude,
                    status,
                    address,
                    speed,
                    accuracy,
                    timestamp
                FROM user_locations
                WHERE user_id = ?
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY timestamp DESC
                LIMIT ?
            `;

            const [results] = await connection.execute(query, [
                userId,
                parseInt(hours),
                parseInt(limit),
            ]);

            const locations = results.map(row => ({
                id: row.id,
                user_id: row.user_id,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                status: row.status,
                address: row.address,
                speed: row.speed ? parseFloat(row.speed) : null,
                accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
                timestamp: row.timestamp,
            }));

            res.status(200).json({
                success: true,
                data: locations,
                count: locations.length,
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching location history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location history',
            error: error.message,
        });
    }
});

module.exports = router;

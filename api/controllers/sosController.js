const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const sosController = {
    // Trigger SOS Alert
    async triggerSOS(req, res) {
        try {
            const { latitude, longitude, message } = req.body;
            const pool = getPool();
            const alertId = uuidv4();

            await pool.query(
                'INSERT INTO sos_alerts (id, user_id, latitude, longitude, message, status) VALUES (?, ?, ?, ?, ?, ?)',
                [alertId, req.user.id, latitude, longitude, message, 'active']
            );

            // Save to user_locations with SOS status
            try {
                await pool.query(
                    `INSERT INTO user_locations (user_id, latitude, longitude, status, timestamp) 
                     VALUES (?, ?, ?, 'sos', NOW())`,
                    [req.user.id, latitude, longitude]
                );
            } catch (locError) {
                console.log('Could not save to user_locations:', locError.message);
            }

            // Get emergency contacts
            const [contacts] = await pool.query(
                'SELECT * FROM emergency_contacts WHERE user_id = ?',
                [req.user.id]
            );

            // Create notifications for guardians
            const [guardians] = await pool.query(
                'SELECT guardian_id FROM guardians WHERE user_id = ? AND status = ?',
                [req.user.id, 'accepted']
            );

            for (const guardian of guardians) {
                await pool.query(
                    'INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), guardian.guardian_id, 'SOS Alert!', `Emergency alert from user`, 'sos']
                );
            }

            res.status(201).json({ success: true, alertId, contacts });
        } catch (error) {
            console.error('SOS error:', error);
            res.status(500).json({ success: false, message: 'Failed to trigger SOS alert' });
        }
    },

    // Get Active SOS
    async getActiveSOS(req, res) {
        try {
            const pool = getPool();
            const [alerts] = await pool.query(
                'SELECT * FROM sos_alerts WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
                [req.user.id, 'active']
            );
            res.json({ success: true, alerts });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get active SOS' });
        }
    },

    // Get SOS History
    async getSOSHistory(req, res) {
        try {
            const pool = getPool();
            const [alerts] = await pool.query(
                'SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                [req.user.id]
            );
            res.json({ success: true, alerts });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get SOS history' });
        }
    },

    // Resolve SOS Alert
    async resolveSOS(req, res) {
        try {
            const pool = getPool();
            await pool.query(
                'UPDATE sos_alerts SET status = ?, resolved_at = NOW() WHERE id = ?',
                ['resolved', req.params.id]
            );

            res.json({ success: true, message: 'SOS alert resolved' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to resolve SOS' });
        }
    },

    // Cancel SOS Alert
    async cancelSOS(req, res) {
        try {
            const pool = getPool();
            await pool.query(
                'UPDATE sos_alerts SET status = ?, resolved_at = NOW() WHERE id = ?',
                ['cancelled', req.params.id]
            );
            res.json({ success: true, message: 'SOS alert cancelled' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to cancel SOS' });
        }
    },

    // Update SOS Location (for live tracking during SOS)
    async updateLocation(req, res) {
        try {
            const { userId, location, alertId } = req.body;
            const pool = getPool();
            const targetUserId = userId || req.user.id;

            // Save to user_locations with SOS status
            try {
                await pool.query(
                    `INSERT INTO user_locations (user_id, latitude, longitude, status, timestamp) 
                     VALUES (?, ?, ?, 'sos', NOW())`,
                    [targetUserId, location.latitude, location.longitude]
                );
            } catch (locError) {
                console.log('Could not save location update:', locError.message);
            }

            // Update sos_alerts with latest location
            if (alertId) {
                await pool.query(
                    'UPDATE sos_alerts SET latitude = ?, longitude = ? WHERE id = ?',
                    [location.latitude, location.longitude, alertId]
                );
            }

            res.json({ success: true, message: 'Location updated' });
        } catch (error) {
            console.error('Update location error:', error);
            res.status(500).json({ success: false, message: 'Failed to update location' });
        }
    },

    // Delete SOS Alert
    async deleteSOS(req, res) {
        try {
            const pool = getPool();
            const { alertId } = req.params;
            
            await pool.query(
                'UPDATE sos_alerts SET status = ?, resolved_at = NOW() WHERE id = ?',
                ['cancelled', alertId]
            );
            res.json({ success: true, message: 'SOS alert cancelled' });
        } catch (error) {
            console.error('Delete SOS error:', error);
            res.status(500).json({ success: false, message: 'Failed to cancel SOS alert' });
        }
    }
};

module.exports = sosController;

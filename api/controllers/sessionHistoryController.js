const sessionHistoryModel = require('../models/sessionHistoryModel');

const sessionHistoryController = {
    // Initialize session history table (standalone function for server startup and HTTP route handler)
    async initializeTable(req, res) {
        try {
            await sessionHistoryModel.initializeTable();

            // If res is provided, it's an HTTP request; otherwise, it's server startup
            if (res) {
                res.json({ success: true, message: 'Session history table initialized' });
            } else {
                console.log('Session history table initialized successfully');
            }
        } catch (error) {
            console.error('Initialize table error:', error);
            if (res) {
                res.status(500).json({ success: false, message: 'Failed to initialize table' });
            } else {
                throw error;
            }
        }
    },

    // Record a session event
    async recordSession(req, res) {
        try {
            // Use userId from body if available (for logout events after token expiry)
            // or from req.user if authenticated
            const userId = req.body.userId || (req.user ? req.user.id : null);

            if (!userId) {
                // Still record the session even without user ID for tracking purposes
                console.log('Recording session without user ID');
            }

            const sessionData = {
                userId: userId,
                action: req.body.action,
                appVersion: req.body.appVersion,
                deviceInfo: req.body.deviceInfo,
                deviceId: req.body.deviceId,
                osVersion: req.body.osVersion,
                ipAddress: req.ip || req.connection.remoteAddress,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                locationName: req.body.locationName,
                userAgent: req.headers['user-agent'],
                success: req.body.success !== false,
                reason: req.body.reason
            };

            const result = await sessionHistoryModel.createSession(sessionData);
            res.json({ success: true, message: 'Session recorded', id: result.insertId });
        } catch (error) {
            console.error('Record session error:', error);
            res.status(500).json({ success: false, message: 'Failed to record session' });
        }
    },

    // Get user's session history
    async getUserSessionHistory(req, res) {
        try {
            const userId = req.params.userId;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            const sessions = await sessionHistoryModel.getUserSessionHistory(userId, limit, offset);
            res.json({ success: true, sessions });
        } catch (error) {
            console.error('Get user session history error:', error);
            res.status(500).json({ success: false, message: 'Failed to get session history' });
        }
    },

    // Get all session history (admin)
    async getAllSessionHistory(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;

            const sessions = await sessionHistoryModel.getAllSessionHistory(limit, offset);
            res.json({ success: true, sessions });
        } catch (error) {
            console.error('Get all session history error:', error);
            res.status(500).json({ success: false, message: 'Failed to get session history' });
        }
    },

    // Get user's last session
    async getLastSession(req, res) {
        try {
            const userId = req.params.userId;
            const session = await sessionHistoryModel.getLastSession(userId);
            res.json({ success: true, session });
        } catch (error) {
            console.error('Get last session error:', error);
            res.status(500).json({ success: false, message: 'Failed to get last session' });
        }
    },

    // Get active sessions count
    async getActiveSessionsCount(req, res) {
        try {
            const userId = req.params.userId;
            const count = await sessionHistoryModel.getActiveSessionsCount(userId);
            res.json({ success: true, count });
        } catch (error) {
            console.error('Get active sessions count error:', error);
            res.status(500).json({ success: false, message: 'Failed to get active sessions count' });
        }
    }
};

module.exports = sessionHistoryController;

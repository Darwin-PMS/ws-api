const { getPool } = require('../config/db');

const sessionHistoryModel = {
    // Create session history table if not exists
    async initializeTable() {
        const pool = getPool();
        await pool.query(`
            CREATE TABLE IF NOT EXISTS session_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                action ENUM('login', 'logout', 'force_logout') NOT NULL,
                app_version VARCHAR(50),
                device_info VARCHAR(255),
                device_id VARCHAR(255),
                os_version VARCHAR(50),
                ip_address VARCHAR(45),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                location_name VARCHAR(255),
                user_agent TEXT,
                success BOOLEAN DEFAULT TRUE,
                reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at),
                INDEX idx_action (action)
            )
        `);
    },

    // Record a session event
    async createSession(sessionData) {
        const pool = getPool();
        const {
            userId,
            action,
            appVersion,
            deviceInfo,
            deviceId,
            osVersion,
            ipAddress,
            latitude,
            longitude,
            locationName,
            userAgent,
            success = true,
            reason = null
        } = sessionData;

        const [result] = await pool.query(
            `INSERT INTO session_history 
            (user_id, action, app_version, device_info, device_id, os_version, ip_address, latitude, longitude, location_name, user_agent, success, reason) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, appVersion, deviceInfo, deviceId, osVersion, ipAddress, latitude, longitude, locationName, userAgent, success, reason]
        );

        return result;
    },

    // Get session history for a user
    async getUserSessionHistory(userId, limit = 50, offset = 0) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT * FROM session_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        return rows;
    },

    // Get all session history (admin)
    async getAllSessionHistory(limit = 100, offset = 0) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT * FROM session_history ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows;
    },

    // Get user's last session
    async getLastSession(userId) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT * FROM session_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        return rows[0] || null;
    },

    // Get active sessions count for a user
    async getActiveSessionsCount(userId) {
        const pool = getPool();
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM session_history 
            WHERE user_id = ? AND action = 'login' AND success = TRUE 
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [userId]
        );
        return rows[0].count;
    }
};

module.exports = sessionHistoryModel;

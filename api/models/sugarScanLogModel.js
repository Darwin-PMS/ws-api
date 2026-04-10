const { getPool } = require('../config/db');

// Sugar Scan Log Model - handles scan history and tracking
const sugarScanLogModel = {
    // Create new scan log
    async create(logData) {
        const pool = getPool();
        const {
            userId, productId, productName, barcode,
            sugarConsumed, teaspoons, servingSizeConsumed,
            alertType, healthProfileAlerts, notes,
            locationLatitude, locationLongitude
        } = logData;

        const [result] = await pool.query(
            `INSERT INTO sugar_scan_logs (
                user_id, product_id, product_name, barcode,
                sugar_consumed, teaspoons, serving_size_consumed,
                alert_type, health_profile_alerts, notes,
                location_latitude, location_longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, productId, productName, barcode,
                sugarConsumed, teaspoons, servingSizeConsumed,
                alertType, healthProfileAlerts ? JSON.stringify(healthProfileAlerts) : null,
                notes, locationLatitude, locationLongitude
            ]
        );

        return result.insertId;
    },

    // Get user's scan history
    async getUserHistory(userId, options = {}) {
        const pool = getPool();
        const { limit = 50, offset = 0, startDate, endDate, productCategory } = options;

        let sql = `
            SELECT ssl.*, fp.brand_name, fp.category, fp.health_score
            FROM sugar_scan_logs ssl
            LEFT JOIN food_products fp ON ssl.product_id = fp.id
            WHERE ssl.user_id = ?
        `;
        const params = [userId];

        if (startDate) {
            sql += ' AND ssl.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND ssl.created_at <= ?';
            params.push(endDate);
        }

        if (productCategory) {
            sql += ' AND fp.category = ?';
            params.push(productCategory);
        }

        sql += ' ORDER BY ssl.created_at DESC LIMIT ? OFFSET ?';

        const [logs] = await pool.query(sql, [...params, parseInt(limit), parseInt(offset)]);
        return logs;
    },

    // Get today's scans for user
    async getTodayScans(userId) {
        const pool = getPool();
        const [logs] = await pool.query(
            `SELECT ssl.*, fp.brand_name, fp.category 
             FROM sugar_scan_logs ssl
             LEFT JOIN food_products fp ON ssl.product_id = fp.id
             WHERE ssl.user_id = ? AND DATE(ssl.created_at) = CURDATE()
             ORDER BY ssl.created_at DESC`,
            [userId]
        );
        return logs;
    },

    // Get scan statistics for user
    async getUserStats(userId, period = 'week') {
        const pool = getPool();
        let dateCondition = '';

        switch (period) {
            case 'today':
                dateCondition = 'DATE(created_at) = CURDATE()';
                break;
            case 'week':
                dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            case 'all':
                dateCondition = '1=1';
                break;
            default:
                dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        }

        const [stats] = await pool.query(
            `SELECT 
                COUNT(*) as total_scans,
                COUNT(DISTINCT product_id) as unique_products,
                SUM(sugar_consumed) as total_sugar_grams,
                SUM(teaspoons) as total_teaspoons,
                AVG(sugar_consumed) as avg_sugar_per_scan,
                COUNT(CASE WHEN alert_type LIKE '%high%' THEN 1 END) as high_sugar_alerts,
                COUNT(CASE WHEN alert_type LIKE '%hidden%' THEN 1 END) as hidden_sugar_alerts
             FROM sugar_scan_logs
             WHERE user_id = ? AND ${dateCondition}`,
            [userId]
        );

        return stats[0];
    }
};

module.exports = sugarScanLogModel;

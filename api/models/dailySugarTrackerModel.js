const { getPool } = require('../config/db');

// Daily Sugar Tracker Model - handles daily sugar consumption tracking
const dailySugarTrackerModel = {
    // Get or create today's tracker
    async getOrCreateToday(userId) {
        const pool = getPool();
        const [records] = await pool.query(
            'SELECT * FROM daily_sugar_tracker WHERE user_id = ? AND date = CURDATE()',
            [userId]
        );

        if (records.length > 0) {
            return records[0];
        }

        // Create today's record
        const [result] = await pool.query(
            `INSERT INTO daily_sugar_tracker (user_id, date, total_sugar_grams, total_teaspoons, daily_limit_grams)
             VALUES (?, CURDATE(), 0, 0, 25)
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
            [userId]
        );

        const [newRecord] = await pool.query(
            'SELECT * FROM daily_sugar_tracker WHERE user_id = ? AND date = CURDATE()',
            [userId]
        );

        return newRecord[0];
    },

    // Update daily tracker after scan
    async updateAfterScan(userId, sugarGrams, teaspoons) {
        const pool = getPool();

        // Get or create today's record
        let todayRecord = await this.getOrCreateToday(userId);

        // Update the totals
        const newTotalSugar = parseFloat(todayRecord.total_sugar_grams) + parseFloat(sugarGrams);
        const newTotalTeaspoons = parseFloat(todayRecord.total_teaspoons) + parseFloat(teaspoons);
        const newScanCount = todayRecord.scan_count + 1;
        const percentageConsumed = (newTotalSugar / todayRecord.daily_limit_grams) * 100;

        await pool.query(
            `UPDATE daily_sugar_tracker 
             SET total_sugar_grams = ?, total_teaspoons = ?, scan_count = ?, percentage_consumed = ?
             WHERE user_id = ? AND date = CURDATE()`,
            [newTotalSugar, newTotalTeaspoons, newScanCount, percentageConsumed, userId]
        );

        return {
            totalSugarGrams: newTotalSugar,
            totalTeaspoons: newTotalTeaspoons,
            scanCount: newScanCount,
            dailyLimit: todayRecord.daily_limit_grams,
            percentageConsumed: percentageConsumed
        };
    },

    // Get user's daily history
    async getDailyHistory(userId, days = 30) {
        const pool = getPool();
        const [records] = await pool.query(
            'SELECT * FROM daily_sugar_tracker WHERE user_id = ? ORDER BY date DESC LIMIT ?',
            [userId, parseInt(days)]
        );
        return records;
    },

    // Get weekly summary
    async getWeeklySummary(userId) {
        const pool = getPool();
        const [summary] = await pool.query(
            `SELECT 
                DATE(date) as date,
                total_sugar_grams,
                total_teaspoons,
                scan_count,
                high_sugar_items,
                hidden_sugar_items,
                daily_limit_grams,
                percentage_consumed
             FROM daily_sugar_tracker
             WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             ORDER BY date DESC`,
            [userId]
        );
        return summary;
    },

    // Get monthly summary
    async getMonthlySummary(userId) {
        const pool = getPool();
        const [summary] = await pool.query(
            `SELECT 
                COUNT(*) as days_tracked,
                AVG(total_sugar_grams) as avg_daily_sugar,
                MAX(total_sugar_grams) as max_daily_sugar,
                MIN(CASE WHEN total_sugar_grams > 0 THEN total_sugar_grams END) as min_daily_sugar,
                SUM(total_sugar_grams) as total_month_sugar,
                AVG(percentage_consumed) as avg_percentage_consumed,
                SUM(high_sugar_items) as total_high_sugar_items,
                SUM(hidden_sugar_items) as total_hidden_sugar_items
             FROM daily_sugar_tracker
             WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
            [userId]
        );
        return summary[0];
    }
};

module.exports = dailySugarTrackerModel;

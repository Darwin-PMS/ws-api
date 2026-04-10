const foodProductModel = require('../models/foodProductModel');
const sugarScanLogModel = require('../models/sugarScanLogModel');
const dailySugarTrackerModel = require('../models/dailySugarTrackerModel');

const adminSugarShieldController = {
    // ==================== PRODUCT MANAGEMENT ====================

    /**
     * Get all products (admin)
     * GET /api/v1/admin/sugar-shield/products
     */
    async getAllProducts(req, res) {
        try {
            const { limit = 50, offset = 0, category, brand, search, sortBy = 'created_at' } = req.query;

            const products = await foodProductModel.search(search, {
                category,
                brand,
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy
            });

            const stats = await foodProductModel.getStatistics();

            res.json({
                success: true,
                products,
                stats,
                count: products.length
            });
        } catch (error) {
            console.error('Get all products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error.message
            });
        }
    },

    /**
     * Get product by ID (admin)
     * GET /api/v1/admin/sugar-shield/products/:id
     */
    async getProduct(req, res) {
        try {
            const product = await foodProductModel.findById(req.params.id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                product
            });
        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product',
                error: error.message
            });
        }
    },

    /**
     * Create new product (admin)
     * POST /api/v1/admin/sugar-shield/products
     */
    async createProduct(req, res) {
        try {
            const productData = req.body;

            // Validate required fields
            if (!productData.productName || !productData.barcode) {
                return res.status(400).json({
                    success: false,
                    message: 'Product name and barcode are required'
                });
            }

            const productId = await foodProductModel.create(productData);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                productId
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: error.message
            });
        }
    },

    /**
     * Update product (admin)
     * PUT /api/v1/admin/sugar-shield/products/:id
     */
    async updateProduct(req, res) {
        try {
            const productData = req.body;
            const productId = req.params.id;

            const updated = await foodProductModel.update(productId, productData);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found or no changes made'
                });
            }

            res.json({
                success: true,
                message: 'Product updated successfully'
            });
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error.message
            });
        }
    },

    /**
     * Delete product (admin)
     * DELETE /api/v1/admin/sugar-shield/products/:id
     */
    async deleteProduct(req, res) {
        try {
            const productId = req.params.id;

            await foodProductModel.softDelete(productId);

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error.message
            });
        }
    },

    /**
     * Get product statistics (admin)
     * GET /api/v1/admin/sugar-shield/stats
     */
    async getProductStats(req, res) {
        try {
            const stats = await foodProductModel.getStatistics();

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get product stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product stats',
                error: error.message
            });
        }
    },

    /**
     * Get categories (admin)
     * GET /api/v1/admin/sugar-shield/categories
     */
    async getCategories(req, res) {
        try {
            const categories = await foodProductModel.getCategories();

            res.json({
                success: true,
                categories
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get categories',
                error: error.message
            });
        }
    },

    /**
     * Get brands (admin)
     * GET /api/v1/admin/sugar-shield/brands
     */
    async getBrands(req, res) {
        try {
            const brands = await foodProductModel.getBrands();

            res.json({
                success: true,
                brands
            });
        } catch (error) {
            console.error('Get brands error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get brands',
                error: error.message
            });
        }
    },

    // ==================== SCAN ANALYTICS ====================

    /**
     * Get scan analytics (admin)
     * GET /api/v1/admin/sugar-shield/analytics
     */
    async getScanAnalytics(req, res) {
        try {
            const { period = 'week' } = req.query;

            // Get overall scan statistics
            const pool = require('../config/db').getPool();

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

            const [analytics] = await pool.query(`
                SELECT 
                    COUNT(*) as total_scans,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT product_id) as unique_products,
                    AVG(sugar_consumed) as avg_sugar_per_scan,
                    SUM(sugar_consumed) as total_sugar_tracked,
                    COUNT(CASE WHEN alert_type LIKE '%high%' THEN 1 END) as high_sugar_alerts,
                    COUNT(CASE WHEN alert_type LIKE '%hidden%' THEN 1 END) as hidden_sugar_alerts
                FROM sugar_scan_logs
                WHERE ${dateCondition}
            `);

            // Get top scanned products
            const [topProducts] = await pool.query(`
                SELECT 
                    fp.product_name,
                    fp.brand_name,
                    fp.category,
                    COUNT(ssl.id) as scan_count,
                    AVG(ssl.sugar_consumed) as avg_sugar
                FROM sugar_scan_logs ssl
                JOIN food_products fp ON ssl.product_id = fp.id
                WHERE ${dateCondition}
                GROUP BY ssl.product_id, fp.product_name, fp.brand_name, fp.category
                ORDER BY scan_count DESC
                LIMIT 10
            `);

            // Get most active users
            const [activeUsers] = await pool.query(`
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    COUNT(ssl.id) as scan_count,
                    AVG(ssl.sugar_consumed) as avg_sugar
                FROM sugar_scan_logs ssl
                JOIN users u ON ssl.user_id = u.id
                WHERE ${dateCondition}
                GROUP BY ssl.user_id, u.id, u.first_name, u.last_name, u.email
                ORDER BY scan_count DESC
                LIMIT 10
            `);

            res.json({
                success: true,
                analytics: analytics[0],
                topProducts,
                activeUsers
            });
        } catch (error) {
            console.error('Get scan analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get analytics',
                error: error.message
            });
        }
    },

    /**
     * Get all scan logs (admin)
     * GET /api/v1/admin/sugar-shield/scans
     */
    async getAllScanLogs(req, res) {
        try {
            const { limit = 50, offset = 0, userId, startDate, endDate } = req.query;

            const pool = require('../config/db').getPool();

            let sql = `
                SELECT 
                    ssl.*,
                    u.first_name,
                    u.last_name,
                    u.email,
                    fp.product_name,
                    fp.brand_name
                FROM sugar_scan_logs ssl
                JOIN users u ON ssl.user_id = u.id
                LEFT JOIN food_products fp ON ssl.product_id = fp.id
                WHERE 1=1
            `;
            const params = [];

            if (userId) {
                sql += ' AND ssl.user_id = ?';
                params.push(userId);
            }

            if (startDate) {
                sql += ' AND ssl.created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                sql += ' AND ssl.created_at <= ?';
                params.push(endDate);
            }

            sql += ' ORDER BY ssl.created_at DESC LIMIT ? OFFSET ?';

            const [logs] = await pool.query(sql, [...params, parseInt(limit), parseInt(offset)]);

            res.json({
                success: true,
                logs,
                count: logs.length
            });
        } catch (error) {
            console.error('Get all scan logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get scan logs',
                error: error.message
            });
        }
    },

    /**
     * Get daily tracker analytics (admin)
     * GET /api/v1/admin/sugar-shield/tracker/analytics
     */
    async getTrackerAnalytics(req, res) {
        try {
            const pool = require('../config/db').getPool();

            const [stats] = await pool.query(`
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT user_id) as active_users,
                    AVG(total_sugar_grams) as avg_daily_sugar,
                    SUM(total_sugar_grams) as total_sugar_tracked,
                    AVG(percentage_consumed) as avg_percentage_consumed
                FROM daily_sugar_tracker
                WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            `);

            const [dailyTrends] = await pool.query(`
                SELECT 
                    date,
                    AVG(total_sugar_grams) as avg_sugar,
                    AVG(total_teaspoons) as avg_teaspoons,
                    COUNT(*) as active_users,
                    AVG(percentage_consumed) as avg_percentage
                FROM daily_sugar_tracker
                WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY date
                ORDER BY date DESC
            `);

            res.json({
                success: true,
                stats: stats[0],
                dailyTrends
            });
        } catch (error) {
            console.error('Get tracker analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get tracker analytics',
                error: error.message
            });
        }
    }
};

module.exports = adminSugarShieldController;

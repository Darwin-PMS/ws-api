const sugarShieldService = require('../services/sugarShieldService');
const foodProductModel = require('../models/foodProductModel');
const userHealthProfileModel = require('../models/userHealthProfileModel');
const sugarScanLogModel = require('../models/sugarScanLogModel');
const dailySugarTrackerModel = require('../models/dailySugarTrackerModel');

const sugarShieldController = {
    // ==================== PRODUCT SCANNING ====================

    /**
     * Scan a product by barcode
     * POST /api/v1/mobile/sugar-shield/scan
     */
    async scanProduct(req, res) {
        try {
            const { barcode, servingSizeConsumed, notes, latitude, longitude } = req.body;

            if (!barcode) {
                return res.status(400).json({
                    success: false,
                    message: 'Barcode is required'
                });
            }

            const userId = req.user?.id || req.params.userId;

            const scanData = {
                servingSizeConsumed,
                notes,
                latitude,
                longitude
            };

            const result = await sugarShieldService.processSugarScan(userId, barcode, scanData);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Scan product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to scan product',
                error: error.message
            });
        }
    },

    /**
     * Get product details by ID
     * GET /api/v1/mobile/sugar-shield/product/:id
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

            const userId = req.user?.id || req.params.userId;
            const healthProfile = await userHealthProfileModel.findByUserId(userId);
            const analysis = sugarShieldService.analyzeProduct(product, healthProfile);

            res.json({
                success: true,
                product,
                analysis
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
     * Search products
     * GET /api/v1/mobile/sugar-shield/products/search
     */
    async searchProducts(req, res) {
        try {
            const { query, category, brand, limit = 20, offset = 0 } = req.query;

            const products = await foodProductModel.search(query, {
                category,
                brand,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                products,
                count: products.length
            });
        } catch (error) {
            console.error('Search products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search products',
                error: error.message
            });
        }
    },

    /**
     * Get products by category
     * GET /api/v1/mobile/sugar-shield/products/category/:category
     */
    async getProductsByCategory(req, res) {
        try {
            const { category } = req.params;
            const { limit = 20, offset = 0, sortBy } = req.query;

            const products = await foodProductModel.getByCategory(category, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy
            });

            res.json({
                success: true,
                products,
                count: products.length
            });
        } catch (error) {
            console.error('Get products by category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error.message
            });
        }
    },

    /**
     * Get products by brand
     * GET /api/v1/mobile/sugar-shield/products/brand/:brand
     */
    async getProductsByBrand(req, res) {
        try {
            const { brand } = req.params;
            const { limit = 20, offset = 0 } = req.query;

            const products = await foodProductModel.getByBrand(brand, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                products,
                count: products.length
            });
        } catch (error) {
            console.error('Get products by brand error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error.message
            });
        }
    },

    /**
     * Get high sugar products
     * GET /api/v1/mobile/sugar-shield/products/high-sugar
     */
    async getHighSugarProducts(req, res) {
        try {
            const { threshold = 15, limit = 50, offset = 0 } = req.query;

            const products = await foodProductModel.getHighSugarProducts(
                parseFloat(threshold),
                { limit: parseInt(limit), offset: parseInt(offset) }
            );

            res.json({
                success: true,
                products,
                count: products.length
            });
        } catch (error) {
            console.error('Get high sugar products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error.message
            });
        }
    },

    /**
     * Get hidden sugar products
     * GET /api/v1/mobile/sugar-shield/products/hidden-sugar
     */
    async getHiddenSugarProducts(req, res) {
        try {
            const { category, limit = 50, offset = 0 } = req.query;

            const products = await foodProductModel.getHiddenSugarProducts({
                category,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                products,
                count: products.length
            });
        } catch (error) {
            console.error('Get hidden sugar products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error.message
            });
        }
    },

    /**
     * Get all categories
     * GET /api/v1/mobile/sugar-shield/categories
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
     * Get all brands
     * GET /api/v1/mobile/sugar-shield/brands
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

    // ==================== HEALTH PROFILE ====================

    /**
     * Get user health profile
     * GET /api/v1/mobile/sugar-shield/profile
     */
    async getHealthProfile(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;

            const profile = await userHealthProfileModel.findByUserId(userId);
            const alerts = profile
                ? await userHealthProfileModel.getHealthAlerts(userId)
                : { alerts: [], dailySugarLimit: 25, profile: null };

            res.json({
                success: true,
                profile: profile || null,
                alerts: alerts.alerts,
                dailySugarLimit: alerts.dailySugarLimit
            });
        } catch (error) {
            console.error('Get health profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get health profile',
                error: error.message
            });
        }
    },

    /**
     * Update user health profile
     * PUT /api/v1/mobile/sugar-shield/profile
     */
    async updateHealthProfile(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;
            const profileData = req.body;

            await userHealthProfileModel.upsert(userId, profileData);

            res.json({
                success: true,
                message: 'Health profile updated successfully'
            });
        } catch (error) {
            console.error('Update health profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update health profile',
                error: error.message
            });
        }
    },

    // ==================== SCAN HISTORY ====================

    /**
     * Get user's scan history
     * GET /api/v1/mobile/sugar-shield/history
     */
    async getScanHistory(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;
            const { limit = 50, offset = 0, startDate, endDate, productCategory } = req.query;

            const history = await sugarScanLogModel.getUserHistory(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                startDate,
                endDate,
                productCategory
            });

            res.json({
                success: true,
                history,
                count: history.length
            });
        } catch (error) {
            console.error('Get scan history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get scan history',
                error: error.message
            });
        }
    },

    /**
     * Get today's scans
     * GET /api/v1/mobile/sugar-shield/history/today
     */
    async getTodayScans(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;

            const scans = await sugarScanLogModel.getTodayScans(userId);

            res.json({
                success: true,
                scans,
                count: scans.length
            });
        } catch (error) {
            console.error('Get today scans error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get today scans',
                error: error.message
            });
        }
    },

    /**
     * Get scan statistics
     * GET /api/v1/mobile/sugar-shield/stats
     */
    async getScanStats(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;
            const { period = 'week' } = req.query;

            const stats = await sugarScanLogModel.getUserStats(userId, period);

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get scan stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get scan stats',
                error: error.message
            });
        }
    },

    // ==================== DASHBOARD ====================

    /**
     * Get dashboard data
     * GET /api/v1/mobile/sugar-shield/dashboard
     */
    async getDashboard(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;

            const dashboard = await sugarShieldService.getDashboardData(userId);

            if (!dashboard.success) {
                return res.status(500).json(dashboard);
            }

            res.json(dashboard);
        } catch (error) {
            console.error('Get dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard',
                error: error.message
            });
        }
    },

    /**
     * Get daily sugar tracker
     * GET /api/v1/mobile/sugar-shield/tracker/daily
     */
    async getDailyTracker(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;
            const { days = 30 } = req.query;

            const today = await dailySugarTrackerModel.getOrCreateToday(userId);
            const history = await dailySugarTrackerModel.getDailyHistory(userId, parseInt(days));

            res.json({
                success: true,
                today,
                history
            });
        } catch (error) {
            console.error('Get daily tracker error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get daily tracker',
                error: error.message
            });
        }
    },

    /**
     * Get weekly summary
     * GET /api/v1/mobile/sugar-shield/tracker/weekly
     */
    async getWeeklySummary(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;

            const summary = await dailySugarTrackerModel.getWeeklySummary(userId);

            res.json({
                success: true,
                summary
            });
        } catch (error) {
            console.error('Get weekly summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get weekly summary',
                error: error.message
            });
        }
    },

    /**
     * Get monthly summary
     * GET /api/v1/mobile/sugar-shield/tracker/monthly
     */
    async getMonthlySummary(req, res) {
        try {
            const userId = req.user?.id || req.params.userId;

            const summary = await dailySugarTrackerModel.getMonthlySummary(userId);

            res.json({
                success: true,
                summary
            });
        } catch (error) {
            console.error('Get monthly summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get monthly summary',
                error: error.message
            });
        }
    },

    // ==================== ALTERNATIVES ====================

    /**
     * Get healthy alternatives for a product
     * GET /api/v1/mobile/sugar-shield/alternatives/:productId
     */
    async getAlternatives(req, res) {
        try {
            const { productId } = req.params;

            const product = await foodProductModel.findById(productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            const alternatives = await sugarShieldService.getAlternatives(
                product.id,
                product.category,
                product.health_score
            );

            res.json({
                success: true,
                alternatives
            });
        } catch (error) {
            console.error('Get alternatives error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get alternatives',
                error: error.message
            });
        }
    }
};

module.exports = sugarShieldController;

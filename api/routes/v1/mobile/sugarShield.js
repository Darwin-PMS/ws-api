const express = require('express');
const router = express.Router();
const sugarShieldController = require('../../../controllers/sugarShieldController');
const { authenticateToken } = require('../../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// ==================== SCANNING ====================

// Scan a product by barcode
router.post('/scan', sugarShieldController.scanProduct);

// ==================== PRODUCTS ====================

// Search products
router.get('/products/search', sugarShieldController.searchProducts);

// Get products by category
router.get('/products/category/:category', sugarShieldController.getProductsByCategory);

// Get products by brand
router.get('/products/brand/:brand', sugarShieldController.getProductsByBrand);

// Get high sugar products
router.get('/products/high-sugar', sugarShieldController.getHighSugarProducts);

// Get hidden sugar products
router.get('/products/hidden-sugar', sugarShieldController.getHiddenSugarProducts);

// Get product details by ID
router.get('/product/:id', sugarShieldController.getProduct);

// ==================== CATEGORIES & BRANDS ====================

// Get all categories
router.get('/categories', sugarShieldController.getCategories);

// Get all brands
router.get('/brands', sugarShieldController.getBrands);

// ==================== HEALTH PROFILE ====================

// Get user health profile
router.get('/profile', sugarShieldController.getHealthProfile);

// Update user health profile
router.put('/profile', sugarShieldController.updateHealthProfile);

// ==================== HISTORY & STATS ====================

// Get scan history
router.get('/history', sugarShieldController.getScanHistory);

// Get today's scans
router.get('/history/today', sugarShieldController.getTodayScans);

// Get scan statistics
router.get('/stats', sugarShieldController.getScanStats);

// ==================== DASHBOARD ====================

// Get dashboard data
router.get('/dashboard', sugarShieldController.getDashboard);

// ==================== TRACKER ====================

// Get daily sugar tracker
router.get('/tracker/daily', sugarShieldController.getDailyTracker);

// Get weekly summary
router.get('/tracker/weekly', sugarShieldController.getWeeklySummary);

// Get monthly summary
router.get('/tracker/monthly', sugarShieldController.getMonthlySummary);

// ==================== ALTERNATIVES ====================

// Get healthy alternatives for a product
router.get('/alternatives/:productId', sugarShieldController.getAlternatives);

module.exports = router;

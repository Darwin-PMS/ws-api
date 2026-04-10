const express = require('express');
const router = express.Router();
const adminSugarShieldController = require('../../../controllers/adminSugarShieldController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ==================== PRODUCT MANAGEMENT ====================

// Get all products
router.get('/products', adminSugarShieldController.getAllProducts);

// Get product by ID
router.get('/products/:id', adminSugarShieldController.getProduct);

// Create new product
router.post('/products', adminSugarShieldController.createProduct);

// Update product
router.put('/products/:id', adminSugarShieldController.updateProduct);

// Delete product
router.delete('/products/:id', adminSugarShieldController.deleteProduct);

// Get product statistics
router.get('/stats', adminSugarShieldController.getProductStats);

// Get categories
router.get('/categories', adminSugarShieldController.getCategories);

// Get brands
router.get('/brands', adminSugarShieldController.getBrands);

// ==================== SCAN ANALYTICS ====================

// Get scan analytics
router.get('/analytics', adminSugarShieldController.getScanAnalytics);

// Get all scan logs
router.get('/scans', adminSugarShieldController.getAllScanLogs);

// Get tracker analytics
router.get('/tracker/analytics', adminSugarShieldController.getTrackerAnalytics);

module.exports = router;

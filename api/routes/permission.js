const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes (require authentication)
router.get('/', authenticateToken, permissionController.getCurrentPermissions);
router.get('/roles', authenticateToken, permissionController.getAllRoles);
router.post('/check', authenticateToken, permissionController.checkPermissions);
router.get('/template/:role', authenticateToken, permissionController.getRoleTemplate);

// Admin routes - User permissions
router.get('/users/:userId', authenticateToken, requireAdmin, permissionController.getUserPermissions);
router.put('/users/:userId', authenticateToken, requireAdmin, permissionController.updateUserPermissions);

// Admin routes - Role assignment
router.post('/assign-role/:userId', authenticateToken, requireAdmin, permissionController.assignRole);

// Area management routes
router.get('/areas', authenticateToken, permissionController.getAllAreas);
router.get('/areas/user/:userId', authenticateToken, permissionController.getUserAreas);
router.post('/areas/assign/:userId', authenticateToken, requireAdmin, permissionController.assignArea);

// SOS Case management routes
router.get('/sos-cases', authenticateToken, permissionController.getSOSCases);
router.put('/sos-cases/:caseId', authenticateToken, requireAdmin, permissionController.updateSOSCase);

module.exports = router;

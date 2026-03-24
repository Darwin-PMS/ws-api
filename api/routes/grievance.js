const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const grievanceController = require('../controllers/grievanceController');

// Public routes (for mobile app - no auth required)
router.get('/stats', grievanceController.getGrievanceStats);

// User route - create grievance (requires auth, user creates their own)
router.post('/', authenticateToken, grievanceController.createGrievance);

// User route - get their own grievances
router.get('/user/:user_id', authenticateToken, grievanceController.getUserGrievances);

// Admin routes (require admin role)
router.get('/', authenticateToken, authorizeRole(['admin']), grievanceController.getAllGrievances);
router.get('/:id', authenticateToken, authorizeRole(['admin']), grievanceController.getGrievanceById);
router.put('/:id/status', authenticateToken, authorizeRole(['admin']), grievanceController.updateGrievanceStatus);
router.put('/:id/assign', authenticateToken, authorizeRole(['admin']), grievanceController.assignGrievance);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), grievanceController.deleteGrievance);

module.exports = router;

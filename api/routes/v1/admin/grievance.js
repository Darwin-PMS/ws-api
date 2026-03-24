const express = require('express');
const grievanceController = require('../../../controllers/grievanceController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', grievanceController.getAllGrievances);
router.get('/stats', grievanceController.getGrievanceStats);
router.get('/:id', grievanceController.getGrievanceById);
router.put('/:id/status', grievanceController.updateGrievanceStatus);
router.put('/:id/assign', grievanceController.assignGrievance);
router.delete('/:id', grievanceController.deleteGrievance);

module.exports = router;

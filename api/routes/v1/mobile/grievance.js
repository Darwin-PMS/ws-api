const express = require('express');
const grievanceController = require('../../../controllers/grievanceController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, grievanceController.createGrievance);
router.get('/my', authenticateToken, grievanceController.getUserGrievancesByToken);

router.get('/:id/details', authenticateToken, grievanceController.getGrievanceWithMessages);
router.get('/:id/messages', authenticateToken, grievanceController.getGrievanceMessages);
router.post('/:id/messages', authenticateToken, grievanceController.addGrievanceMessage);
router.put('/:id', authenticateToken, grievanceController.updateGrievance);
router.get('/:id', authenticateToken, grievanceController.getGrievanceById);

module.exports = router;

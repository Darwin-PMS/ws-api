const express = require('express');
const grievanceController = require('../../../controllers/grievanceController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, grievanceController.createGrievance);
router.get('/my', authenticateToken, grievanceController.getUserGrievancesByToken);
router.get('/:id', authenticateToken, grievanceController.getGrievanceById);
router.put('/:id', authenticateToken, grievanceController.updateGrievance);

module.exports = router;

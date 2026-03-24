const express = require('express');
const grievanceController = require('../../../controllers/grievanceController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, grievanceController.createGrievance);
router.get('/my', authenticateToken, grievanceController.getUserGrievances);

module.exports = router;

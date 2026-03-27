const express = require('express');
const cylinderController = require('../../../controllers/cylinderController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/save', cylinderController.saveVerification);
router.get('/history', cylinderController.getHistory);
router.post('/verify', cylinderController.verifyCylinder);
router.delete('/:id', cylinderController.deleteVerification);

module.exports = router;

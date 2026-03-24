const express = require('express');
const router = express.Router();
const childcareController = require('../controllers/childcareController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Tips routes (public tips don't require auth, but we'll keep it consistent)
router.get('/tips', childcareController.getTips);
router.get('/tips/:tipId', childcareController.getTipById);

// Children routes (require authentication)
router.get('/children', childcareController.getChildren);
router.post('/children', childcareController.createChild);
router.get('/children/:childId', childcareController.getChildById);
router.put('/children/:childId', childcareController.updateChild);
router.delete('/children/:childId', childcareController.deleteChild);

module.exports = router;

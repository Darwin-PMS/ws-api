const express = require('express');
const safetyTutorialController = require('../../../controllers/safetyTutorialController');
const { optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, safetyTutorialController.getAllTutorials);
router.get('/:id', optionalAuth, safetyTutorialController.getTutorialById);
router.get('/categories', optionalAuth, safetyTutorialController.getCategories);

module.exports = router;

const express = require('express');
const safetyTutorialController = require('../../../controllers/safetyTutorialController');
const { optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/categories', optionalAuth, safetyTutorialController.getCategories);
router.get('/search', optionalAuth, safetyTutorialController.searchTutorials);
router.get('/category/:categoryId', optionalAuth, safetyTutorialController.getTutorialsByCategory);
router.get('/difficulty/:difficulty', optionalAuth, safetyTutorialController.getTutorialsByDifficulty);
router.get('/:id', optionalAuth, safetyTutorialController.getTutorialById);
router.get('/', optionalAuth, safetyTutorialController.getAllTutorials);

module.exports = router;

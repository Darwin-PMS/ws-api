const express = require('express');
const router = express.Router();
const safetyTutorialController = require('../controllers/safetyTutorialController');

// Get all tutorials
router.get('/', safetyTutorialController.getAllTutorials);

// Get single tutorial by ID
router.get('/:id', safetyTutorialController.getTutorialById);

// Create new tutorial
router.post('/', safetyTutorialController.createTutorial);

// Update tutorial
router.put('/:id', safetyTutorialController.updateTutorial);

// Delete tutorial (soft delete)
router.delete('/:id', safetyTutorialController.deleteTutorial);

// Get all unique categories
router.get('/categories', safetyTutorialController.getCategories);

module.exports = router;

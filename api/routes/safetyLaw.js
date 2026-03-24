const express = require('express');
const router = express.Router();
const safetyLawController = require('../controllers/safetyLawController');

// Get all laws
router.get('/', safetyLawController.getAllLaws);

// Get single law by ID
router.get('/:id', safetyLawController.getLawById);

// Create new law
router.post('/', safetyLawController.createLaw);

// Update law
router.put('/:id', safetyLawController.updateLaw);

// Delete law (soft delete)
router.delete('/:id', safetyLawController.deleteLaw);

// Get all unique categories
router.get('/categories', safetyLawController.getCategories);

// Get all unique jurisdictions
router.get('/jurisdictions', safetyLawController.getJurisdictions);

module.exports = router;

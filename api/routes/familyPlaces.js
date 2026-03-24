// Family Places Routes - Express router for family places management endpoints

const express = require('express');
const familyPlaceController = require('../controllers/familyPlaceController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ==================== PLACE CRUD ====================

// Create a new place for a family
router.post('/:familyId/places', familyPlaceController.createPlace);

// Get all places for a family
router.get('/:familyId/places', familyPlaceController.getFamilyPlaces);

// Get specific place
router.get('/:familyId/places/:placeId', familyPlaceController.getPlaceById);

// Update place
router.put('/:familyId/places/:placeId', familyPlaceController.updatePlace);

// Delete (deactivate) place
router.delete('/:familyId/places/:placeId', familyPlaceController.deletePlace);

// ==================== GEOFENCING ====================

// Check if location is inside any family place
router.post('/:familyId/places/check', familyPlaceController.checkLocation);

// Find nearest family place
router.post('/:familyId/places/nearest', familyPlaceController.findNearestPlace);

module.exports = router;

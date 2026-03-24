const express = require('express');
const familyPlaceController = require('../../../controllers/familyPlaceController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.post('/:familyId/places', authenticateToken, familyPlaceController.createPlace);
router.get('/:familyId/places', authenticateToken, familyPlaceController.getFamilyPlaces);
router.put('/:familyId/places/:placeId', authenticateToken, familyPlaceController.updatePlace);
router.delete('/:familyId/places/:placeId', authenticateToken, familyPlaceController.deletePlace);
router.post('/:familyId/places/check', authenticateToken, familyPlaceController.checkLocation);
router.post('/:familyId/places/nearest', authenticateToken, familyPlaceController.findNearestPlace);

module.exports = router;

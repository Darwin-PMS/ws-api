const express = require('express');
const familyController = require('../../../controllers/familyController');
const familyLocationController = require('../../../controllers/familyLocationController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, familyController.getMyFamilies);
router.post('/', authenticateToken, familyController.createFamily);
router.get('/:familyId', authenticateToken, familyController.getFamilyById);
router.put('/:familyId', authenticateToken, familyController.updateFamily);
router.delete('/:familyId', authenticateToken, familyController.deleteFamily);

router.get('/:familyId/members', authenticateToken, familyController.getFamilyMembers);
router.post('/:familyId/members', authenticateToken, familyController.addMember);
router.delete('/:familyId/members/:userId', authenticateToken, familyController.removeMember);
router.put('/:familyId/members/:userId/role', authenticateToken, familyController.updateMemberRole);

router.get('/:familyId/relationships', authenticateToken, familyController.getRelationships);
router.post('/:familyId/relationships', authenticateToken, familyController.addRelationship);
router.delete('/:familyId/relationships/:id', authenticateToken, familyController.removeRelationship);

router.get('/users/lookup/:email', authenticateToken, familyController.findUserByEmail);

router.get('/:familyId/locations', authenticateToken, familyLocationController.getFamilyLocations);
router.get('/:familyId/members/:userId/location', authenticateToken, familyLocationController.getMemberLocation);

module.exports = router;

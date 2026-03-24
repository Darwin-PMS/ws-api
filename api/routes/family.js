// Family Routes - Express router for family management endpoints

const express = require('express');
const familyController = require('../controllers/familyController');
const familyLocationController = require('../controllers/familyLocationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ==================== FAMILY CRUD ====================

// Create a new family (caller becomes head)
router.post('/', familyController.createFamily);

// List my families
router.get('/', familyController.getMyFamilies);

// Get family details (must be member)
router.get('/:familyId', familyController.getFamilyById);

// Update family name/description (head only)
router.put('/:familyId', familyController.updateFamily);

// Delete family (head only)
router.delete('/:familyId', familyController.deleteFamily);

// ==================== FAMILY MEMBERS ====================

// List family members (must be member)
router.get('/:familyId/members', familyController.getFamilyMembers);

// Add a member by email (head only)
router.post('/:familyId/members', familyController.addMember);

// Remove member (head only, cannot remove self)
router.delete('/:familyId/members/:userId', familyController.removeMember);

// Transfer head role (head only)
router.put('/:familyId/members/:userId/role', familyController.updateMemberRole);

// ==================== RELATIONSHIPS ====================

// List relationships (must be member)
router.get('/:familyId/relationships', familyController.getRelationships);

// Add relationship (head only)
router.post('/:familyId/relationships', familyController.addRelationship);

// Remove relationship (head only)
router.delete('/:familyId/relationships/:relId', familyController.removeRelationship);

// ==================== LOCATION TRACKING ====================

// Get all family member locations (must be member)
router.get('/:familyId/locations', familyLocationController.getFamilyLocations);

// Get specific member location (must be member)
router.get('/:familyId/members/:userId/location', familyLocationController.getMemberLocation);

// ==================== USER LOOKUP ====================

// Find user by email (head only - for adding members)
router.get('/users/lookup/:email', familyController.findUserByEmail);

module.exports = router;

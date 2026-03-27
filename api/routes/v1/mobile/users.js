const express = require('express');
const userController = require('../../../controllers/userController');
const emergencyContactController = require('../../../controllers/emergencyContactController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/:id', authenticateToken, userController.getProfile);
router.put('/:id', authenticateToken, userController.updateProfile);
router.get('/:id/role', authenticateToken, userController.getRole);

router.get('/emergency-contacts/all', authenticateToken, emergencyContactController.getAllEmergencyContacts);
router.get('/emergency-contacts/default', authenticateToken, emergencyContactController.getDefaultContacts);
router.get('/emergency-contacts/preferences', authenticateToken, emergencyContactController.getUserPreferences);
router.put('/emergency-contacts/preferences', authenticateToken, emergencyContactController.updateUserPreferences);

router.get('/support-team', authenticateToken, userController.getSupportTeam);
router.get('/emergency-contacts/all-with-support', authenticateToken, emergencyContactController.getAllEmergencyContactsWithSupport);

router.get('/:id/emergency-contacts', authenticateToken, userController.getEmergencyContacts);
router.post('/:id/emergency-contacts', authenticateToken, userController.addEmergencyContact);
router.put('/:id/emergency-contacts/:contactId', authenticateToken, emergencyContactController.updateUserContact);
router.delete('/:id/emergency-contacts/:contactId', authenticateToken, emergencyContactController.deleteUserContact);

router.post('/:id/locations', authenticateToken, userController.saveLocation);
router.get('/:id/locations', authenticateToken, userController.getLocationHistory);
router.get('/:id/sos-alerts', authenticateToken, userController.getSOSAlerts);

router.get('/:id/notifications', authenticateToken, userController.getNotifications);
router.put('/:userId/notifications/:notificationId/read', authenticateToken, userController.markNotificationRead);

router.get('/:id/children', authenticateToken, userController.getChildren);
router.post('/:id/children', authenticateToken, userController.addChild);

router.get('/:id/settings', authenticateToken, userController.getSettings);
router.put('/:id/settings', authenticateToken, userController.updateSettings);

module.exports = router;

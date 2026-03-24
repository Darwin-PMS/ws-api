const express = require('express');
const userController = require('../controllers/userController');
const emergencyContactController = require('../controllers/emergencyContactController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// User profile
router.get('/:id', authenticateToken, userController.getProfile);
router.put('/:id', authenticateToken, userController.updateProfile);
router.get('/:id/role', authenticateToken, userController.getRole);

// ==============================================
// EMERGENCY CONTACTS - Default + User-specific
// ==============================================

// Get all emergency contacts (default + user-specific)
router.get('/emergency-contacts/all', authenticateToken, emergencyContactController.getAllEmergencyContacts);

// Get default emergency contacts only
router.get('/emergency-contacts/default', authenticateToken, emergencyContactController.getDefaultContacts);

// Get user emergency preferences
router.get('/emergency-contacts/preferences', authenticateToken, emergencyContactController.getUserPreferences);
router.put('/emergency-contacts/preferences', authenticateToken, emergencyContactController.updateUserPreferences);

// Legacy routes (user-specific only)
router.get('/:id/emergency-contacts', authenticateToken, userController.getEmergencyContacts);
router.post('/:id/emergency-contacts', authenticateToken, userController.addEmergencyContact);
router.put('/:id/emergency-contacts/:contactId', authenticateToken, emergencyContactController.updateUserContact);
router.delete('/:id/emergency-contacts/:contactId', authenticateToken, emergencyContactController.deleteUserContact);

// Location
router.post('/:id/locations', authenticateToken, userController.saveLocation);
router.get('/:id/locations', authenticateToken, userController.getLocationHistory);

// SOS Alerts
router.get('/:id/sos-alerts', authenticateToken, userController.getSOSAlerts);

// Notifications
router.get('/:id/notifications', authenticateToken, userController.getNotifications);
router.put('/:userId/notifications/:notificationId/read', authenticateToken, userController.markNotificationRead);

// Children
router.get('/:id/children', authenticateToken, userController.getChildren);
router.post('/:id/children', authenticateToken, userController.addChild);

// Settings
router.get('/:id/settings', authenticateToken, userController.getSettings);
router.put('/:id/settings', authenticateToken, userController.updateSettings);

module.exports = router;

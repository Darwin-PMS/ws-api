const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');

const userController = {
    // Get user profile
    async getProfile(req, res) {
        try {
            const user = await userModel.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            // Convert snake_case to camelCase for frontend
            const formattedUser = {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerified: user.is_verified,
                isActive: user.is_active,
                createdAt: user.created_at
            };
            res.json({ success: true, user: formattedUser });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ success: false, message: 'Failed to get user' });
        }
    },

    // Update user profile
    async updateProfile(req, res) {
        try {
            const { firstName, lastName, phone } = req.body;
            await userModel.update(req.params.id, { firstName, lastName, phone });
            res.json({ success: true, message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    },

    // Get user role
    async getRole(req, res) {
        try {
            const role = await userModel.getRole(req.params.id);
            if (!role) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, role });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get role' });
        }
    },

    // ==================== EMERGENCY CONTACTS ====================

    // Get emergency contacts
    async getEmergencyContacts(req, res) {
        try {
            const pool = getPool();
            const [contacts] = await pool.query(
                'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC',
                [req.params.id]
            );
            res.json({ success: true, contacts });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get contacts' });
        }
    },

    // Add emergency contact
    async addEmergencyContact(req, res) {
        try {
            const { name, phone, relationship, isPrimary } = req.body;
            const pool = getPool();
            const contactId = uuidv4();

            await pool.query(
                'INSERT INTO emergency_contacts (id, user_id, name, phone, relationship, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
                [contactId, req.params.id, name, phone, relationship, isPrimary || false]
            );

            res.status(201).json({ success: true, message: 'Contact added', id: contactId });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add contact' });
        }
    },

    // Delete emergency contact
    async deleteEmergencyContact(req, res) {
        try {
            const pool = getPool();
            await pool.query('DELETE FROM emergency_contacts WHERE id = ?', [req.params.contactId]);
            res.json({ success: true, message: 'Contact deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete contact' });
        }
    },

    // ==================== LOCATION ====================

    // Save location
    async saveLocation(req, res) {
        try {
            const { latitude, longitude, accuracy, status, address, speed, heading } = req.body;
            console.log('📍 API: Saving location for user:', req.params.id, { latitude, longitude, accuracy, status, speed, heading });
            
            const pool = getPool();
            const locationId = uuidv4();

            // Save to user_locations table (main tracking table)
            await pool.query(
                `INSERT INTO user_locations (id, user_id, latitude, longitude, status, address, speed, heading, accuracy, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [locationId, req.params.id, latitude, longitude, status || 'safe', address || null, speed || 0, heading || 0, accuracy]
            );

            // Also save to location_history for mobile app history
            const historyId = uuidv4();
            await pool.query(
                'INSERT INTO location_history (id, user_id, latitude, longitude, accuracy) VALUES (?, ?, ?, ?, ?)',
                [historyId, req.params.id, latitude, longitude, accuracy]
            );

            // Update user_current_location for quick access
            const currentLocationId = uuidv4();
            await pool.query(
                `INSERT INTO user_current_location (id, user_id, latitude, longitude, accuracy) 
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), accuracy = VALUES(accuracy), updated_at = NOW()`,
                [currentLocationId, req.params.id, latitude, longitude, accuracy]
            );

            console.log('📍 API: Location saved successfully to user_locations');
            res.status(201).json({ success: true, id: locationId, message: 'Location saved' });
        } catch (error) {
            console.error('📍 API: Save location error:', error);
            res.status(500).json({ success: false, message: 'Failed to save location' });
        }
    },

    // Get location history
    async getLocationHistory(req, res) {
        try {
            const pool = getPool();
            const { limit = 100 } = req.query;

            // First try user_locations table, fallback to location_history
            let locations;
            try {
                [locations] = await pool.query(
                    'SELECT * FROM user_locations WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
                    [req.params.id, parseInt(limit)]
                );
            } catch (tableError) {
                // Fallback to location_history if user_locations doesn't exist
                [locations] = await pool.query(
                    'SELECT * FROM location_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
                    [req.params.id, parseInt(limit)]
                );
            }

            res.json({ success: true, locations });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get locations' });
        }
    },

    // ==================== NOTIFICATIONS ====================

    // Get notifications
    async getNotifications(req, res) {
        try {
            const pool = getPool();
            const [notifications] = await pool.query(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                [req.params.id]
            );
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get notifications' });
        }
    },

    // Mark notification as read
    async markNotificationRead(req, res) {
        try {
            const pool = getPool();
            await pool.query(
                'UPDATE notifications SET is_read = TRUE WHERE id = ?',
                [req.params.notificationId]
            );
            res.json({ success: true, message: 'Notification marked as read' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update notification' });
        }
    },

    // ==================== SOS ALERTS ====================

    // Get SOS alerts
    async getSOSAlerts(req, res) {
        try {
            const pool = getPool();
            const [alerts] = await pool.query(
                'SELECT * FROM sos_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                [req.params.id]
            );
            res.json({ success: true, alerts });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get SOS alerts' });
        }
    },

    // ==================== CHILDREN ====================

    // Get children
    async getChildren(req, res) {
        try {
            const pool = getPool();
            const [children] = await pool.query(
                'SELECT * FROM children WHERE parent_id = ?',
                [req.params.id]
            );
            res.json({ success: true, children });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get children' });
        }
    },

    // Add child
    async addChild(req, res) {
        try {
            const { name, dateOfBirth, gender, notes } = req.body;
            const pool = getPool();
            const childId = uuidv4();

            await pool.query(
                'INSERT INTO children (id, parent_id, name, date_of_birth, gender, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [childId, req.params.id, name, dateOfBirth, gender, notes]
            );

            res.status(201).json({ success: true, id: childId });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add child' });
        }
    },

    // ==================== SETTINGS ====================

    // Get settings
    async getSettings(req, res) {
        try {
            const pool = getPool();
            const [settings] = await pool.query(
                'SELECT * FROM user_settings WHERE user_id = ?',
                [req.params.id]
            );

            if (settings.length === 0) {
                const newSettings = { id: uuidv4(), user_id: req.params.id };
                await pool.query(
                    'INSERT INTO user_settings (id, user_id) VALUES (?, ?)',
                    [newSettings.id, req.params.id]
                );
                return res.json({ success: true, settings: newSettings });
            }

            res.json({ success: true, settings: settings[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get settings' });
        }
    },

    // Update settings
    async updateSettings(req, res) {
        try {
            const body = req.body;
            
            const notificationEnabled = body.notificationEnabled ?? body.notification_enabled;
            const locationSharing = body.locationSharing ?? body.location_sharing;
            const autoSOS = body.autoSOS ?? body.auto_sos;
            const shakeToSOS = body.shakeToSOS ?? body.shake_to_sos;
            const sosTimer = body.sosTimer ?? body.sos_timer;
            const shakeSensitivity = body.shakeSensitivity ?? body.shake_sensitivity;
            const volumePressEnabled = body.volumePressEnabled ?? body.volume_press_enabled;
            const powerPressEnabled = body.powerPressEnabled ?? body.power_press_enabled;
            const voiceEnabled = body.voiceEnabled ?? body.voice_enabled;
            const autoSOSEnabled = body.autoSOSEnabled ?? body.auto_sos_enabled;
            const locationEnabled = body.locationEnabled ?? body.location_enabled;
            const familyAgentEnabled = body.familyAgentEnabled ?? body.family_agent_enabled;
            
            const pool = getPool();

            const [existing] = await pool.query('SELECT id FROM user_settings WHERE user_id = ?', [req.params.id]);

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO user_settings (id, user_id, notification_enabled, location_sharing, auto_sos, shake_to_sos, sos_timer, shake_sensitivity, volume_press_enabled, power_press_enabled, voice_enabled, auto_sos_enabled, location_enabled, family_agent_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), req.params.id, notificationEnabled, locationSharing, autoSOS, shakeToSOS, sosTimer, shakeSensitivity || 3, volumePressEnabled || false, powerPressEnabled || false, voiceEnabled || false, autoSOSEnabled || false, locationEnabled !== undefined ? locationEnabled : false, familyAgentEnabled !== undefined ? familyAgentEnabled : true]
                );
            } else {
                await pool.query(
                    'UPDATE user_settings SET notification_enabled = ?, location_sharing = ?, auto_sos = ?, shake_to_sos = ?, sos_timer = ?, shake_sensitivity = ?, volume_press_enabled = ?, power_press_enabled = ?, voice_enabled = ?, auto_sos_enabled = ?, location_enabled = ?, family_agent_enabled = ? WHERE user_id = ?',
                    [notificationEnabled, locationSharing, autoSOS, shakeToSOS, sosTimer, shakeSensitivity || 3, volumePressEnabled || false, powerPressEnabled || false, voiceEnabled || false, autoSOSEnabled || false, locationEnabled !== undefined ? locationEnabled : false, familyAgentEnabled !== undefined ? familyAgentEnabled : true, req.params.id]
                );
            }

            const [updatedSettings] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [req.params.id]);
            res.json({ success: true, message: 'Settings updated', settings: updatedSettings[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update settings' });
        }
    }
};

module.exports = userController;

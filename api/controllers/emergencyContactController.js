const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const emergencyContactController = {
    /**
     * Get all emergency contacts for a user
     * Includes both default (system-wide) and user-specific contacts
     */
    async getAllEmergencyContacts(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            // Get default emergency contacts
            const [defaultContacts] = await pool.query(
                'SELECT * FROM default_emergency_contacts WHERE is_active = TRUE ORDER BY display_order'
            );

            // Get user-specific emergency contacts
            const [userContacts] = await pool.query(
                'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
                [userId]
            );

            // Get user's emergency preferences
            const [preferences] = await pool.query(
                'SELECT * FROM user_emergency_preferences WHERE user_id = ?',
                [userId]
            );

            res.json({
                success: true,
                data: {
                    defaultContacts: defaultContacts.map(c => ({
                        id: c.id,
                        name: c.name,
                        phone: c.phone,
                        description: c.description,
                        serviceType: c.service_type,
                        icon: c.icon,
                        source: 'default',
                    })),
                    userContacts: userContacts.map(c => ({
                        id: c.id,
                        name: c.name,
                        phone: c.phone,
                        relationship: c.relationship,
                        isPrimary: c.is_primary,
                        notes: c.notes,
                        contactType: c.contact_type,
                        source: 'user',
                    })),
                    preferences: preferences.length > 0 ? preferences[0] : null,
                },
            });
        } catch (error) {
            console.error('Get emergency contacts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get emergency contacts',
            });
        }
    },

    /**
     * Get default emergency contacts only
     */
    async getDefaultContacts(req, res) {
        try {
            const pool = getPool();

            const [contacts] = await pool.query(
                'SELECT * FROM default_emergency_contacts WHERE is_active = TRUE ORDER BY display_order'
            );

            res.json({
                success: true,
                data: contacts.map(c => ({
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    description: c.description,
                    serviceType: c.service_type,
                    icon: c.icon,
                })),
            });
        } catch (error) {
            console.error('Get default contacts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get default contacts',
            });
        }
    },

    /**
     * Add user-specific emergency contact
     */
    async addUserContact(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { name, phone, relationship, isPrimary, notes, contactType } = req.body;

            if (!name || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and phone are required',
                });
            }

            const contactId = uuidv4();

            // If this is marked as primary, unset other primary contacts
            if (isPrimary) {
                await pool.query(
                    'UPDATE emergency_contacts SET is_primary = FALSE WHERE user_id = ?',
                    [userId]
                );
            }

            await pool.query(
                `INSERT INTO emergency_contacts 
                 (id, user_id, name, phone, relationship, is_primary, notes, contact_type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [contactId, userId, name, phone, relationship, isPrimary || false, notes, contactType || 'personal']
            );

            res.status(201).json({
                success: true,
                message: 'Emergency contact added',
                data: {
                    id: contactId,
                    name,
                    phone,
                    relationship,
                    isPrimary,
                    notes,
                    contactType,
                },
            });
        } catch (error) {
            console.error('Add emergency contact error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add emergency contact',
            });
        }
    },

    /**
     * Update user emergency contact
     */
    async updateUserContact(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { contactId } = req.params;
            const { name, phone, relationship, isPrimary, notes, contactType } = req.body;

            // Check if contact belongs to user
            const [contacts] = await pool.query(
                'SELECT * FROM emergency_contacts WHERE id = ? AND user_id = ?',
                [contactId, userId]
            );

            if (contacts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact not found',
                });
            }

            // If this is marked as primary, unset other primary contacts
            if (isPrimary) {
                await pool.query(
                    'UPDATE emergency_contacts SET is_primary = FALSE WHERE user_id = ? AND id != ?',
                    [userId, contactId]
                );
            }

            await pool.query(
                `UPDATE emergency_contacts 
                 SET name = ?, phone = ?, relationship = ?, is_primary = ?, notes = ?, contact_type = ?
                 WHERE id = ?`,
                [name, phone, relationship, isPrimary || false, notes, contactType || 'personal', contactId]
            );

            res.json({
                success: true,
                message: 'Emergency contact updated',
            });
        } catch (error) {
            console.error('Update emergency contact error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update emergency contact',
            });
        }
    },

    /**
     * Delete user emergency contact
     */
    async deleteUserContact(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { contactId } = req.params;

            const result = await pool.query(
                'DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?',
                [contactId, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Contact not found',
                });
            }

            res.json({
                success: true,
                message: 'Emergency contact deleted',
            });
        } catch (error) {
            console.error('Delete emergency contact error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete emergency contact',
            });
        }
    },

    /**
     * Get or update user emergency preferences
     */
    async getUserPreferences(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            const [preferences] = await pool.query(
                'SELECT * FROM user_emergency_preferences WHERE user_id = ?',
                [userId]
            );

            if (preferences.length === 0) {
                // Create default preferences
                const prefId = uuidv4();
                await pool.query(
                    `INSERT INTO user_emergency_preferences 
                     (id, user_id, enable_sos, auto_share_location, notify_emergency_contacts, sos_sound_enabled, sos_vibration_enabled, emergency_message) 
                     VALUES (?, ?, TRUE, FALSE, TRUE, TRUE, TRUE, 'I need help! Please contact me or emergency services.')`,
                    [prefId, userId]
                );

                return res.json({
                    success: true,
                    data: {
                        id: prefId,
                        userId,
                        enableSos: true,
                        autoShareLocation: false,
                        notifyEmergencyContacts: true,
                        sosSoundEnabled: true,
                        sosVibrationEnabled: true,
                        emergencyMessage: 'I need help! Please contact me or emergency services.',
                    },
                });
            }

            const pref = preferences[0];
            res.json({
                success: true,
                data: {
                    id: pref.id,
                    userId: pref.user_id,
                    enableSos: pref.enable_sos,
                    autoShareLocation: pref.auto_share_location,
                    notifyEmergencyContacts: pref.notify_emergency_contacts,
                    sosSoundEnabled: pref.sos_sound_enabled,
                    sosVibrationEnabled: pref.sos_vibration_enabled,
                    emergencyMessage: pref.emergency_message,
                },
            });
        } catch (error) {
            console.error('Get user preferences error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get preferences',
            });
        }
    },

    async updateUserPreferences(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const {
                enableSos,
                autoShareLocation,
                notifyEmergencyContacts,
                sosSoundEnabled,
                sosVibrationEnabled,
                emergencyMessage
            } = req.body;

            // Check if preferences exist
            const [existing] = await pool.query(
                'SELECT * FROM user_emergency_preferences WHERE user_id = ?',
                [userId]
            );

            if (existing.length === 0) {
                // Create new preferences
                const prefId = uuidv4();
                await pool.query(
                    `INSERT INTO user_emergency_preferences 
                     (id, user_id, enable_sos, auto_share_location, notify_emergency_contacts, sos_sound_enabled, sos_vibration_enabled, emergency_message) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [prefId, userId, enableSos, autoShareLocation, notifyEmergencyContacts, sosSoundEnabled, sosVibrationEnabled, emergencyMessage]
                );
            } else {
                // Update existing preferences
                await pool.query(
                    `UPDATE user_emergency_preferences 
                     SET enable_sos = ?, auto_share_location = ?, notify_emergency_contacts = ?, 
                         sos_sound_enabled = ?, sos_vibration_enabled = ?, emergency_message = ?
                     WHERE user_id = ?`,
                    [enableSos, autoShareLocation, notifyEmergencyContacts, sosSoundEnabled, sosVibrationEnabled, emergencyMessage, userId]
                );
            }

            res.json({
                success: true,
                message: 'Preferences updated',
            });
        } catch (error) {
            console.error('Update preferences error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update preferences',
            });
        }
    },

    async getAllEmergencyContactsWithSupport(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            const [defaultContacts] = await pool.query(
                'SELECT * FROM default_emergency_contacts WHERE is_active = TRUE ORDER BY display_order'
            );

            const [userContacts] = await pool.query(
                'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
                [userId]
            );

            const [supportTeam] = await pool.query(
                `SELECT * FROM users 
                 WHERE role LIKE '%admin%' OR role LIKE '%support%' OR role LIKE '%responder%' OR role LIKE '%supervisor%'
                 ORDER BY first_name ASC`
            );

            console.log('Support team found:', supportTeam.length);

            const userContactsWithUserId = await Promise.all(userContacts.map(async (c) => {
                let linkedUserId = null;
                let isAppUser = false;
                
                const cleanPhone = (c.phone || '').replace(/[^\d]/g, '');
                if (cleanPhone.length >= 10) {
                    const [users] = await pool.query(
                        `SELECT id FROM users WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '(', ''), ')', '') LIKE ? LIMIT 1`,
                        [`%${cleanPhone.slice(-10)}%`]
                    );
                    if (users.length > 0) {
                        linkedUserId = users[0].id;
                        isAppUser = true;
                    }
                }
                
                return {
                    id: c.id,
                    userId: linkedUserId,
                    name: c.name,
                    phone: c.phone,
                    relationship: c.relationship,
                    isPrimary: c.is_primary,
                    notes: c.notes,
                    contactType: c.contact_type,
                    source: 'user',
                    isAppUser: isAppUser,
                };
            }));

            res.json({
                success: true,
                data: {
                    defaultContacts: defaultContacts.map(c => ({
                        id: c.id,
                        name: c.name,
                        phone: c.phone,
                        description: c.description,
                        serviceType: c.service_type,
                        icon: c.icon,
                        source: 'default',
                    })),
                    userContacts: userContactsWithUserId,
                    supportTeam: supportTeam.map(s => ({
                        id: s.id,
                        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
                        firstName: s.first_name,
                        lastName: s.last_name,
                        email: s.email,
                        phone: s.phone,
                        role: s.role,
                        source: 'support',
                    })),
                },
            });
        } catch (error) {
            console.error('Get all emergency contacts with support error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get emergency contacts',
            });
        }
    },
};

module.exports = emergencyContactController;

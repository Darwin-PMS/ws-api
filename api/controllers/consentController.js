// Consent Controller - API endpoints for consent and privacy settings

const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const consentController = {
    // Get user's consent settings
    async getConsentSettings(req, res) {
        try {
            const userId = req.user.id;

            const pool = getPool();
            const [settings] = await pool.query(
                'SELECT * FROM consent_settings WHERE user_id = ?',
                [userId]
            );

            if (settings.length === 0) {
                // Create default settings if none exist
                const newSettings = await this.createDefaultConsentSettings(userId);
                return res.status(200).json({
                    success: true,
                    settings: newSettings
                });
            }

            res.status(200).json({
                success: true,
                settings: settings[0]
            });
        } catch (error) {
            console.error('Get consent settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get consent settings'
            });
        }
    },

    // Update consent settings
    async updateConsentSettings(req, res) {
        try {
            const userId = req.user.id;
            const {
                locationEnabled,
                activityEnabled,
                calendarEnabled,
                analyticsEnabled,
                familyAgentEnabled,
                quietHoursStart,
                quietHoursEnd
            } = req.body;

            const pool = getPool();

            // Check if settings exist
            const [existing] = await pool.query(
                'SELECT id FROM consent_settings WHERE user_id = ?',
                [userId]
            );

            if (existing.length === 0) {
                // Create default settings first
                await this.createDefaultConsentSettings(userId);
            }

            // Build update query
            const updates = [];
            const params = [];

            if (locationEnabled !== undefined) {
                updates.push('location_enabled = ?');
                params.push(locationEnabled);
            }
            if (activityEnabled !== undefined) {
                updates.push('activity_enabled = ?');
                params.push(activityEnabled);
            }
            if (calendarEnabled !== undefined) {
                updates.push('calendar_enabled = ?');
                params.push(calendarEnabled);
            }
            if (analyticsEnabled !== undefined) {
                updates.push('analytics_enabled = ?');
                params.push(analyticsEnabled);
            }
            if (familyAgentEnabled !== undefined) {
                updates.push('family_agent_enabled = ?');
                params.push(familyAgentEnabled);
            }
            if (quietHoursStart !== undefined) {
                updates.push('quiet_hours_start = ?');
                params.push(quietHoursStart);
            }
            if (quietHoursEnd !== undefined) {
                updates.push('quiet_hours_end = ?');
                params.push(quietHoursEnd);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            params.push(userId);
            await pool.query(
                `UPDATE consent_settings SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
                params
            );

            // Also update user_settings for backward compatibility
            await this.updateUserSettings(userId, {
                locationEnabled,
                familyAgentEnabled
            });

            // Log audit
            await this.logAudit(userId, 'consent_settings_updated', 'consent_settings', null, { updatedFields: Object.keys(req.body) });

            // Get updated settings
            const [updated] = await pool.query(
                'SELECT * FROM consent_settings WHERE user_id = ?',
                [userId]
            );

            res.status(200).json({
                success: true,
                message: 'Consent settings updated successfully',
                settings: updated[0]
            });
        } catch (error) {
            console.error('Update consent settings error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update consent settings'
            });
        }
    },

    // Create default consent settings
    async createDefaultConsentSettings(userId) {
        const pool = getPool();
        const settingsId = uuidv4();

        await pool.query(
            `INSERT INTO consent_settings 
            (id, user_id, location_enabled, activity_enabled, calendar_enabled, analytics_enabled, family_agent_enabled) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [settingsId, userId, false, false, false, false, true]
        );

        const [settings] = await pool.query(
            'SELECT * FROM consent_settings WHERE id = ?',
            [settingsId]
        );

        return settings[0];
    },

    // Update user_settings table for backward compatibility
    async updateUserSettings(userId, settings) {
        const pool = getPool();
        const updates = [];
        const params = [];

        if (settings.locationEnabled !== undefined) {
            updates.push('location_enabled = ?');
            params.push(settings.locationEnabled);
        }
        if (settings.familyAgentEnabled !== undefined) {
            updates.push('family_agent_enabled = ?');
            params.push(settings.familyAgentEnabled);
        }

        if (updates.length > 0) {
            params.push(userId);
            await pool.query(
                `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
                params
            );
        }
    },

    // Log audit action
    async logAudit(userId, action, targetType, targetId, metadata) {
        const pool = getPool();
        const auditId = uuidv4();

        await pool.query(
            `INSERT INTO audit_logs (id, user_id, action, target_type, target_id, metadata) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [auditId, userId, action, targetType, targetId, JSON.stringify(metadata || {})]
        );
    },

    // Get audit logs for user
    async getAuditLogs(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 50, offset = 0 } = req.query;

            const pool = getPool();
            const [logs] = await pool.query(
                'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [userId, parseInt(limit), parseInt(offset)]
            );

            res.status(200).json({
                success: true,
                logs
            });
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get audit logs'
            });
        }
    }
};

module.exports = consentController;

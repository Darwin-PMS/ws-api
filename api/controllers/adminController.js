const { getPool } = require('../config/db');
const userModel = require('../models/userModel');
const familyModel = require('../models/familyModel');
const homeAutomationModel = require('../models/homeAutomationModel');
const notificationService = require('../services/notification');

const adminController = {
    // Get all users
    async getAllUsers(req, res) {
        try {
            const { limit = 50, offset = 0, role } = req.query;
            const result = await userModel.getAll({ limit, offset, role });
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get users' });
        }
    },

    // Get stats
    async getStats(req, res) {
        try {
            const pool = getPool();

            const [[totalUsers]] = await pool.query('SELECT COUNT(*) as count FROM users');
            const [[women]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'woman'");
            const [[parents]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'parent'");
            const [[guardians]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'guardian'");
            const [[activeAlerts]] = await pool.query("SELECT COUNT(*) as count FROM sos_alerts WHERE status = 'active'");

            res.json({
                success: true,
                stats: {
                    totalUsers: totalUsers.count,
                    women: women.count,
                    parents: parents.count,
                    guardians: guardians.count,
                    activeSOS: activeAlerts.count
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get stats' });
        }
    },

    // Get user by ID
    async getUserById(req, res) {
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
            res.status(500).json({ success: false, message: 'Failed to get user' });
        }
    },

    // Update user
    async updateUser(req, res) {
        try {
            const { firstName, lastName, phone, role, isActive } = req.body;
            await userModel.update(req.params.id, { firstName, lastName, phone, role, isActive });
            res.json({ success: true, message: 'User updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    },

    // Delete user
    async deleteUser(req, res) {
        try {
            const pool = getPool();
            await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete user' });
        }
    },

    // Get all SOS alerts
    async getAllSOSAlerts(req, res) {
        try {
            const pool = getPool();
            const { limit = 50, offset = 0, status } = req.query;
            let query = 'SELECT * FROM sos_alerts';
            const params = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [alerts] = await pool.query(query, params);
            res.json({ success: true, alerts });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get SOS alerts' });
        }
    },

    // Get SOS alert by ID
    async getSOSAlertById(req, res) {
        try {
            const pool = getPool();
            const [alerts] = await pool.query('SELECT * FROM sos_alerts WHERE id = ?', [req.params.id]);

            if (alerts.length === 0) {
                return res.status(404).json({ success: false, message: 'SOS alert not found' });
            }

            res.json({ success: true, alert: alerts[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get SOS alert' });
        }
    },

    // Resolve SOS alert
    async resolveSOSAlert(req, res) {
        try {
            const pool = getPool();
            await pool.query(
                'UPDATE sos_alerts SET status = ?, resolved_at = NOW() WHERE id = ?',
                ['resolved', req.params.id]
            );
            res.json({ success: true, message: 'SOS alert resolved' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to resolve SOS alert' });
        }
    },

    // Get activity logs
    async getActivityLogs(req, res) {
        try {
            const pool = getPool();
            const { limit = 50, offset = 0, action, search } = req.query;

            let query = 'SELECT * FROM activity_logs WHERE 1=1';
            const params = [];

            if (action) {
                query += ' AND action = ?';
                params.push(action);
            }

            if (search) {
                query += ' AND (user_id LIKE ? OR description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [logs] = await pool.query(query, params);
            res.json({ success: true, logs });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get activity logs' });
        }
    },

    // Get all families (admin view)
    async getAllFamilies(req, res) {
        try {
            const pool = getPool();
            const { limit = 50, offset = 0, search, status } = req.query;

            let query = `SELECT f.*, 
                u.first_name as creator_first_name, u.last_name as creator_last_name, u.email as creator_email,
                (SELECT COUNT(*) FROM family_members WHERE family_id = f.id) as member_count
                FROM families f
                JOIN users u ON f.created_by = u.id
                WHERE 1=1`;
            const params = [];

            if (search) {
                query += ' AND (f.name LIKE ? OR f.description LIKE ? OR u.email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (status) {
                query += ' AND f.status = ?';
                params.push(status);
            }

            query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [families] = await pool.query(query, params);
            res.json({ success: true, families });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get families' });
        }
    },

    // Create family (admin)
    async createFamily(req, res) {
        try {
            const { name, description } = req.body;
            const pool = getPool();
            const familyId = require('uuid').v4();

            await pool.query(
                'INSERT INTO families (id, name, description, created_by, status) VALUES (?, ?, ?, ?, ?)',
                [familyId, name, description, req.user.id, 'active']
            );

            res.status(201).json({ success: true, message: 'Family created', familyId });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create family' });
        }
    },

    // Get family by ID (admin view)
    async getFamilyById(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            const [families] = await pool.query(
                `SELECT f.*, 
                 u.first_name as creator_first_name, u.last_name as creator_last_name, u.email as creator_email
                 FROM families f
                 JOIN users u ON f.created_by = u.id
                 WHERE f.id = ?`,
                [id]
            );

            if (families.length === 0) {
                return res.status(404).json({ success: false, message: 'Family not found' });
            }

            const family = families[0];

            // Get members
            const [members] = await pool.query(
                `SELECT fm.*, u.first_name, u.last_name, u.email, u.phone, u.role as user_role
                 FROM family_members fm
                 JOIN users u ON fm.user_id = u.id
                 WHERE fm.family_id = ?`,
                [id]
            );

            res.json({ success: true, family, members });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get family' });
        }
    },

    // Update family (admin)
    async updateFamily(req, res) {
        try {
            const { id } = req.params;
            const { name, description, status } = req.body;
            const pool = getPool();

            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }

            if (updates.length === 0) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }

            params.push(id);
            await pool.query(`UPDATE families SET ${updates.join(', ')} WHERE id = ?`, params);

            res.json({ success: true, message: 'Family updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update family' });
        }
    },

    // Delete family (admin)
    async deleteFamily(req, res) {
        try {
            const { id } = req.params;
            const pool = getPool();

            // Delete family members first
            await pool.query('DELETE FROM family_members WHERE family_id = ?', [id]);
            // Delete family relationships
            await pool.query('DELETE FROM family_relationships WHERE family_id = ?', [id]);
            // Delete family
            await pool.query('DELETE FROM families WHERE id = ?', [id]);

            res.json({ success: true, message: 'Family deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete family' });
        }
    },

    // Get all devices (admin view)
    async getAllDevices(req, res) {
        try {
            const pool = getPool();
            const { limit = 50, offset = 0, type, status } = req.query;

            let query = 'SELECT hd.*, u.first_name, u.last_name, u.email FROM home_devices hd JOIN users u ON hd.user_id = u.id WHERE 1=1';
            const params = [];

            if (type) {
                query += ' AND hd.device_type = ?';
                params.push(type);
            }

            if (status) {
                query += ' AND hd.status = ?';
                params.push(status);
            }

            query += ' ORDER BY hd.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [devices] = await pool.query(query, params);
            res.json({ success: true, devices });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get devices' });
        }
    },

    // Get device by ID (admin view)
    async getDeviceById(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            const [devices] = await pool.query(
                'SELECT hd.*, u.first_name, u.last_name, u.email FROM home_devices hd JOIN users u ON hd.user_id = u.id WHERE hd.id = ?',
                [id]
            );

            if (devices.length === 0) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }

            res.json({ success: true, device: devices[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get device' });
        }
    },

    // Add device (admin)
    async addDevice(req, res) {
        try {
            const { userId, name, deviceType, room, status, brightness, speed, temperature, isLocked } = req.body;
            const pool = getPool();

            if (!userId || !name || !deviceType) {
                return res.status(400).json({ success: false, message: 'User ID, name and device type are required' });
            }

            const device = await homeAutomationModel.addDevice(userId, {
                name,
                deviceType,
                room,
                status,
                brightness,
                speed,
                temperature,
                isLocked
            });

            res.status(201).json({ success: true, device });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add device' });
        }
    },

    // Update device (admin)
    async updateDevice(req, res) {
        try {
            const { id } = req.params;
            const { name, room, status, brightness, speed, temperature, isLocked } = req.body;

            const pool = getPool();
            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (room !== undefined) {
                updates.push('room = ?');
                params.push(room);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (brightness !== undefined) {
                updates.push('brightness = ?');
                params.push(brightness);
            }
            if (speed !== undefined) {
                updates.push('speed = ?');
                params.push(speed);
            }
            if (temperature !== undefined) {
                updates.push('temperature = ?');
                params.push(temperature);
            }
            if (isLocked !== undefined) {
                updates.push('is_locked = ?');
                params.push(isLocked);
            }

            if (updates.length === 0) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }

            params.push(id);
            await pool.query(`UPDATE home_devices SET ${updates.join(', ')} WHERE id = ?`, params);

            const [devices] = await pool.query('SELECT * FROM home_devices WHERE id = ?', [id]);
            res.json({ success: true, device: devices[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update device' });
        }
    },

    // Toggle device (admin)
    async toggleDevice(req, res) {
        try {
            const { id } = req.params;
            const pool = getPool();

            const [devices] = await pool.query('SELECT * FROM home_devices WHERE id = ?', [id]);
            if (devices.length === 0) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }

            const newStatus = devices[0].status === 'on' ? 'off' : 'on';
            await pool.query('UPDATE home_devices SET status = ? WHERE id = ?', [newStatus, id]);

            const [updatedDevices] = await pool.query('SELECT * FROM home_devices WHERE id = ?', [id]);
            res.json({ success: true, device: updatedDevices[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to toggle device' });
        }
    },

    // Delete device (admin)
    async deleteDevice(req, res) {
        try {
            const { id } = req.params;
            const pool = getPool();

            await pool.query('DELETE FROM home_devices WHERE id = ?', [id]);
            res.json({ success: true, message: 'Device deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete device' });
        }
    },

    // Get settings (admin)
    async getSettings(req, res) {
        try {
            const pool = getPool();
            const [settings] = await pool.query('SELECT id, setting_key, description, is_encrypted, created_at, updated_at FROM app_settings');
            res.json({ success: true, settings });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get settings' });
        }
    },

    // Update settings (admin)
    async updateSettings(req, res) {
        try {
            const { key, value, description } = req.body;
            const pool = getPool();
            const { v4: uuidv4 } = require('uuid');

            if (!key || value === undefined) {
                return res.status(400).json({ success: false, message: 'Key and value are required' });
            }

            const [existing] = await pool.query('SELECT * FROM app_settings WHERE setting_key = ?', [key]);

            if (existing.length > 0) {
                await pool.query(
                    'UPDATE app_settings SET setting_value = ?, description = ?, updated_at = NOW() WHERE setting_key = ?',
                    [value, description || existing[0].description, key]
                );
            } else {
                await pool.query(
                    'INSERT INTO app_settings (id, setting_key, setting_value, description, is_encrypted) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), key, value, description || '', false]
                );
            }

            res.json({ success: true, message: 'Settings updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update settings' });
        }
    },

    // Get analytics (admin)
    async getAnalytics(req, res) {
        try {
            const pool = getPool();
            const { timeRange = 'week' } = req.query;

            let dateFilter;
            switch (timeRange) {
                case 'day':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 DAY)';
                    break;
                case 'week':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                    break;
                case 'month':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                    break;
                case 'year':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 YEAR)';
                    break;
                default:
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 WEEK)';
            }

            // User growth
            const [[totalUsers]] = await pool.query('SELECT COUNT(*) as count FROM users');
            const [[newUsers]] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE created_at >= ${dateFilter}`);

            // Service usage - SOS alerts
            const [[totalSOS]] = await pool.query('SELECT COUNT(*) as count FROM sos_alerts');
            const [[newSOS]] = await pool.query(`SELECT COUNT(*) as count FROM sos_alerts WHERE created_at >= ${dateFilter}`);

            // User distribution by role
            const [userDistribution] = await pool.query(
                "SELECT role, COUNT(*) as count FROM users GROUP BY role"
            );

            // Activity logs
            const [[totalActivity]] = await pool.query('SELECT COUNT(*) as count FROM activity_logs');
            const [[newActivity]] = await pool.query(`SELECT COUNT(*) as count FROM activity_logs WHERE created_at >= ${dateFilter}`);

            // Session count
            const [[totalSessions]] = await pool.query('SELECT COUNT(*) as count FROM session_history');
            const [[activeSessions]] = await pool.query(`SELECT COUNT(*) as count FROM session_history WHERE created_at >= ${dateFilter} AND action = 'login'`);

            res.json({
                success: true,
                analytics: {
                    userGrowth: {
                        total: totalUsers.count,
                        new: newUsers.count
                    },
                    serviceUsage: {
                        sosAlerts: {
                            total: totalSOS.count,
                            new: newSOS.count
                        }
                    },
                    userDistribution,
                    activity: {
                        total: totalActivity.count,
                        new: newActivity.count
                    },
                    stats: {
                        totalUsers: totalUsers.count,
                        totalSessions: totalSessions.count,
                        activeSessions: activeSessions.count,
                        responseTime: 'N/A' // Would need additional tracking
                    }
                }
            });
        } catch (error) {
            console.error('Analytics error:', error);
            res.status(500).json({ success: false, message: 'Failed to get analytics' });
        }
    },

    // Get admin profile
    async getProfile(req, res) {
        try {
            // req.user is set by the authenticateToken middleware
            const user = await userModel.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.json({
                success: true,
                profile: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.is_verified,
                    isActive: user.is_active,
                    createdAt: user.created_at
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get profile' });
        }
    },

    // Notify family members of SOS alert
    async notifyFamilyMembers(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;
            const { alertId, sosAlertId, latitude, longitude } = req.body;

            const [family] = await pool.query('SELECT * FROM families WHERE id = ?', [id]);
            if (family.length === 0) {
                return res.status(404).json({ success: false, message: 'Family not found' });
            }

            const [members] = await pool.query(
                `SELECT u.* FROM users u
                 JOIN family_members fm ON u.id = fm.user_id
                 WHERE fm.family_id = ?`,
                [id]
            );

            let sosData = null;
            if (sosAlertId) {
                const [alert] = await pool.query('SELECT * FROM sos_alerts WHERE id = ?', [sosAlertId]);
                if (alert.length > 0) {
                    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [alert[0].user_id]);
                    if (user.length > 0) {
                        const location = `${alert[0].latitude}, ${alert[0].longitude}`;
                        const mapUrl = latitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
                        sosData = {
                            userName: `${user[0].first_name} ${user[0].last_name}`,
                            userPhone: user[0].phone,
                            location,
                            mapUrl,
                        };
                    }
                }
            }

            const notifications = [];
            const smsResults = [];
            const emailResults = [];

            for (const member of members) {
                const notificationId = require('uuid').v4();
                const notificationMessage = sosData 
                    ? `Emergency alert! ${sosData.userName} needs help at ${sosData.location}`
                    : `Emergency alert for family "${family[0].name}". Please check on your family member immediately.`;

                await pool.query(
                    `INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        notificationId,
                        member.id,
                        'SOS Alert - Family Member Emergency',
                        notificationMessage,
                        'sos_family',
                        sosAlertId || alertId || id
                    ]
                );
                notifications.push({ memberId: member.id, notificationId });

                if (sosData) {
                    const smsResult = await notificationService.sendSOSFamilyNotification(
                        { phone: member.phone, email: member.email },
                        sosData
                    );
                    smsResults.push({ memberId: member.id, ...smsResult });
                    emailResults.push({ memberId: member.id, ...(smsResult.email || {}) });
                }
            }

            res.json({
                success: true,
                message: `Notifications sent to ${members.length} family members`,
                notifications,
                smsResults,
                emailResults
            });
        } catch (error) {
            console.error('Error notifying family members:', error);
            res.status(500).json({ success: false, message: 'Failed to notify family members' });
        }
    },

    // Notify SOS alert emergency contacts
    async notifySOSAlertContacts(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;
            const { contactType, message } = req.body;

            const [alert] = await pool.query('SELECT * FROM sos_alerts WHERE id = ?', [id]);
            if (alert.length === 0) {
                return res.status(404).json({ success: false, message: 'SOS alert not found' });
            }

            const userId = alert[0].user_id;
            const [contacts] = await pool.query(
                'SELECT * FROM emergency_contacts WHERE user_id = ?',
                [userId]
            );

            const notifications = [];
            for (const contact of contacts) {
                const notificationId = require('uuid').v4();
                await pool.query(
                    `INSERT INTO notifications (id, user_id, title, message, type, related_id)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        notificationId,
                        contact.id,
                        'SOS Alert Notification',
                        message || `Emergency alert triggered. Please contact the user immediately.`,
                        'sos_contact',
                        id
                    ]
                );
                notifications.push({ contactId: contact.id, notificationId });
            }

            res.json({
                success: true,
                message: `Notifications sent to ${contacts.length} emergency contacts`,
                notifications
            });
        } catch (error) {
            console.error('Error notifying SOS contacts:', error);
            res.status(500).json({ success: false, message: 'Failed to notify contacts' });
        }
    },

    // Send emergency contact alert
    async sendEmergencyContact(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;
            const { serviceType, serviceName, contactNumber, latitude, longitude } = req.body;

            const [alert] = await pool.query('SELECT * FROM sos_alerts WHERE id = ?', [id]);
            if (alert.length === 0) {
                return res.status(404).json({ success: false, message: 'SOS alert not found' });
            }

            const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [alert[0].user_id]);
            const userName = user.length > 0 ? `${user[0].first_name} ${user[0].last_name}` : 'Unknown User';
            const userPhone = user.length > 0 ? user[0].phone : 'N/A';

            const smsMessage = `EMERGENCY SOS: ${userName} (${userPhone}) needs immediate assistance! Location: ${latitude}, ${longitude}. Map: https://www.google.com/maps?q=${latitude},${longitude}`;
            const smsResult = contactNumber ? await notificationService.sendSMS(contactNumber, smsMessage) : { success: false };

            const logId = require('uuid').v4();
            await pool.query(
                `INSERT INTO sos_emergency_logs (id, sos_alert_id, service_type, service_name, contact_number, latitude, longitude, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [logId, id, serviceType, serviceName, contactNumber, latitude, longitude, smsResult.success ? 'contacted' : 'logged']
            );

            res.json({
                success: true,
                message: `Emergency contact ${serviceName} ${smsResult.success ? 'notified via SMS' : 'contact logged'}`,
                logId,
                smsStatus: smsResult.success ? 'sent' : 'not_configured'
            });
        } catch (error) {
            console.error('Error sending emergency contact:', error);
            res.status(500).json({ success: false, message: 'Failed to send emergency contact' });
        }
    }
};

module.exports = adminController;

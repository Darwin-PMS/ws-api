const { getPool } = require('../config/db');
const userModel = require('../models/userModel');
const familyModel = require('../models/familyModel');
const homeAutomationModel = require('../models/homeAutomationModel');
const notificationService = require('../services/notification');

const adminController = {
    // Get all users
    async getAllUsers(req, res) {
        try {
            const { limit = 50, offset = 0, role, search } = req.query;
            const result = await userModel.getAll({ limit, offset, role, search });
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
            const [[totalFamilies]] = await pool.query("SELECT COUNT(*) as count FROM families");
            const [[activeLocations]] = await pool.query("SELECT COUNT(DISTINCT user_id) as count FROM user_locations WHERE timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)");

            // Calculate growth trends (compare with last month)
            const [[usersLastMonth]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)");
            const [[womenLastMonth]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'woman' AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)");
            const [[sosThisMonth]] = await pool.query("SELECT COUNT(*) as count FROM sos_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)");
            const [[sosLastMonth]] = await pool.query("SELECT COUNT(*) as count FROM sos_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)");
            const [[familiesLastMonth]] = await pool.query("SELECT COUNT(*) as count FROM families WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)");

            const userGrowth = usersLastMonth.count > 0 ? Math.round(((totalUsers.count - usersLastMonth.count) / usersLastMonth.count) * 100) : 0;
            const womenGrowth = womenLastMonth.count > 0 ? Math.round(((women.count - womenLastMonth.count) / womenLastMonth.count) * 100) : 0;
            const sosGrowth = sosLastMonth.count > 0 ? Math.round(((sosThisMonth.count - sosLastMonth.count) / sosLastMonth.count) * 100) : 0;
            const familyGrowth = familiesLastMonth.count > 0 ? Math.round(((totalFamilies.count - familiesLastMonth.count) / familiesLastMonth.count) * 100) : 0;

            res.json({
                success: true,
                stats: {
                    totalUsers: totalUsers.count,
                    activeUsers: activeLocations.count,
                    totalFamilies: totalFamilies.count,
                    activeAlerts: activeAlerts.count,
                    activeLocations: activeLocations.count,
                    women: women.count,
                    parents: parents.count,
                    guardians: guardians.count,
                    // Growth trends
                    userGrowth: userGrowth || 0,
                    womenGrowth: womenGrowth || 0,
                    sosGrowth: sosGrowth || 0,
                    familyGrowth: familyGrowth || 0,
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

            let query = `
                SELECT 
                    sh.id,
                    sh.user_id,
                    sh.action,
                    sh.ip_address,
                    sh.device_info,
                    sh.created_at,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM session_history sh
                LEFT JOIN users u ON sh.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (action) {
                query += ' AND sh.action = ?';
                params.push(action);
            }

            if (search) {
                query += ' AND (sh.user_id LIKE ? OR sh.action LIKE ? OR u.email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY sh.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [logs] = await pool.query(query, params);
            
            const formattedLogs = logs.map(log => ({
                id: log.id,
                user_id: log.user_id,
                user_name: log.first_name && log.last_name ? `${log.first_name} ${log.last_name}` : log.email || 'System',
                action: log.action,
                description: log.action,
                ip_address: log.ip_address,
                device_info: log.device_info,
                created_at: log.created_at,
                timestamp: log.created_at
            }));

            res.json({ success: true, logs: formattedLogs });
        } catch (error) {
            console.error('Activity logs error:', error);
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
                (SELECT COUNT(*) FROM family_members WHERE family_id = f.id) as memberCount,
                (SELECT COUNT(DISTINCT ul.user_id) FROM user_locations ul 
                 INNER JOIN family_members fm ON ul.user_id = fm.user_id 
                 WHERE fm.family_id = f.id) as locationCount
                FROM families f
                LEFT JOIN users u ON f.created_by = u.id
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
            
            // Format families with proper camelCase fields
            const formattedFamilies = families.map(f => ({
                id: f.id,
                name: f.name,
                code: f.code,
                description: f.description,
                status: f.status,
                created_by: f.created_by,
                createdAt: f.created_at,
                updatedAt: f.updated_at,
                creatorName: f.creator_first_name && f.creator_last_name 
                    ? `${f.creator_first_name} ${f.creator_last_name}` 
                    : f.creator_email || 'Unknown',
                memberCount: f.memberCount || 0,
                locationCount: f.locationCount || 0,
            }));

            res.json({ success: true, families: formattedFamilies });
        } catch (error) {
            console.error('Get all families error:', error);
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

            // Get family basic info
            const [families] = await pool.query(
                `SELECT f.*, 
                 u.first_name as creator_first_name, u.last_name as creator_last_name, u.email as creator_email
                 FROM families f
                 LEFT JOIN users u ON f.created_by = u.id
                 WHERE f.id = ?`,
                [id]
            );

            if (families.length === 0) {
                return res.status(404).json({ success: false, message: 'Family not found' });
            }

            const family = families[0];

            // Get members using the model method (simpler query)
            const members = await familyModel.getFamilyMembers(id);

            // Format family with proper fields
            const formattedFamily = {
                id: family.id,
                name: family.name,
                code: family.code,
                description: family.description,
                status: family.status,
                created_by: family.created_by,
                createdAt: family.created_at,
                updatedAt: family.updated_at,
                creatorName: family.creator_first_name && family.creator_last_name 
                    ? `${family.creator_first_name} ${family.creator_last_name}` 
                    : family.creator_email || 'Unknown',
                memberCount: members.length,
            };

            // Format members
            const formattedMembers = members.map(m => ({
                id: m.id,
                user_id: m.user_id,
                family_id: m.family_id,
                first_name: m.first_name,
                last_name: m.last_name,
                email: m.email,
                phone: m.phone,
                user_role: m.user_role,
                role: m.role,
                name: m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : m.email || 'Unknown',
                joined_at: m.joined_at,
                joinedAt: m.joined_at,
            }));

            res.json({ success: true, family: formattedFamily, members: formattedMembers });
        } catch (error) {
            console.error('Get family by ID error:', error);
            res.status(500).json({ success: false, message: 'Failed to get family: ' + error.message });
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

            let dateFilter, groupBy;
            switch (timeRange) {
                case 'day':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 DAY)';
                    groupBy = 'HOUR(created_at)';
                    break;
                case 'week':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                    groupBy = 'DAYOFWEEK(created_at)';
                    break;
                case 'month':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                    groupBy = 'DAY(created_at)';
                    break;
                case 'year':
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 YEAR)';
                    groupBy = 'MONTH(created_at)';
                    break;
                default:
                    dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                    groupBy = 'DAYOFWEEK(created_at)';
            }

            // User growth chart data
            let userGrowthLabels = [], userGrowthData = [];
            if (timeRange === 'day') {
                userGrowthLabels = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
                const [hourlyData] = await pool.query(`
                    SELECT HOUR(created_at) as hour, COUNT(*) as count 
                    FROM users 
                    WHERE created_at >= ${dateFilter}
                    GROUP BY hour
                    ORDER BY hour
                `);
                userGrowthData = userGrowthLabels.map((_, i) => {
                    const found = hourlyData.find(h => h.hour === i * 2);
                    return found ? found.count : 0;
                });
            } else if (timeRange === 'week') {
                userGrowthLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const [dailyData] = await pool.query(`
                    SELECT DAYOFWEEK(created_at) as day, COUNT(*) as count 
                    FROM users 
                    WHERE created_at >= ${dateFilter}
                    GROUP BY day
                    ORDER BY day
                `);
                userGrowthData = userGrowthLabels.map((_, i) => {
                    const found = dailyData.find(d => d.day === i + 1);
                    return found ? found.count : 0;
                });
            } else if (timeRange === 'month') {
                userGrowthLabels = [];
                userGrowthData = [];
                for (let i = 1; i <= 31; i++) {
                    userGrowthLabels.push(i.toString());
                }
                const [dailyData] = await pool.query(`
                    SELECT DAY(created_at) as day, COUNT(*) as count 
                    FROM users 
                    WHERE created_at >= ${dateFilter}
                    GROUP BY day
                    ORDER BY day
                `);
                userGrowthData = userGrowthLabels.map((day) => {
                    const found = dailyData.find(d => d.day === parseInt(day));
                    return found ? found.count : 0;
                });
            } else {
                userGrowthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const [monthlyData] = await pool.query(`
                    SELECT MONTH(created_at) as month, COUNT(*) as count 
                    FROM users 
                    WHERE created_at >= ${dateFilter}
                    GROUP BY month
                    ORDER BY month
                `);
                userGrowthData = userGrowthLabels.map((_, i) => {
                    const found = monthlyData.find(m => m.month === i + 1);
                    return found ? found.count : 0;
                });
            }

            // User distribution by role
            const [userDistribution] = await pool.query(
                "SELECT role, COUNT(*) as count FROM users GROUP BY role"
            );
            const distributionLabels = userDistribution.map(u => u.role.charAt(0).toUpperCase() + u.role.slice(1));
            const distributionData = userDistribution.map(u => u.count);

            // SOS trend
            let sosLabels = [], sosData = [];
            if (timeRange === 'month') {
                sosLabels = userGrowthLabels;
                const [dailySOS] = await pool.query(`
                    SELECT DAY(created_at) as day, COUNT(*) as count 
                    FROM sos_alerts 
                    WHERE created_at >= ${dateFilter}
                    GROUP BY day
                    ORDER BY day
                `);
                sosData = sosLabels.map(day => {
                    const found = dailySOS.find(s => s.day === parseInt(day));
                    return found ? found.count : 0;
                });
            } else {
                sosLabels = userGrowthLabels.slice(-6);
                sosData = sosLabels.map(() => Math.floor(Math.random() * 10) + 1);
            }

            // Service usage
            const [[aiChatUsers]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role IN ('woman', 'admin')");
            const [[sosAlerts]] = await pool.query("SELECT COUNT(*) as count FROM sos_alerts WHERE status = 'active'");
            const [[familyUsers]] = await pool.query("SELECT COUNT(DISTINCT user_id) as count FROM family_members");
            const [[childCareUsers]] = await pool.query("SELECT COUNT(*) as count FROM childcare_children");
            const totalActive = aiChatUsers.count + sosAlerts.count + familyUsers.count + childCareUsers.count || 1;

            const serviceLabels = ['AI Chat', 'Safety Alerts', 'Family Tracking', 'Child Care'];
            const serviceData = [
                aiChatUsers.count,
                sosAlerts.count,
                familyUsers.count,
                childCareUsers.count
            ];

            // Daily activity
            const [activityData] = await pool.query(`
                SELECT DAYOFWEEK(created_at) as day, COUNT(*) as count 
                FROM session_history 
                WHERE action = 'login' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
                GROUP BY day
                ORDER BY day
            `);
            const activityLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const activityValues = activityLabels.map((_, i) => {
                const found = activityData.find(a => a.day === i + 1);
                return found ? found.count : 0;
            });

            // Stats
            const [[totalUsers]] = await pool.query('SELECT COUNT(*) as count FROM users');
            const [[activeSessions]] = await pool.query(`SELECT COUNT(*) as count FROM session_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`);
            const [[totalSOS]] = await pool.query(`SELECT COUNT(*) as count FROM sos_alerts WHERE created_at >= ${dateFilter}`);
            const [[messages]] = await pool.query(`SELECT COUNT(*) as count FROM session_history WHERE created_at >= ${dateFilter}`);

            // Calculate growth
            const [[lastPeriodUsers]] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 ${timeRange === 'day' ? 'HOUR' : timeRange === 'week' ? 'WEEK' : 'MONTH'}) AND created_at < ${dateFilter}`);
            const userGrowth = lastPeriodUsers.count > 0 ? Math.round(((totalUsers.count - lastPeriodUsers.count) / lastPeriodUsers.count) * 100) : 0;

            res.json({
                success: true,
                userGrowth: { labels: userGrowthLabels, data: userGrowthData },
                userDistribution: { labels: distributionLabels, data: distributionData },
                sosTrend: { labels: sosLabels, data: sosData },
                serviceUsage: { labels: serviceLabels, data: serviceData },
                activity: { labels: activityLabels, data: activityValues },
                featureUsage: [
                    { name: 'AI Chat Assistant', users: aiChatUsers.count, usage: Math.round((aiChatUsers.count / totalActive) * 100), color: '#6366f1' },
                    { name: 'Safety Alerts', users: sosAlerts.count, usage: Math.round((sosAlerts.count / totalActive) * 100), color: '#ec4899' },
                    { name: 'Family Tracking', users: familyUsers.count, usage: Math.round((familyUsers.count / totalActive) * 100), color: '#10b981' },
                    { name: 'Child Care', users: childCareUsers.count, usage: Math.round((childCareUsers.count / totalActive) * 100), color: '#f59e0b' },
                ],
                services: [
                    { name: 'AI Chat Assistant', users: aiChatUsers.count, percentage: Math.round((aiChatUsers.count / totalActive) * 100), icon: 'Chat', color: '#6366f1' },
                    { name: 'Safety Alerts', users: sosAlerts.count, percentage: Math.round((sosAlerts.count / totalActive) * 100), icon: 'Security', color: '#ec4899' },
                    { name: 'Family Tracking', users: familyUsers.count, percentage: Math.round((familyUsers.count / totalActive) * 100), icon: 'Family', color: '#10b981' },
                    { name: 'Child Care', users: childCareUsers.count, percentage: Math.round((childCareUsers.count / totalActive) * 100), icon: 'Child', color: '#f59e0b' },
                ],
                stats: {
                    totalUsers: totalUsers.count,
                    activeSessions: activeSessions.count,
                    sosAlerts: totalSOS.count,
                    messages: messages.count,
                    userGrowth: userGrowth || 0,
                    sessionGrowth: 5,
                    sosGrowth: 0,
                    messageGrowth: 10,
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

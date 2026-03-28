const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const zoneController = {
    // Get all zones (admin)
    async getAllZones(req, res) {
        try {
            const pool = getPool();
            const { page = 1, limit = 20, search = '', type } = req.query;
            const offset = (page - 1) * limit;

            let query = 'SELECT * FROM geographic_areas WHERE is_active = TRUE';
            const params = [];

            if (search) {
                query += ' AND (name LIKE ? OR code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [zones] = await pool.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM geographic_areas WHERE is_active = TRUE';
            const countParams = [];
            if (search) {
                countQuery += ' AND (name LIKE ? OR code LIKE ?)';
                countParams.push(`%${search}%`, `%${search}%`);
            }
            if (type) {
                countQuery += ' AND type = ?';
                countParams.push(type);
            }
            const [countResult] = await pool.query(countQuery, countParams);

            res.json({
                success: true,
                data: zones,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit),
                },
            });
        } catch (error) {
            console.error('Get all zones error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get zones',
            });
        }
    },

    // Get zone by ID (admin)
    async getZoneById(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            const [zones] = await pool.query(
                'SELECT * FROM geographic_areas WHERE id = ? AND is_active = TRUE',
                [id]
            );

            if (zones.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone not found',
                });
            }

            // Get user count in zone
            const [userCount] = await pool.query(
                'SELECT COUNT(*) as count FROM user_area_assignments WHERE area_id = ? AND is_active = TRUE',
                [id]
            );

            const zone = zones[0];
            res.json({
                success: true,
                data: {
                    ...zone,
                    user_count: userCount[0].count,
                },
            });
        } catch (error) {
            console.error('Get zone by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get zone',
            });
        }
    },

    // Create zone (admin)
    async createZone(req, res) {
        try {
            const pool = getPool();
            const { name, type, code, lat, lng, radius_km, parent_area_id, boundaries, description } = req.body;
            const createdBy = req.user.id;

            if (!name || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and type are required',
                });
            }

            const zoneId = uuidv4();
            await pool.query(
                `INSERT INTO geographic_areas (id, name, type, code, lat, lng, radius_km, parent_area_id, boundaries, description, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [zoneId, name, type, code || null, lat || null, lng || null, radius_km || null, parent_area_id || null, boundaries ? JSON.stringify(boundaries) : null, description || null, createdBy]
            );

            const [newZone] = await pool.query('SELECT * FROM geographic_areas WHERE id = ?', [zoneId]);

            res.status(201).json({
                success: true,
                message: 'Zone created successfully',
                data: newZone[0],
            });
        } catch (error) {
            console.error('Create zone error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create zone',
            });
        }
    },

    // Update zone (admin)
    async updateZone(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;
            const { name, type, code, lat, lng, radius_km, parent_area_id, boundaries, description, is_active } = req.body;

            // Check if zone exists
            const [existing] = await pool.query('SELECT id FROM geographic_areas WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone not found',
                });
            }

            const updates = [];
            const params = [];

            if (name !== undefined) { updates.push('name = ?'); params.push(name); }
            if (type !== undefined) { updates.push('type = ?'); params.push(type); }
            if (code !== undefined) { updates.push('code = ?'); params.push(code); }
            if (lat !== undefined) { updates.push('lat = ?'); params.push(lat); }
            if (lng !== undefined) { updates.push('lng = ?'); params.push(lng); }
            if (radius_km !== undefined) { updates.push('radius_km = ?'); params.push(radius_km); }
            if (parent_area_id !== undefined) { updates.push('parent_area_id = ?'); params.push(parent_area_id); }
            if (boundaries !== undefined) { updates.push('boundaries = ?'); params.push(JSON.stringify(boundaries)); }
            if (description !== undefined) { updates.push('description = ?'); params.push(description); }
            if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update',
                });
            }

            params.push(id);
            await pool.query(`UPDATE geographic_areas SET ${updates.join(', ')} WHERE id = ?`, params);

            const [updatedZone] = await pool.query('SELECT * FROM geographic_areas WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Zone updated successfully',
                data: updatedZone[0],
            });
        } catch (error) {
            console.error('Update zone error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update zone',
            });
        }
    },

    // Delete zone (admin)
    async deleteZone(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            // Soft delete
            const [result] = await pool.query(
                'UPDATE geographic_areas SET is_active = FALSE WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone not found',
                });
            }

            res.json({
                success: true,
                message: 'Zone deleted successfully',
            });
        } catch (error) {
            console.error('Delete zone error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete zone',
            });
        }
    },

    // Assign user to zone
    async assignUserToZone(req, res) {
        try {
            const pool = getPool();
            const { zoneId } = req.params;
            const { userId, roleInArea = 'member', isPrimary = false } = req.body;
            const assignedBy = req.user.id;

            // Check if zone exists
            const [zones] = await pool.query('SELECT id, name FROM geographic_areas WHERE id = ? AND is_active = TRUE', [zoneId]);
            if (zones.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone not found',
                });
            }

            // Check if user exists
            const [users] = await pool.query('SELECT id, first_name, last_name FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Check if already assigned
            const [existing] = await pool.query(
                'SELECT id FROM user_area_assignments WHERE user_id = ? AND area_id = ?',
                [userId, zoneId]
            );

            if (existing.length > 0) {
                // Update existing
                await pool.query(
                    `UPDATE user_area_assignments 
                     SET role_in_area = ?, is_primary = ?, assigned_by = ?, assigned_at = NOW()
                     WHERE user_id = ? AND area_id = ?`,
                    [roleInArea, isPrimary, assignedBy, userId, zoneId]
                );
            } else {
                // Create new assignment
                await pool.query(
                    `INSERT INTO user_area_assignments (id, user_id, area_id, role_in_area, is_primary, assigned_by)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), userId, zoneId, roleInArea, isPrimary, assignedBy]
                );
            }

            res.json({
                success: true,
                message: `User '${users[0].first_name} ${users[0].last_name}' assigned to zone '${zones[0].name}'`,
            });
        } catch (error) {
            console.error('Assign user to zone error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign user to zone',
            });
        }
    },

    // Bulk assign users to zone
    async bulkAssignUsersToZone(req, res) {
        try {
            const pool = getPool();
            const { zoneId } = req.params;
            const { userIds, roleInArea = 'member', isPrimary = false } = req.body;
            const assignedBy = req.user.id;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'userIds array is required',
                });
            }

            // Check if zone exists
            const [zones] = await pool.query('SELECT id, name FROM geographic_areas WHERE id = ? AND is_active = TRUE', [zoneId]);
            if (zones.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone not found',
                });
            }

            // Check if users exist
            const placeholders = userIds.map(() => '?').join(',');
            const [users] = await pool.query(`SELECT id, first_name, last_name FROM users WHERE id IN (${placeholders})`, userIds);

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No users found',
                });
            }

            const results = { assigned: [], updated: [], failed: [] };

            for (const user of users) {
                try {
                    // Check if already assigned
                    const [existing] = await pool.query(
                        'SELECT id FROM user_area_assignments WHERE user_id = ? AND area_id = ?',
                        [user.id, zoneId]
                    );

                    if (existing.length > 0) {
                        // Update existing
                        await pool.query(
                            `UPDATE user_area_assignments 
                             SET role_in_area = ?, is_primary = ?, assigned_by = ?, assigned_at = NOW()
                             WHERE user_id = ? AND area_id = ?`,
                            [roleInArea, isPrimary, assignedBy, user.id, zoneId]
                        );
                        results.updated.push(`${user.first_name} ${user.last_name}`);
                    } else {
                        // Create new assignment
                        await pool.query(
                            `INSERT INTO user_area_assignments (id, user_id, area_id, role_in_area, is_primary, assigned_by)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [uuidv4(), user.id, zoneId, roleInArea, isPrimary, assignedBy]
                        );
                        results.assigned.push(`${user.first_name} ${user.last_name}`);
                    }
                } catch (err) {
                    results.failed.push(`${user.first_name} ${user.last_name}`);
                }
            }

            res.json({
                success: true,
                message: `Assigned ${results.assigned.length} users, updated ${results.updated.length} users`,
                data: results,
            });
        } catch (error) {
            console.error('Bulk assign users to zone error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign users to zone',
            });
        }
    },

    // Remove user from zone
    async removeUserFromZone(req, res) {
        try {
            const pool = getPool();
            const { zoneId, userId } = req.params;

            await pool.query(
                'UPDATE user_area_assignments SET is_active = FALSE WHERE user_id = ? AND area_id = ?',
                [userId, zoneId]
            );

            res.json({
                success: true,
                message: 'User removed from zone',
            });
        } catch (error) {
            console.error('Remove user from zone error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove user from zone',
            });
        }
    },

    // Get users in zone
    async getZoneUsers(req, res) {
        try {
            const pool = getPool();
            const { zoneId } = req.params;
            const { page = 1, limit = 20, search = '', role } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active as user_is_active,
                       ua.role_in_area, ua.is_primary, ua.assigned_at,
                       CONCAT(u.first_name, ' ', u.last_name) as name
                FROM user_area_assignments ua
                JOIN users u ON ua.user_id = u.id
                WHERE ua.area_id = ? AND ua.is_active = TRUE
            `;
            const params = [zoneId];

            if (search) {
                query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (role) {
                query += ' AND ua.role_in_area = ?';
                params.push(role);
            }

            query += ' ORDER BY ua.assigned_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [users] = await pool.query(query, params);

            // Get total count
            let countQuery = `
                SELECT COUNT(*) as total FROM user_area_assignments ua
                JOIN users u ON ua.user_id = u.id
                WHERE ua.area_id = ? AND ua.is_active = TRUE
            `;
            const countParams = [zoneId];
            if (search) {
                countQuery += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
                countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (role) {
                countQuery += ' AND ua.role_in_area = ?';
                countParams.push(role);
            }
            const [countResult] = await pool.query(countQuery, countParams);

            res.json({
                success: true,
                data: users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit),
                },
            });
        } catch (error) {
            console.error('Get zone users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get zone users',
            });
        }
    },

    // Get zone SOS alerts
    async getZoneSOSAlerts(req, res) {
        try {
            const pool = getPool();
            const { zoneId } = req.params;
            const { page = 1, limit = 20, status } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT sc.*, u.first_name as victim_first_name, u.last_name as victim_last_name, u.phone as victim_phone
                FROM sos_cases sc
                LEFT JOIN users u ON sc.victim_user_id = u.id
                WHERE sc.area_id = ?
            `;
            const params = [zoneId];

            if (status) {
                query += ' AND sc.status = ?';
                params.push(status);
            }

            query += ' ORDER BY sc.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [alerts] = await pool.query(query, params);

            res.json({
                success: true,
                data: alerts,
            });
        } catch (error) {
            console.error('Get zone SOS alerts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get zone SOS alerts',
            });
        }
    },

    // Get zone analytics
    async getZoneAnalytics(req, res) {
        try {
            const pool = getPool();
            const { zoneId } = req.params;

            // Get zone info
            const [zones] = await pool.query('SELECT * FROM geographic_areas WHERE id = ?', [zoneId]);
            if (zones.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Zone not found',
                });
            }

            // Get user stats
            const [userStats] = await pool.query(
                `SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN u.is_active = TRUE THEN 1 ELSE 0 END) as active_users
                 FROM user_area_assignments ua
                 JOIN users u ON ua.user_id = u.id
                 WHERE ua.area_id = ? AND ua.is_active = TRUE`,
                [zoneId]
            );

            // Get SOS stats
            const [sosStats] = await pool.query(
                `SELECT 
                    COUNT(*) as total_sos_alerts,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_sos,
                    SUM(CASE WHEN status = 'pending' OR status = 'acknowledged' THEN 1 ELSE 0 END) as pending_sos
                 FROM sos_cases 
                 WHERE area_id = ?`,
                [zoneId]
            );

            // Get grievance stats
            const [grievanceStats] = await pool.query(
                `SELECT 
                    COUNT(*) as total_grievances,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_grievances
                 FROM grievances 
                 WHERE area_id = ?`,
                [zoneId]
            );

            // Get user distribution by role
            const [userDistribution] = await pool.query(
                `SELECT u.role, COUNT(*) as count
                 FROM user_area_assignments ua
                 JOIN users u ON ua.user_id = u.id
                 WHERE ua.area_id = ? AND ua.is_active = TRUE
                 GROUP BY u.role`,
                [zoneId]
            );

            const distribution = {};
            userDistribution.forEach(row => {
                distribution[row.role] = row.count;
            });

            res.json({
                success: true,
                analytics: {
                    zone_id: zoneId,
                    zone_name: zones[0].name,
                    total_users: userStats[0].total_users || 0,
                    active_users: userStats[0].active_users || 0,
                    total_sos_alerts: sosStats[0].total_sos_alerts || 0,
                    resolved_sos: sosStats[0].resolved_sos || 0,
                    pending_sos: sosStats[0].pending_sos || 0,
                    total_grievances: grievanceStats[0].total_grievances || 0,
                    resolved_grievances: grievanceStats[0].resolved_grievances || 0,
                    user_distribution: distribution,
                },
            });
        } catch (error) {
            console.error('Get zone analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get zone analytics',
            });
        }
    },

    // Get current user's zones
    async getMyZones(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            const [assignments] = await pool.query(
                `SELECT ga.*, ua.role_in_area, ua.is_primary, ua.assigned_at
                 FROM user_area_assignments ua
                 JOIN geographic_areas ga ON ua.area_id = ga.id
                 WHERE ua.user_id = ? AND ua.is_active = TRUE AND ga.is_active = TRUE
                 ORDER BY ua.is_primary DESC, ua.assigned_at DESC`,
                [userId]
            );

            res.json({
                success: true,
                data: assignments,
            });
        } catch (error) {
            console.error('Get my zones error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get zones',
            });
        }
    },

    // Get current user's primary zone
    async getMyZone(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            // Try to get primary zone first
            let [assignments] = await pool.query(
                `SELECT ga.*, ua.role_in_area, ua.is_primary, ua.assigned_at
                 FROM user_area_assignments ua
                 JOIN geographic_areas ga ON ua.area_id = ga.id
                 WHERE ua.user_id = ? AND ua.is_active = TRUE AND ga.is_active = TRUE AND ua.is_primary = TRUE
                 ORDER BY ua.assigned_at DESC
                 LIMIT 1`,
                [userId]
            );

            // If no primary, get any zone
            if (assignments.length === 0) {
                [assignments] = await pool.query(
                    `SELECT ga.*, ua.role_in_area, ua.is_primary, ua.assigned_at
                     FROM user_area_assignments ua
                     JOIN geographic_areas ga ON ua.area_id = ga.id
                     WHERE ua.user_id = ? AND ua.is_active = TRUE AND ga.is_active = TRUE
                     ORDER BY ua.assigned_at DESC
                     LIMIT 1`,
                    [userId]
                );
            }

            if (assignments.length === 0) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'No zone assigned',
                });
            }

            res.json({
                success: true,
                data: assignments[0],
            });
        } catch (error) {
            console.error('Get my zone error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get zone',
            });
        }
    },

    // Get SOS alerts for my zone
    async getMyZoneSOSAlerts(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { status, limit = 50, offset = 0 } = req.query;

            // Get user's zones
            const [assignments] = await pool.query(
                'SELECT area_id FROM user_area_assignments WHERE user_id = ? AND is_active = TRUE',
                [userId]
            );

            if (assignments.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                });
            }

            const areaIds = assignments.map(a => a.area_id);

            let query = `
                SELECT sc.*, u.first_name as victim_first_name, u.last_name as victim_last_name
                FROM sos_cases sc
                LEFT JOIN users u ON sc.victim_user_id = u.id
                WHERE sc.area_id IN (${areaIds.map(() => '?').join(',')})
            `;
            const params = [...areaIds];

            if (status) {
                query += ' AND sc.status = ?';
                params.push(status);
            }

            query += ' ORDER BY sc.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [alerts] = await pool.query(query, params);

            res.json({
                success: true,
                data: alerts,
            });
        } catch (error) {
            console.error('Get my zone SOS alerts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get SOS alerts',
            });
        }
    },
};

module.exports = zoneController;

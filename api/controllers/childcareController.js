const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const safeJsonParse = (str, defaultVal = []) => {
    try {
        return str ? JSON.parse(str) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
};

const FIELD_MAPPING = {
    firstName: 'first_name',
    lastName: 'last_name',
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
    bloodGroup: 'blood_group',
    allergies: 'allergies',
    medications: 'medications',
    emergencyContact: 'emergency_contact',
    notes: 'notes',
};

const ALLOWED_DB_FIELDS = Object.values(FIELD_MAPPING);

const defaultTips = [
    { id: 'tip-1', category: 'nutrition', title: 'Healthy Eating Habits', content: 'Ensure your child eats a variety of fruits, vegetables, whole grains, and lean proteins.', ageRange: '1-5 years', icon: 'nutrition' },
    { id: 'tip-2', category: 'sleep', title: 'Importance of Sleep', content: 'Toddlers need 11-14 hours of sleep per day, including naps.', ageRange: '1-5 years', icon: 'moon' },
    { id: 'tip-3', category: 'safety', title: 'Home Safety', content: 'Childproof your home by securing cabinets and covering electrical outlets.', ageRange: '0-5 years', icon: 'shield' },
    { id: 'tip-4', category: 'development', title: 'Reading Together', content: 'Read to your child daily to develop language skills.', ageRange: '0-5 years', icon: 'book' },
    { id: 'tip-5', category: 'health', title: 'Regular Checkups', content: 'Schedule regular pediatric checkups and vaccinations.', ageRange: '0-5 years', icon: 'medical' },
    { id: 'tip-6', category: 'activity', title: 'Physical Activity', content: 'Encourage at least 60 minutes of physical activity daily.', ageRange: '2-5 years', icon: 'fitness' },
    { id: 'tip-7', category: 'screen_time', title: 'Screen Time Limits', content: 'Limit screen time to 1 hour per day for ages 2-5.', ageRange: '0-5 years', icon: 'tv' },
    { id: 'tip-8', category: 'social', title: 'Social Skills', content: 'Arrange playdates to help develop social skills.', ageRange: '2-5 years', icon: 'people' },
];

const childcareController = {
    // Get all childcare tips
    async getTips(req, res) {
        try {
            const { category } = req.query;
            let tips = [...defaultTips];
            if (category) tips = tips.filter(tip => tip.category === category);
            res.json({ success: true, count: tips.length, data: tips });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get tips' });
        }
    },

    async getTipById(req, res) {
        try {
            const tip = defaultTips.find(t => t.id === req.params.tipId);
            if (!tip) return res.status(404).json({ success: false, message: 'Tip not found' });
            res.json({ success: true, data: tip });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get tip' });
        }
    },

    // Get all children
    async getChildren(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            try {
                const [children] = await pool.query(
                    `SELECT c.*, u.first_name as parent_first_name, u.last_name as parent_last_name
                     FROM children c JOIN users u ON c.parent_id = u.id WHERE c.parent_id = ? ORDER BY c.date_of_birth ASC`,
                    [userId]
                );

                const [schedules] = await pool.query(
                    'SELECT * FROM child_schedules WHERE parent_id = ? ORDER BY schedule_time ASC',
                    [userId]
                );

                const [alerts] = await pool.query(
                    'SELECT * FROM child_alerts WHERE parent_id = ? ORDER BY created_at DESC LIMIT 20',
                    [userId]
                );

                const formattedChildren = children.map(child => {
                    const childSchedules = schedules.filter(s => s.child_id === child.id);
                    const childAlerts = alerts.filter(a => a.child_id === child.id);
                    return {
                        id: child.id,
                        firstName: child.first_name,
                        lastName: child.last_name,
                        dateOfBirth: child.date_of_birth,
                        gender: child.gender,
                        bloodGroup: child.blood_group,
                        allergies: safeJsonParse(child.allergies, []),
                        medications: safeJsonParse(child.medications, []),
                        emergencyContact: child.emergency_contact,
                        notes: child.notes,
                        schedules: childSchedules,
                        alerts: childAlerts,
                        parentName: `${child.parent_first_name} ${child.parent_last_name}`,
                    };
                });

                res.json({ success: true, count: formattedChildren.length, data: formattedChildren });
            } catch (dbError) {
                res.json({ success: true, count: 0, data: [] });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get children' });
        }
    },

    async getChildById(req, res) {
        try {
            const pool = getPool();
            const { childId } = req.params;
            const userId = req.user.id;

            const [children] = await pool.query(
                'SELECT c.*, u.first_name as parent_first_name, u.last_name as parent_last_name FROM children c JOIN users u ON c.parent_id = u.id WHERE c.id = ? AND c.parent_id = ?',
                [childId, userId]
            );

            if (children.length === 0) return res.status(404).json({ success: false, message: 'Child not found' });

            const child = children[0];
            const [schedules] = await pool.query('SELECT * FROM child_schedules WHERE child_id = ?', [childId]);
            const [alerts] = await pool.query('SELECT * FROM child_alerts WHERE child_id = ? ORDER BY created_at DESC LIMIT 10', [childId]);
            const [locations] = await pool.query('SELECT * FROM child_locations WHERE child_id = ? ORDER BY timestamp DESC LIMIT 20', [childId]);

            res.json({
                success: true,
                data: {
                    id: child.id,
                    firstName: child.first_name,
                    lastName: child.last_name,
                    dateOfBirth: child.date_of_birth,
                    gender: child.gender,
                    bloodGroup: child.blood_group,
                    allergies: safeJsonParse(child.allergies, []),
                    medications: safeJsonParse(child.medications, []),
                    emergencyContact: child.emergency_contact,
                    notes: child.notes,
                    schedules,
                    alerts,
                    locations,
                    parentName: `${child.parent_first_name} ${child.parent_last_name}`,
                },
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get child' });
        }
    },

    async createChild(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { firstName, lastName, dateOfBirth, gender, bloodGroup, allergies, medications, emergencyContact, notes, schoolLocation } = req.body;

            if (!firstName || !dateOfBirth) {
                return res.status(400).json({ success: false, message: 'First name and date of birth are required' });
            }

            const childId = uuidv4();

            await pool.query(
                `INSERT INTO children (id, parent_id, first_name, last_name, date_of_birth, gender, blood_group, allergies, medications, emergency_contact, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [childId, userId, firstName, lastName || null, dateOfBirth, gender || null, bloodGroup || null, allergies ? JSON.stringify(allergies) : '[]', medications ? JSON.stringify(medications) : '[]', emergencyContact || null, notes || null]
            );

            if (schoolLocation) {
                await pool.query(
                    `INSERT INTO child_school_zones (id, child_id, name, latitude, longitude, radius, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), childId, schoolLocation.name || 'School', schoolLocation.latitude, schoolLocation.longitude, schoolLocation.radius || 200, 'school']
                );
            }

            res.status(201).json({
                success: true,
                message: 'Child added successfully',
                data: { id: childId, firstName, lastName, dateOfBirth, gender, bloodGroup, parentId: userId },
            });
        } catch (error) {
            console.error('Create child error:', error);
            res.status(500).json({ success: false, message: 'Failed to add child' });
        }
    },

    async updateChild(req, res) {
        try {
            const pool = getPool();
            const { childId } = req.params;
            const userId = req.user.id;
            const updates = req.body;

            const [existing] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [childId, userId]);
            if (existing.length === 0) return res.status(404).json({ success: false, message: 'Child not found' });

            const setClause = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                const dbField = FIELD_MAPPING[key];
                if (dbField && ALLOWED_DB_FIELDS.includes(dbField)) {
                    setClause.push(`${dbField} = ?`);
                    values.push(key === 'allergies' || key === 'medications' ? JSON.stringify(value) : value);
                }
            }

            if (setClause.length === 0) return res.status(400).json({ success: false, message: 'No valid fields to update' });

            values.push(childId);
            await pool.query(`UPDATE children SET ${setClause.join(', ')} WHERE id = ?`, values);
            res.json({ success: true, message: 'Child updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update child' });
        }
    },

    async deleteChild(req, res) {
        try {
            const pool = getPool();
            const { childId } = req.params;
            const userId = req.user.id;

            const [existing] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [childId, userId]);
            if (existing.length === 0) return res.status(404).json({ success: false, message: 'Child not found' });

            await pool.query('DELETE FROM children WHERE id = ?', [childId]);
            res.json({ success: true, message: 'Child removed successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to remove child' });
        }
    },

    // Schedule Management
    async addSchedule(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId, title, scheduleTime, repeatDays, alertType } = req.body;

            if (!childId || !title || !scheduleTime) {
                return res.status(400).json({ success: false, message: 'childId, title and scheduleTime are required' });
            }

            const [child] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [childId, userId]);
            if (child.length === 0) return res.status(404).json({ success: false, message: 'Child not found' });

            const scheduleId = uuidv4();
            await pool.query(
                `INSERT INTO child_schedules (id, child_id, parent_id, title, schedule_time, repeat_days, alert_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [scheduleId, childId, userId, title, scheduleTime, repeatDays ? JSON.stringify(repeatDays) : '[]', alertType || 'notification']
            );

            res.status(201).json({ success: true, message: 'Schedule added', data: { id: scheduleId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add schedule' });
        }
    },

    async getSchedules(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId, date } = req.query;

            let query = 'SELECT cs.*, c.first_name as child_name FROM child_schedules cs JOIN children c ON cs.child_id = c.id WHERE cs.parent_id = ?';
            const params = [userId];

            if (childId) {
                query += ' AND cs.child_id = ?';
                params.push(childId);
            }

            query += ' ORDER BY cs.schedule_time ASC';
            const [schedules] = await pool.query(query, params);

            res.json({ success: true, data: schedules.map(s => ({ ...s, repeatDays: safeJsonParse(s.repeat_days, []) })) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get schedules' });
        }
    },

    async deleteSchedule(req, res) {
        try {
            const pool = getPool();
            const { scheduleId } = req.params;
            const userId = req.user.id;

            await pool.query('DELETE FROM child_schedules WHERE id = ? AND parent_id = ?', [scheduleId, userId]);
            res.json({ success: true, message: 'Schedule deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete schedule' });
        }
    },

    // Alerts Management
    async getAlerts(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId, type, unreadOnly } = req.query;

            let query = 'SELECT ca.*, c.first_name as child_name FROM child_alerts ca JOIN children c ON ca.child_id = c.id WHERE ca.parent_id = ?';
            const params = [userId];

            if (childId) {
                query += ' AND ca.child_id = ?';
                params.push(childId);
            }
            if (type) {
                query += ' AND ca.alert_type = ?';
                params.push(type);
            }
            if (unreadOnly === 'true') {
                query += ' AND ca.is_read = FALSE';
            }

            query += ' ORDER BY ca.created_at DESC LIMIT 50';
            const [alerts] = await pool.query(query, params);

            res.json({ success: true, count: alerts.length, data: alerts });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get alerts' });
        }
    },

    async markAlertRead(req, res) {
        try {
            const pool = getPool();
            const { alertId } = req.params;
            const userId = req.user.id;

            await pool.query('UPDATE child_alerts SET is_read = TRUE WHERE id = ? AND parent_id = ?', [alertId, userId]);
            res.json({ success: true, message: 'Alert marked as read' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update alert' });
        }
    },

    // Location Tracking
    async updateChildLocation(req, res) {
        try {
            const pool = getPool();
            const { childId, latitude, longitude, locationType } = req.body;
            const userId = req.user.id;

            const [child] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [childId, userId]);
            if (child.length === 0) return res.status(404).json({ success: false, message: 'Child not found' });

            const locationId = uuidv4();
            await pool.query(
                `INSERT INTO child_locations (id, child_id, latitude, longitude, location_type, timestamp) VALUES (?, ?, ?, ?, ?, NOW())`,
                [locationId, childId, latitude, longitude, locationType || 'current']
            );

            const [schoolZones] = await pool.query('SELECT * FROM child_school_zones WHERE child_id = ? AND type = ?', [childId, 'school']);

            for (const zone of schoolZones) {
                const distance = calculateDistance(latitude, longitude, zone.latitude, zone.longitude);
                if (distance <= zone.radius) {
                    const alertType = locationType === 'arrival' ? 'school_arrival' : 'school_departure';
                    await pool.query(
                        `INSERT INTO child_alerts (id, child_id, parent_id, alert_type, title, message, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [uuidv4(), childId, userId, alertType, `${child[0].first_name} ${alertType === 'school_arrival' ? 'arrived at' : 'left'} school`, `Location: ${latitude}, ${longitude}`, latitude, longitude]
                    );
                }
            }

            res.json({ success: true, message: 'Location updated' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update location' });
        }
    },

    async getChildLocations(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId, date } = req.query;

            let query = 'SELECT cl.* FROM child_locations cl JOIN children c ON cl.child_id = c.id WHERE c.parent_id = ?';
            const params = [userId];

            if (childId) {
                query += ' AND cl.child_id = ?';
                params.push(childId);
            }
            if (date) {
                query += ' AND DATE(cl.timestamp) = ?';
                params.push(date);
            }

            query += ' ORDER BY cl.timestamp DESC LIMIT 100';
            const [locations] = await pool.query(query, params);

            res.json({ success: true, data: locations });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get locations' });
        }
    },

    // School Zones
    async addSchoolZone(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId, name, latitude, longitude, radius } = req.body;

            const zoneId = uuidv4();
            await pool.query(
                `INSERT INTO child_school_zones (id, child_id, name, latitude, longitude, radius, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [zoneId, childId, name || 'School Zone', latitude, longitude, radius || 200, 'school']
            );

            res.status(201).json({ success: true, data: { id: zoneId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add school zone' });
        }
    },

    async getSchoolZones(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId } = req.query;

            let query = 'SELECT csz.*, c.first_name as child_name FROM child_school_zones csz JOIN children c ON csz.child_id = c.id WHERE c.parent_id = ?';
            const params = [userId];

            if (childId) {
                query += ' AND csz.child_id = ?';
                params.push(childId);
            }

            const [zones] = await pool.query(query, params);
            res.json({ success: true, data: zones });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get school zones' });
        }
    },

    // Safety Check-In
    async createSafetyCheck(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId, checkInTime, checkOutTime, status, notes } = req.body;

            const checkId = uuidv4();
            await pool.query(
                `INSERT INTO child_safety_checks (id, child_id, parent_id, check_in_time, check_out_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [checkId, childId, userId, checkInTime || new Date(), checkOutTime, status || 'checked_in', notes || null]
            );

            res.status(201).json({ success: true, data: { id: checkId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create safety check' });
        }
    },

    async getSafetyChecks(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { childId, date } = req.query;

            let query = 'SELECT csc.*, c.first_name as child_name FROM child_safety_checks csc JOIN children c ON csc.child_id = c.id WHERE c.parent_id = ?';
            const params = [userId];

            if (childId) {
                query += ' AND csc.child_id = ?';
                params.push(childId);
            }
            if (date) {
                query += ' AND DATE(csc.check_in_time) = ?';
                params.push(date);
            }

            query += ' ORDER BY csc.check_in_time DESC LIMIT 20';
            const [checks] = await pool.query(query, params);
            res.json({ success: true, data: checks });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get safety checks' });
        }
    },

    // Admin: Get all children across all users
    async adminGetAllChildren(req, res) {
        try {
            const pool = getPool();
            const { limit = 50, offset = 0, search } = req.query;

            let query = `SELECT c.*, u.first_name as parent_first_name, u.last_name as parent_last_name, u.email as parent_email
                         FROM children c JOIN users u ON c.parent_id = u.id WHERE 1=1`;
            const params = [];

            if (search) {
                query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR u.email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [children] = await pool.query(query, params);
            const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM children');

            const formattedChildren = children.map(child => ({
                id: child.id,
                firstName: child.first_name,
                lastName: child.last_name,
                dateOfBirth: child.date_of_birth,
                gender: child.gender,
                bloodGroup: child.blood_group,
                allergies: safeJsonParse(child.allergies, []),
                medications: safeJsonParse(child.medications, []),
                emergencyContact: child.emergency_contact,
                notes: child.notes,
                parentName: `${child.parent_first_name} ${child.parent_last_name}`,
                parentEmail: child.parent_email,
                createdAt: child.created_at,
            }));

            res.json({ success: true, data: formattedChildren, total });
        } catch (error) {
            console.error('Admin get children error:', error);
            res.status(500).json({ success: false, message: 'Failed to get children' });
        }
    },

    // Admin: Create child for any user
    async adminCreateChild(req, res) {
        try {
            const pool = getPool();
            const { parentId, firstName, lastName, dateOfBirth, gender, bloodGroup, allergies, medications, emergencyContact, notes, schoolLocation } = req.body;

            if (!firstName || !dateOfBirth || !parentId) {
                return res.status(400).json({ success: false, message: 'First name, date of birth, and parentId are required' });
            }

            const childId = uuidv4();

            await pool.query(
                `INSERT INTO children (id, parent_id, first_name, last_name, date_of_birth, gender, blood_group, allergies, medications, emergency_contact, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [childId, parentId, firstName, lastName || null, dateOfBirth, gender || null, bloodGroup || null, allergies ? JSON.stringify(allergies) : '[]', medications ? JSON.stringify(medications) : '[]', emergencyContact || null, notes || null]
            );

            if (schoolLocation) {
                await pool.query(
                    `INSERT INTO child_school_zones (id, child_id, name, latitude, longitude, radius, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), childId, schoolLocation.name || 'School', schoolLocation.latitude, schoolLocation.longitude, schoolLocation.radius || 200, 'school']
                );
            }

            res.status(201).json({
                success: true,
                message: 'Child added successfully',
                data: { id: childId, firstName, lastName, dateOfBirth, gender, bloodGroup, parentId },
            });
        } catch (error) {
            console.error('Admin create child error:', error);
            res.status(500).json({ success: false, message: 'Failed to add child' });
        }
    },

    // Admin: Update child
    async adminUpdateChild(req, res) {
        try {
            const pool = getPool();
            const { childId } = req.params;
            const updates = req.body;

            const [existing] = await pool.query('SELECT * FROM children WHERE id = ?', [childId]);
            if (existing.length === 0) return res.status(404).json({ success: false, message: 'Child not found' });

            const setClause = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                const dbField = FIELD_MAPPING[key];
                if (dbField && ALLOWED_DB_FIELDS.includes(dbField)) {
                    setClause.push(`${dbField} = ?`);
                    values.push(key === 'allergies' || key === 'medications' ? JSON.stringify(value) : value);
                }
            }

            if (setClause.length === 0) return res.status(400).json({ success: false, message: 'No valid fields to update' });

            values.push(childId);
            await pool.query(`UPDATE children SET ${setClause.join(', ')} WHERE id = ?`, values);
            res.json({ success: true, message: 'Child updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update child' });
        }
    },

    // Admin: Get all schedules
    async adminGetAllSchedules(req, res) {
        try {
            const pool = getPool();
            const { limit = 50, offset = 0 } = req.query;

            const [schedules] = await pool.query(
                `SELECT cs.*, c.first_name as child_name, u.first_name as parent_first_name, u.last_name as parent_last_name
                 FROM child_schedules cs
                 JOIN children c ON cs.child_id = c.id
                 JOIN users u ON cs.parent_id = u.id
                 ORDER BY cs.created_at DESC
                 LIMIT ? OFFSET ?`,
                [parseInt(limit), parseInt(offset)]
            );

            res.json({ success: true, data: schedules.map(s => ({ ...s, repeatDays: safeJsonParse(s.repeat_days, []) })) });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get schedules' });
        }
    },

    // Admin: Delete schedule
    async adminDeleteSchedule(req, res) {
        try {
            const pool = getPool();
            const { scheduleId } = req.params;

            await pool.query('DELETE FROM child_schedules WHERE id = ?', [scheduleId]);
            res.json({ success: true, message: 'Schedule deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete schedule' });
        }
    },

    // Admin: Get all alerts
    async adminGetAllAlerts(req, res) {
        try {
            const pool = getPool();
            const { limit = 50, offset = 0, type } = req.query;

            let query = `SELECT ca.*, c.first_name as child_name, u.first_name as parent_first_name, u.last_name as parent_last_name
                         FROM child_alerts ca
                         JOIN children c ON ca.child_id = c.id
                         JOIN users u ON ca.parent_id = u.id
                         WHERE 1=1`;
            const params = [];

            if (type) {
                query += ' AND ca.alert_type = ?';
                params.push(type);
            }

            query += ' ORDER BY ca.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [alerts] = await pool.query(query, params);
            res.json({ success: true, data: alerts });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get alerts' });
        }
    },

    // Admin: Get school zones
    async adminGetSchoolZones(req, res) {
        try {
            const pool = getPool();

            const [zones] = await pool.query(
                `SELECT csz.*, c.first_name as child_name, u.first_name as parent_first_name, u.last_name as parent_last_name
                 FROM child_school_zones csz
                 JOIN children c ON csz.child_id = c.id
                 JOIN users u ON c.parent_id = u.id
                 ORDER BY csz.created_at DESC`
            );
            res.json({ success: true, data: zones });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get school zones' });
        }
    },

    // Admin: Create school zone
    async adminCreateSchoolZone(req, res) {
        try {
            const pool = getPool();
            const { childId, name, latitude, longitude, radius } = req.body;

            if (!childId || !latitude || !longitude) {
                return res.status(400).json({ success: false, message: 'childId, latitude, and longitude are required' });
            }

            const zoneId = uuidv4();
            await pool.query(
                `INSERT INTO child_school_zones (id, child_id, name, latitude, longitude, radius, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [zoneId, childId, name || 'School Zone', latitude, longitude, radius || 200, 'school']
            );

            res.status(201).json({ success: true, data: { id: zoneId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create school zone' });
        }
    },
};

// Helper function
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = childcareController;

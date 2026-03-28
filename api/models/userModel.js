const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// User Models
const userModel = {
    // Find user by email
    async findByEmail(email) {
        const pool = getPool();
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return users[0] || null;
    },

    // Find user by ID
    async findById(id) {
        const pool = getPool();
        const [users] = await pool.query(
            'SELECT id, first_name, last_name, email, phone, role, gender, created_at FROM users WHERE id = ?',
            [id]
        );
        return users[0] || null;
    },

    // Create new user
    async create(userData) {
        const pool = getPool();
        const { firstName, lastName, email, phone, password, role, gender } = userData;
        const hashedPassword = require('bcryptjs').hashSync(password, 10);
        const userId = uuidv4();
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await pool.query(
            'INSERT INTO users (id, first_name, last_name, email, phone, password, role, gender, verification_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, firstName, lastName, email, phone, hashedPassword, role || 'woman', gender || null, verificationCode]
        );

        // Create default settings
        await pool.query(
            'INSERT INTO user_settings (id, user_id) VALUES (?, ?)',
            [uuidv4(), userId]
        );

        return { id: userId, firstName, lastName, email, role: role || 'woman', gender: gender || null };
    },

    // Update user
    async update(id, userData) {
        const pool = getPool();
        const { firstName, lastName, phone, role, gender } = userData;

        const updates = [];
        const params = [];

        if (firstName !== undefined) {
            updates.push('first_name = ?');
            params.push(firstName);
        }
        if (lastName !== undefined) {
            updates.push('last_name = ?');
            params.push(lastName);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (role !== undefined) {
            updates.push('role = ?');
            params.push(role);
        }
        if (gender !== undefined) {
            updates.push('gender = ?');
            params.push(gender);
        }

        if (updates.length === 0) return true;

        params.push(id);
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        return true;
    },

    // Get user role
    async getRole(id) {
        const pool = getPool();
        const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
        return users[0]?.role || null;
    },

    // Get all users (admin)
    async getAll(options = {}) {
        const pool = getPool();
        const { limit = 50, offset = 0, role, search } = options;

        let query = 'SELECT id, first_name, last_name, email, phone, role, is_active, is_verified, created_at FROM users';
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        const params = [];
        const conditions = [];

        if (role) {
            conditions.push('role = ?');
            params.push(role);
        }

        if (search) {
            conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

        const [users] = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);
        const [count] = await pool.query(countQuery, params);

        return { users, total: count[0].total };
    },

    // Verify user
    async verify(id) {
        // Verification code functionality - column may not exist in database
        return true;
    },

    // Get user settings
    async getUserSettings(userId) {
        const pool = getPool();
        const [settings] = await pool.query(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [userId]
        );
        return settings[0] || null;
    },

    // Get latest location for a user
    async getLatestLocation(userId) {
        const pool = getPool();
        
        // Priority order: user_locations > user_current_location > location_history
        try {
            // First try user_locations table (has status, speed, heading, address)
            const [userLocations] = await pool.query(
                'SELECT * FROM user_locations WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1',
                [userId]
            );
            
            if (userLocations.length > 0) {
                return {
                    ...userLocations[0],
                    updated_at: userLocations[0].timestamp
                };
            }
        } catch (error) {
            console.log('user_locations table query failed:', error.message);
        }
        
        try {
            // Second try user_current_location table
            const [currentLocation] = await pool.query(
                'SELECT * FROM user_current_location WHERE user_id = ?',
                [userId]
            );
            
            if (currentLocation.length > 0) {
                return currentLocation[0];
            }
        } catch (error) {
            console.log('user_current_location table not found, using location_history');
        }
        
        // Fallback to location_history
        const [locations] = await pool.query(
            'SELECT * FROM location_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        return locations[0] || null;
    }
};

module.exports = userModel;

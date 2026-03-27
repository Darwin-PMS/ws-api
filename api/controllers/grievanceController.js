const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const pool = () => getPool();

const generateId = () => uuidv4();

const generateCaseId = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `GV-${dateStr}-`;
    
    const [lastGrievance] = await pool().query(
        `SELECT case_id FROM grievances WHERE case_id LIKE ? ORDER BY case_id DESC LIMIT 1`,
        [`${prefix}%`]
    );
    
    let sequence = 1;
    if (lastGrievance.length > 0 && lastGrievance[0].case_id) {
        const lastSequence = parseInt(lastGrievance[0].case_id.split('-')[2], 10);
        sequence = lastSequence + 1;
    }
    
    return `${prefix}${String(sequence).padStart(7, '0')}`;
};

// ============================================
// GRIEVANCES
// ============================================

// Get all grievances (admin only)
const getAllGrievances = async (req, res) => {
    try {
        const { status, priority, category, user_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT g.*, 
                   u.first_name as user_first_name, 
                   u.last_name as user_last_name, 
                   u.email as user_email,
                   u.phone as user_phone,
                   a.first_name as assigned_first_name,
                   a.last_name as assigned_last_name
            FROM grievances g
            LEFT JOIN users u ON g.user_id = u.id
            LEFT JOIN users a ON g.assigned_to = a.id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM grievances WHERE 1=1';
        const params = [];
        const countParams = [];

        if (status) {
            query += ' AND g.status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
            countParams.push(status);
        }

        if (priority) {
            query += ' AND g.priority = ?';
            countQuery += ' AND priority = ?';
            params.push(priority);
            countParams.push(priority);
        }

        if (category) {
            query += ' AND g.category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (user_id) {
            query += ' AND g.user_id = ?';
            countQuery += ' AND user_id = ?';
            params.push(user_id);
            countParams.push(user_id);
        }

        query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool().query(query, params);
        const [[{ total }]] = await pool().query(countQuery, countParams);

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching grievances:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch grievances' });
    }
};

// Get grievance by ID
const getGrievanceById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool().query(`
            SELECT g.*, 
                   u.first_name as user_first_name, 
                   u.last_name as user_last_name, 
                   u.email as user_email,
                   u.phone as user_phone,
                   a.first_name as assigned_first_name,
                   a.last_name as assigned_last_name
            FROM grievances g
            LEFT JOIN users u ON g.user_id = u.id
            LEFT JOIN users a ON g.assigned_to = a.id
            WHERE g.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching grievance:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch grievance' });
    }
};

// Create new grievance (user)
const createGrievance = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, category, priority = 'medium' } = req.body;

        if (!title || !description) {
            return res.status(400).json({ 
                success: false, 
                error: 'Title and description are required' 
            });
        }

        const id = generateId();
        const caseId = await generateCaseId();
        await pool().query(
            `INSERT INTO grievances (id, case_id, user_id, title, description, category, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, caseId, userId, title, description, category, priority]
        );

        const [newGrievance] = await pool().query('SELECT * FROM grievances WHERE id = ?', [id]);
        res.status(201).json({ 
            success: true, 
            data: newGrievance[0], 
            message: 'Grievance submitted successfully' 
        });
    } catch (error) {
        console.error('Error creating grievance:', error);
        res.status(500).json({ success: false, error: 'Failed to create grievance' });
    }
};

// Update grievance status (admin)
const updateGrievanceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, assigned_to, resolution_notes } = req.body;

        const [existing] = await pool().query('SELECT * FROM grievances WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        await pool().query(
            `UPDATE grievances SET 
                status = COALESCE(?, status),
                priority = COALESCE(?, priority),
                assigned_to = COALESCE(?, assigned_to),
                resolution_notes = COALESCE(?, resolution_notes)
             WHERE id = ?`,
            [status, priority, assigned_to, resolution_notes, id]
        );

        const [updated] = await pool().query(`
            SELECT g.*, 
                   u.first_name as user_first_name, 
                   u.last_name as user_last_name
            FROM grievances g
            LEFT JOIN users u ON g.user_id = u.id
            WHERE g.id = ?
        `, [id]);

        res.json({ 
            success: true, 
            data: updated[0], 
            message: 'Grievance updated successfully' 
        });
    } catch (error) {
        console.error('Error updating grievance:', error);
        res.status(500).json({ success: false, error: 'Failed to update grievance' });
    }
};

// Assign grievance to admin (admin)
const assignGrievance = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_to } = req.body;

        if (!assigned_to) {
            return res.status(400).json({ success: false, error: 'Assigned admin ID is required' });
        }

        // Verify admin exists and has admin role
        const [users] = await pool().query(
            'SELECT id FROM users WHERE id = ? AND role = ?', 
            [assigned_to, 'admin']
        );
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin user not found' });
        }

        const [existing] = await pool().query('SELECT * FROM grievances WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        await pool().query(
            `UPDATE grievances SET assigned_to = ?, status = 'in_progress' WHERE id = ?`,
            [assigned_to, id]
        );

        const [updated] = await pool().query('SELECT * FROM grievances WHERE id = ?', [id]);
        res.json({ success: true, data: updated[0], message: 'Grievance assigned successfully' });
    } catch (error) {
        console.error('Error assigning grievance:', error);
        res.status(500).json({ success: false, error: 'Failed to assign grievance' });
    }
};

// Delete grievance (admin)
const deleteGrievance = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool().query('SELECT * FROM grievances WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        await pool().query('DELETE FROM grievances WHERE id = ?', [id]);
        res.json({ success: true, message: 'Grievance deleted successfully' });
    } catch (error) {
        console.error('Error deleting grievance:', error);
        res.status(500).json({ success: false, error: 'Failed to delete grievance' });
    }
};

// Get grievance statistics
const getGrievanceStats = async (req, res) => {
    try {
        const [[total]] = await pool().query('SELECT COUNT(*) as count FROM grievances');
        const [[pending]] = await pool().query("SELECT COUNT(*) as count FROM grievances WHERE status = 'pending'");
        const [[inProgress]] = await pool().query("SELECT COUNT(*) as count FROM grievances WHERE status = 'in_progress'");
        const [[resolved]] = await pool().query("SELECT COUNT(*) as count FROM grievances WHERE status = 'resolved'");
        const [[rejected]] = await pool().query("SELECT COUNT(*) as count FROM grievances WHERE status = 'rejected'");
        const [[urgent]] = await pool().query("SELECT COUNT(*) as count FROM grievances WHERE priority = 'urgent'");

        const [byCategory] = await pool().query(`
            SELECT category, COUNT(*) as count 
            FROM grievances 
            GROUP BY category 
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: {
                total: total.count,
                pending: pending.count,
                inProgress: inProgress.count,
                resolved: resolved.count,
                rejected: rejected.count,
                urgent: urgent.count,
                byCategory
            }
        });
    } catch (error) {
        console.error('Error fetching grievance stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
};

// Get user's grievances
const getUserGrievances = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [rows] = await pool().query(
            'SELECT * FROM grievances WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [user_id, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await pool().query(
            'SELECT COUNT(*) as total FROM grievances WHERE user_id = ?',
            [user_id]
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user grievances:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch grievances' });
    }
};

// Get user's grievances (by token)
const getUserGrievancesByToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [rows] = await pool().query(
            'SELECT * FROM grievances WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await pool().query(
            'SELECT COUNT(*) as total FROM grievances WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user grievances:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch grievances' });
    }
};

// Update grievance (user can update their own)
const updateGrievance = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, category, priority } = req.body;

        const [existing] = await pool().query('SELECT * FROM grievances WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        // Only allow update if user owns the grievance and it's still pending
        if (existing[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this grievance' });
        }

        if (existing[0].status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Cannot update grievance after it has been processed' });
        }

        await pool().query(
            `UPDATE grievances SET 
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                category = COALESCE(?, category),
                priority = COALESCE(?, priority)
             WHERE id = ?`,
            [title, description, category, priority, id]
        );

        const [updated] = await pool().query('SELECT * FROM grievances WHERE id = ?', [id]);
        res.json({ success: true, data: updated[0], message: 'Grievance updated successfully' });
    } catch (error) {
        console.error('Error updating grievance:', error);
        res.status(500).json({ success: false, error: 'Failed to update grievance' });
    }
};

// ============================================
// GRIEVANCE MESSAGES (Conversations)
// ============================================

const getGrievanceWithMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const [grievance] = await pool().query(`
            SELECT g.*, 
                   u.first_name as user_first_name, 
                   u.last_name as user_last_name, 
                   u.email as user_email,
                   u.phone as user_phone,
                   a.first_name as assigned_first_name,
                   a.last_name as assigned_last_name
            FROM grievances g
            LEFT JOIN users u ON g.user_id = u.id
            LEFT JOIN users a ON g.assigned_to = a.id
            WHERE g.id = ?
        `, [id]);

        if (grievance.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        if (!isAdmin && grievance[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const [messages] = await pool().query(`
            SELECT gm.*, 
                   u.first_name as sender_first_name,
                   u.last_name as sender_last_name
            FROM grievance_messages gm
            LEFT JOIN users u ON gm.user_id = u.id
            WHERE gm.grievance_id = ?
            ORDER BY gm.created_at ASC
        `, [id]);

        res.json({ 
            success: true, 
            data: {
                ...grievance[0],
                messages
            } 
        });
    } catch (error) {
        console.error('Error fetching grievance with messages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch grievance details' });
    }
};

const addGrievanceMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const [grievance] = await pool().query(
            'SELECT * FROM grievances WHERE id = ?',
            [id]
        );

        if (grievance.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        if (!isAdmin && grievance[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const messageId = generateId();
        await pool().query(
            `INSERT INTO grievance_messages (id, grievance_id, user_id, message, is_admin)
             VALUES (?, ?, ?, ?, ?)`,
            [messageId, id, userId, message.trim(), isAdmin]
        );

        const [newMessage] = await pool().query(`
            SELECT gm.*, 
                   u.first_name as sender_first_name,
                   u.last_name as sender_last_name
            FROM grievance_messages gm
            LEFT JOIN users u ON gm.user_id = u.id
            WHERE gm.id = ?
        `, [messageId]);

        res.status(201).json({ 
            success: true, 
            data: newMessage[0],
            message: 'Message sent successfully' 
        });
    } catch (error) {
        console.error('Error adding grievance message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
};

const getGrievanceMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const [grievance] = await pool().query(
            'SELECT * FROM grievances WHERE id = ?',
            [id]
        );

        if (grievance.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance not found' });
        }

        if (!isAdmin && grievance[0].user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const [messages] = await pool().query(`
            SELECT gm.*, 
                   u.first_name as sender_first_name,
                   u.last_name as sender_last_name
            FROM grievance_messages gm
            LEFT JOIN users u ON gm.user_id = u.id
            WHERE gm.grievance_id = ?
            ORDER BY gm.created_at ASC
        `, [id]);

        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
};

module.exports = {
    getAllGrievances,
    getGrievanceById,
    createGrievance,
    updateGrievanceStatus,
    assignGrievance,
    deleteGrievance,
    getGrievanceStats,
    getUserGrievances,
    getUserGrievancesByToken,
    updateGrievance,
    getGrievanceWithMessages,
    addGrievanceMessage,
    getGrievanceMessages,
};

const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const pool = () => getPool();

// Helper function to generate UUID
const generateId = () => uuidv4();

// ============================================
// TUTORIALS
// ============================================

const getAllTutorials = async (req, res) => {
    try {
        const { category, difficulty, is_active, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM safety_tutorials WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM safety_tutorials WHERE 1=1';
        const params = [];
        const countParams = [];

        if (category) {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (difficulty) {
            query += ' AND difficulty = ?';
            countQuery += ' AND difficulty = ?';
            params.push(difficulty);
            countParams.push(difficulty);
        }

        if (is_active !== undefined) {
            query += ' AND is_active = ?';
            countQuery += ' AND is_active = ?';
            params.push(is_active === 'true');
            countParams.push(is_active === 'true');
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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
        console.error('Error fetching tutorials:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tutorials' });
    }
};

const getTutorialById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool().query('SELECT * FROM safety_tutorials WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Tutorial not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching tutorial:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tutorial' });
    }
};

const createTutorial = async (req, res) => {
    try {
        const { title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active = true } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const id = generateId();
        await pool().query(
            `INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, description, content, category, image_url, video_url, duration || 0, difficulty || 'beginner', is_premium || false, is_active]
        );

        const [newTutorial] = await pool().query('SELECT * FROM safety_tutorials WHERE id = ?', [id]);
        res.status(201).json({ success: true, data: newTutorial[0], message: 'Tutorial created successfully' });
    } catch (error) {
        console.error('Error creating tutorial:', error);
        res.status(500).json({ success: false, error: 'Failed to create tutorial' });
    }
};

const updateTutorial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active } = req.body;

        const [existing] = await pool().query('SELECT * FROM safety_tutorials WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Tutorial not found' });
        }

        await pool().query(
            `UPDATE safety_tutorials SET 
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                content = COALESCE(?, content),
                category = COALESCE(?, category),
                image_url = COALESCE(?, image_url),
                video_url = COALESCE(?, video_url),
                duration = COALESCE(?, duration),
                difficulty = COALESCE(?, difficulty),
                is_premium = COALESCE(?, is_premium),
                is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, id]
        );

        const [updated] = await pool().query('SELECT * FROM safety_tutorials WHERE id = ?', [id]);
        res.json({ success: true, data: updated[0], message: 'Tutorial updated successfully' });
    } catch (error) {
        console.error('Error updating tutorial:', error);
        res.status(500).json({ success: false, error: 'Failed to update tutorial' });
    }
};

const deleteTutorial = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool().query('SELECT * FROM safety_tutorials WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Tutorial not found' });
        }

        await pool().query('DELETE FROM safety_tutorials WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tutorial deleted successfully' });
    } catch (error) {
        console.error('Error deleting tutorial:', error);
        res.status(500).json({ success: false, error: 'Failed to delete tutorial' });
    }
};

// ============================================
// NEWS
// ============================================

const getAllNews = async (req, res) => {
    try {
        const { category, is_featured, is_active, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM safety_news WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM safety_news WHERE 1=1';
        const params = [];
        const countParams = [];

        if (category) {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (is_featured !== undefined) {
            query += ' AND is_featured = ?';
            countQuery += ' AND is_featured = ?';
            params.push(is_featured === 'true');
            countParams.push(is_featured === 'true');
        }

        if (is_active !== undefined) {
            query += ' AND is_active = ?';
            countQuery += ' AND is_active = ?';
            params.push(is_active === 'true');
            countParams.push(is_active === 'true');
        }

        query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
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
        console.error('Error fetching news:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch news' });
    }
};

const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool().query('SELECT * FROM safety_news WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'News not found' });
        }

        // Increment views count
        await pool().query('UPDATE safety_news SET views_count = views_count + 1 WHERE id = ?', [id]);

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch news' });
    }
};

const createNews = async (req, res) => {
    try {
        const { title, summary, content, category, image_url, author, source, is_featured = false, is_active = true } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const id = generateId();
        await pool().query(
            `INSERT INTO safety_news (id, title, summary, content, category, image_url, author, source, is_featured, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, summary, content, category, image_url, author, source, is_featured, is_active]
        );

        const [newNews] = await pool().query('SELECT * FROM safety_news WHERE id = ?', [id]);
        res.status(201).json({ success: true, data: newNews[0], message: 'News created successfully' });
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ success: false, error: 'Failed to create news' });
    }
};

const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, summary, content, category, image_url, author, source, is_featured, is_active } = req.body;

        const [existing] = await pool().query('SELECT * FROM safety_news WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'News not found' });
        }

        await pool().query(
            `UPDATE safety_news SET 
                title = COALESCE(?, title),
                summary = COALESCE(?, summary),
                content = COALESCE(?, content),
                category = COALESCE(?, category),
                image_url = COALESCE(?, image_url),
                author = COALESCE(?, author),
                source = COALESCE(?, source),
                is_featured = COALESCE(?, is_featured),
                is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [title, summary, content, category, image_url, author, source, is_featured, is_active, id]
        );

        const [updated] = await pool().query('SELECT * FROM safety_news WHERE id = ?', [id]);
        res.json({ success: true, data: updated[0], message: 'News updated successfully' });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ success: false, error: 'Failed to update news' });
    }
};

const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool().query('SELECT * FROM safety_news WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'News not found' });
        }

        await pool().query('DELETE FROM safety_news WHERE id = ?', [id]);
        res.json({ success: true, message: 'News deleted successfully' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ success: false, error: 'Failed to delete news' });
    }
};

// ============================================
// SAFETY LAWS
// ============================================

const getAllLaws = async (req, res) => {
    try {
        const { category, jurisdiction, is_active, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM safety_laws WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM safety_laws WHERE 1=1';
        const params = [];
        const countParams = [];

        if (category) {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (jurisdiction) {
            query += ' AND jurisdiction = ?';
            countQuery += ' AND jurisdiction = ?';
            params.push(jurisdiction);
            countParams.push(jurisdiction);
        }

        if (is_active !== undefined) {
            query += ' AND is_active = ?';
            countQuery += ' AND is_active = ?';
            params.push(is_active === 'true');
            countParams.push(is_active === 'true');
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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
        console.error('Error fetching laws:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch laws' });
    }
};

const getLawById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool().query('SELECT * FROM safety_laws WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Law not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching law:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch law' });
    }
};

const createLaw = async (req, res) => {
    try {
        const { title, description, content, category, jurisdiction, effective_date, penalty, is_active = true } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const id = generateId();
        await pool().query(
            `INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, description, content, category, jurisdiction, effective_date, penalty, is_active]
        );

        const [newLaw] = await pool().query('SELECT * FROM safety_laws WHERE id = ?', [id]);
        res.status(201).json({ success: true, data: newLaw[0], message: 'Law created successfully' });
    } catch (error) {
        console.error('Error creating law:', error);
        res.status(500).json({ success: false, error: 'Failed to create law' });
    }
};

const updateLaw = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, content, category, jurisdiction, effective_date, penalty, is_active } = req.body;

        const [existing] = await pool().query('SELECT * FROM safety_laws WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Law not found' });
        }

        await pool().query(
            `UPDATE safety_laws SET 
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                content = COALESCE(?, content),
                category = COALESCE(?, category),
                jurisdiction = COALESCE(?, jurisdiction),
                effective_date = COALESCE(?, effective_date),
                penalty = COALESCE(?, penalty),
                is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [title, description, content, category, jurisdiction, effective_date, penalty, is_active, id]
        );

        const [updated] = await pool().query('SELECT * FROM safety_laws WHERE id = ?', [id]);
        res.json({ success: true, data: updated[0], message: 'Law updated successfully' });
    } catch (error) {
        console.error('Error updating law:', error);
        res.status(500).json({ success: false, error: 'Failed to update law' });
    }
};

const deleteLaw = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool().query('SELECT * FROM safety_laws WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Law not found' });
        }

        await pool().query('DELETE FROM safety_laws WHERE id = ?', [id]);
        res.json({ success: true, message: 'Law deleted successfully' });
    } catch (error) {
        console.error('Error deleting law:', error);
        res.status(500).json({ success: false, error: 'Failed to delete law' });
    }
};

// ============================================
// HELPLINES
// ============================================

// Get all helplines
const getAllHelplines = async (req, res) => {
    try {
        const { country, service_type, is_active, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM default_emergency_contacts WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM default_emergency_contacts WHERE 1=1';
        const params = [];
        const countParams = [];

        if (country) {
            query += ' AND country = ?';
            countQuery += ' AND country = ?';
            params.push(country);
            countParams.push(country);
        }

        if (service_type) {
            query += ' AND service_type = ?';
            countQuery += ' AND service_type = ?';
            params.push(service_type);
            countParams.push(service_type);
        }

        if (is_active !== undefined) {
            query += ' AND is_active = ?';
            countQuery += ' AND is_active = ?';
            params.push(is_active === 'true');
            countParams.push(is_active === 'true');
        }

        query += ' ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?';
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
        console.error('Error fetching helplines:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch helplines' });
    }
};

const getHelplineById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool().query('SELECT * FROM default_emergency_contacts WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Helpline not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching helpline:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch helpline' });
    }
};

const createHelpline = async (req, res) => {
    try {
        const { name, phone, description, country = 'India', service_type = 'emergency', is_active = true, display_order = 0, icon } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ success: false, error: 'Name and phone are required' });
        }

        const id = generateId();
        await pool().query(
            `INSERT INTO default_emergency_contacts (id, name, phone, description, country, service_type, is_active, display_order, icon)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, phone, description, country, service_type, is_active, display_order, icon]
        );

        const [newHelpline] = await pool().query('SELECT * FROM default_emergency_contacts WHERE id = ?', [id]);
        res.status(201).json({ success: true, data: newHelpline[0], message: 'Helpline created successfully' });
    } catch (error) {
        console.error('Error creating helpline:', error);
        res.status(500).json({ success: false, error: 'Failed to create helpline' });
    }
};

const updateHelpline = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, description, country, service_type, is_active, display_order, icon } = req.body;

        const [existing] = await pool().query('SELECT * FROM default_emergency_contacts WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Helpline not found' });
        }

        await pool().query(
            `UPDATE default_emergency_contacts SET 
                name = COALESCE(?, name),
                phone = COALESCE(?, phone),
                description = COALESCE(?, description),
                country = COALESCE(?, country),
                service_type = COALESCE(?, service_type),
                is_active = COALESCE(?, is_active),
                display_order = COALESCE(?, display_order),
                icon = COALESCE(?, icon)
             WHERE id = ?`,
            [name, phone, description, country, service_type, is_active, display_order, icon, id]
        );

        const [updated] = await pool().query('SELECT * FROM default_emergency_contacts WHERE id = ?', [id]);
        res.json({ success: true, data: updated[0], message: 'Helpline updated successfully' });
    } catch (error) {
        console.error('Error updating helpline:', error);
        res.status(500).json({ success: false, error: 'Failed to update helpline' });
    }
};

const deleteHelpline = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool().query('SELECT * FROM default_emergency_contacts WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Helpline not found' });
        }

        await pool().query('DELETE FROM default_emergency_contacts WHERE id = ?', [id]);
        res.json({ success: true, message: 'Helpline deleted successfully' });
    } catch (error) {
        console.error('Error deleting helpline:', error);
        res.status(500).json({ success: false, error: 'Failed to delete helpline' });
    }
};

// ============================================
// QUICK TIPS
// ============================================

// Get all quick tips
const getAllQuickTips = async (req, res) => {
    try {
        const [rows] = await pool().query(`
            SELECT * FROM safety_tutorials 
            WHERE category = 'quick_tips' AND is_active = TRUE
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching quick tips:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch quick tips' });
    }
};

// ============================================
// EXPORT ALL METHODS
// ============================================

module.exports = {
    // Tutorials
    getAllTutorials,
    getTutorialById,
    createTutorial,
    updateTutorial,
    deleteTutorial,
    // Aliases for route compatibility
    getTutorials: getAllTutorials,
    getTutorial: getTutorialById,

    // News
    getAllNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    // Aliases
    getNews: getAllNews,
    getNew: getNewsById,

    // Laws
    getAllLaws,
    getLawById,
    createLaw,
    updateLaw,
    deleteLaw,
    // Alias
    getLaws: getAllLaws,
    getLaw: getLawById,

    // Helplines
    getAllHelplines,
    getHelplineById,
    createHelpline,
    updateHelpline,
    deleteHelpline,
    // Aliases
    getHelplines: getAllHelplines,
    getHelpline: getHelplineById,

    // Quick Tips
    getAllQuickTips,
};

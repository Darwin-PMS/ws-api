const express = require('express');
const adminController = require('../../../controllers/adminController');
const familyController = require('../../../controllers/familyController');
const userController = require('../../../controllers/userController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', adminController.getAllUsers);
router.get('/:id', adminController.getUserById);
router.put('/:id', adminController.updateUser);
router.delete('/:id', adminController.deleteUser);

// Update user role
router.put('/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!role) {
            return res.status(400).json({ success: false, message: 'Role is required' });
        }
        
        const pool = require('../../../config/db').getPool();
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        
        res.json({ success: true, message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
});

// Update user status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        
        const isActive = status === 'active' ? 1 : 0;
        const pool = require('../../../config/db').getPool();
        await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
        
        res.json({ success: true, message: 'User status updated successfully' });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
});

// Get user's family memberships (which families they belong to)
router.get('/:id/families', async (req, res) => {
    try {
        const { id } = req.params;
        const familyModel = require('../../../models/familyModel');
        
        const memberships = await familyModel.getUserFamilyMemberships(id);
        
        res.status(200).json({
            success: true,
            families: memberships
        });
    } catch (error) {
        console.error('Get user families error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user families'
        });
    }
});

// Get user's children/dependents
router.get('/:id/dependents', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = require('../../../config/db').getPool();
        
        const [children] = await pool.query(
            'SELECT * FROM children WHERE parent_id = ? ORDER BY created_at DESC',
            [id]
        );
        
        res.status(200).json({
            success: true,
            dependents: children
        });
    } catch (error) {
        console.error('Get user dependents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user dependents'
        });
    }
});

// Get user's location history
router.get('/:id/location-history', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 100 } = req.query;
        const pool = require('../../../config/db').getPool();
        
        const [history] = await pool.query(
            'SELECT * FROM user_locations WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            [id, parseInt(limit)]
        );
        
        res.status(200).json({
            success: true,
            history: history
        });
    } catch (error) {
        console.error('Get user location history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get location history'
        });
    }
});

module.exports = router;

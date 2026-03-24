const express = require('express');
const { getPool } = require('../../../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const pool = getPool();
        const [banners] = await pool.query(
            'SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC'
        );
        
        res.json({
            success: true,
            banners
        });
    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get banners'
        });
    }
});

module.exports = router;

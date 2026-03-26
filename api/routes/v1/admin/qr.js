const express = require('express');
const router = express.Router();
const qrController = require('../../../controllers/qrController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/all', qrController.adminGetAllQRCodes);
router.delete('/revoke/:tokenId', qrController.adminRevokeQR);
router.post('/force-grant', qrController.adminForceGrantPermission);
router.get('/access-logs', async (req, res) => {
    const pool = require('../../../config/db').getPool();
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const [logs] = await pool.query(
        `SELECT al.*, u.first_name, u.last_name, ou.first_name as owner_first_name, ou.last_name as owner_last_name
         FROM access_logs al
         LEFT JOIN users u ON al.accessor_id = u.id
         JOIN users ou ON al.owner_id = ou.id
         ORDER BY al.accessed_at DESC LIMIT ? OFFSET ?`,
        [parseInt(limit), parseInt(offset)]
    );
    
    res.json({ success: true, data: logs });
});

module.exports = router;

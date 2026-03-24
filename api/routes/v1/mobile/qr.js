const express = require('express');
const router = express.Router();
const qrController = require('../../../controllers/qrController');
const { authenticateToken } = require('../../../middleware/auth');

router.post('/generate', authenticateToken, qrController.generateQR);
router.get('/my-codes', authenticateToken, qrController.getMyQRCodes);
router.delete('/revoke/:tokenId', authenticateToken, qrController.revokeQR);
router.post('/scan', authenticateToken, qrController.scanQR);
router.get('/permissions', authenticateToken, qrController.getMyPermissions);
router.delete('/permissions/:grantId', authenticateToken, qrController.revokePermission);
router.get('/access-history', authenticateToken, qrController.getAccessHistory);

router.get('/image/:token', qrController.generateQRImage);
router.get('/download/:token', qrController.getQRImageBuffer);

module.exports = router;

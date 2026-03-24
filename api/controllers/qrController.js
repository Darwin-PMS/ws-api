const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');
const crypto = require('crypto');

const QR_CODE_SECRET = process.env.QR_SECRET || 'your-qr-secret-key-change-in-production';

let qrCode;
try {
    const QRCode = require('qrcode');
    qrCode = QRCode;
} catch (e) {
    qrCode = null;
}

// Permission levels
const PERMISSION_TYPES = {
    VIEW_PROFILE: 'view_profile',
    VIEW_LOCATION: 'view_location',
    VIEW_CONTACT: 'view_contact',
    EMERGENCY_ACCESS: 'emergency_access',
    TRACK: 'track'
};

// QR Token Types
const TOKEN_TYPES = {
    PROFILE: 'profile',
    PERMISSION: 'permission',
    EMERGENCY: 'emergency',
    TEMP_ACCESS: 'temp_access'
};

const qrController = {
    // Generate QR Token
    async generateQR(req, res) {
        try {
            const pool = getPool();
            const { 
                tokenType = 'profile',
                permissions = [],
                expiresIn = null, // minutes, null = no expiry
                maxUses = null,
                label = ''
            } = req.body;
            
            const userId = req.user.id;
            
            // Generate secure token
            const rawToken = `${userId}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
            const tokenHash = crypto.createHmac('sha256', QR_CODE_SECRET).update(rawToken).digest('hex');
            
            const tokenId = uuidv4();
            const tokenString = Buffer.from(JSON.stringify({
                id: tokenId,
                t: tokenType,
                u: userId,
                h: tokenHash.substring(0, 32)
            })).toString('base64url');
            
            const qrData = JSON.stringify({
                token: tokenString,
                type: tokenType,
                userId: userId,
                permissions: permissions,
                createdAt: new Date().toISOString()
            });
            
            // Calculate expiry
            let expiresAt = null;
            if (expiresIn) {
                expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
            }
            
            await pool.query(
                `INSERT INTO qr_tokens (id, user_id, token, token_type, permissions, expires_at, max_uses, qr_data, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tokenId, userId, tokenHash, tokenType, JSON.stringify(permissions), expiresAt, maxUses, qrData, userId]
            );
            
            // Log admin action if admin is generating for user
            if (req.user.role === 'admin' && req.body.targetUserId) {
                await pool.query(
                    `INSERT INTO admin_actions (id, admin_id, target_user_id, target_qr_id, action_type, action_details)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), userId, req.body.targetUserId, tokenId, 'create_qr', JSON.stringify({ tokenType, permissions })]
                );
            }
            
            res.status(201).json({
                success: true,
                data: {
                    id: tokenId,
                    token: tokenString,
                    type: tokenType,
                    permissions: permissions,
                    expiresAt: expiresAt,
                    maxUses: maxUses,
                    qrData: qrData,
                    qrImageUrl: `/api/v1/mobile/qr/image/${tokenString}`
                }
            });
        } catch (error) {
            console.error('Generate QR error:', error);
            res.status(500).json({ success: false, message: 'Failed to generate QR token' });
        }
    },

    // Get user's QR tokens
    async getMyQRCodes(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { activeOnly } = req.query;
            
            let query = `SELECT * FROM qr_tokens WHERE user_id = ?`;
            const params = [userId];
            
            if (activeOnly === 'true') {
                query += ` AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())`;
            }
            
            query += ` ORDER BY created_at DESC`;
            
            const [tokens] = await pool.query(query, params);
            
            res.json({
                success: true,
                count: tokens.length,
                data: tokens.map(t => ({
                    id: t.id,
                    type: t.token_type,
                    permissions: JSON.parse(t.permissions || '[]'),
                    expiresAt: t.expires_at,
                    maxUses: t.max_uses,
                    useCount: t.use_count,
                    isActive: t.is_active,
                    createdAt: t.created_at,
                    lastUsedAt: t.last_used_at,
                    isExpired: t.expires_at && new Date(t.expires_at) < new Date(),
                    isExhausted: t.max_uses && t.use_count >= t.max_uses
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get QR codes' });
        }
    },

    // Revoke QR Token
    async revokeQR(req, res) {
        try {
            const pool = getPool();
            const { tokenId } = req.params;
            const userId = req.user.id;
            
            const [token] = await pool.query(
                'SELECT * FROM qr_tokens WHERE id = ? AND user_id = ?',
                [tokenId, userId]
            );
            
            if (token.length === 0) {
                return res.status(404).json({ success: false, message: 'QR token not found' });
            }
            
            await pool.query(
                'UPDATE qr_tokens SET is_active = FALSE WHERE id = ?',
                [tokenId]
            );
            
            res.json({ success: true, message: 'QR code revoked' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to revoke QR' });
        }
    },

    // Scan QR Code (Validate and Access)
    async scanQR(req, res) {
        try {
            const pool = getPool();
            const { token } = req.body;
            const scannerId = req.user?.id;
            const scannerIP = req.ip;
            
            // Decode token
            let tokenData;
            try {
                tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());
            } catch {
                return res.status(400).json({ success: false, message: 'Invalid QR code format' });
            }
            
            const { id: tokenId, u: ownerId } = tokenData;
            
            // Get token from database
            const [tokens] = await pool.query(
                'SELECT * FROM qr_tokens WHERE id = ? AND user_id = ? AND is_active = TRUE',
                [tokenId, ownerId]
            );
            
            if (tokens.length === 0) {
                // Log failed scan
                await pool.query(
                    `INSERT INTO access_logs (id, owner_id, accessor_id, access_type, resource_accessed, access_result, metadata)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), ownerId, scannerId, 'qr_scan', 'qr_token', 'denied', JSON.stringify({ reason: 'Token not found or inactive' })]
                );
                return res.status(403).json({ success: false, message: 'QR code is invalid or has been revoked' });
            }
            
            const qrToken = tokens[0];
            
            // Check expiry
            if (qrToken.expires_at && new Date(qrToken.expires_at) < new Date()) {
                await pool.query(
                    `INSERT INTO access_logs (id, owner_id, accessor_id, access_type, resource_accessed, access_result)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), ownerId, scannerId, 'qr_scan', 'qr_token', 'expired']
                );
                return res.status(403).json({ success: false, message: 'QR code has expired' });
            }
            
            // Check max uses
            if (qrToken.max_uses && qrToken.use_count >= qrToken.max_uses) {
                return res.status(403).json({ success: false, message: 'QR code has reached maximum uses' });
            }
            
            // Get owner profile data
            const [users] = await pool.query(
                'SELECT id, first_name, last_name, email, phone, avatar_url, role FROM users WHERE id = ?',
                [ownerId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            const owner = users[0];
            const permissions = JSON.parse(qrToken.permissions || '[]');
            
            // Determine accessible data based on permissions
            let accessibleData = {
                id: owner.id,
                name: `${owner.first_name} ${owner.last_name}`,
                canViewProfile: permissions.includes(PERMISSION_TYPES.VIEW_PROFILE),
                canViewContact: permissions.includes(PERMISSION_TYPES.VIEW_CONTACT),
                canViewLocation: permissions.includes(PERMISSION_TYPES.VIEW_LOCATION),
                canEmergencyAccess: permissions.includes(PERMISSION_TYPES.EMERGENCY_ACCESS)
            };
            
            if (permissions.includes(PERMISSION_TYPES.VIEW_PROFILE)) {
                accessibleData.profile = {
                    name: accessibleData.name,
                    avatar: owner.avatar_url,
                    role: owner.role
                };
            }
            
            if (permissions.includes(PERMISSION_TYPES.VIEW_CONTACT)) {
                accessibleData.contact = {
                    email: owner.email,
                    phone: owner.phone
                };
            }
            
            // Update token usage
            await pool.query(
                'UPDATE qr_tokens SET use_count = use_count + 1, last_used_at = NOW() WHERE id = ?',
                [tokenId]
            );
            
            // Log successful access
            await pool.query(
                `INSERT INTO access_logs (id, owner_id, accessor_id, accessor_name, access_type, resource_accessed, access_result, metadata)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), ownerId, scannerId, scannerId ? null : 'anonymous', 'qr_scan', 'qr_token', 'granted', JSON.stringify({ permissions })]
            );
            
            res.json({
                success: true,
                data: {
                    access: 'granted',
                    tokenType: qrToken.token_type,
                    permissions: permissions,
                    accessibleData: accessibleData,
                    expiresAt: qrToken.expires_at
                }
            });
        } catch (error) {
            console.error('Scan QR error:', error);
            res.status(500).json({ success: false, message: 'Failed to scan QR code' });
        }
    },

    // Grant Permission to User
    async grantPermission(req, res) {
        try {
            const pool = getPool();
            const grantorId = req.user.id;
            const { granteeId, permissionType, expiresIn } = req.body;
            
            if (!granteeId || !permissionType) {
                return res.status(400).json({ success: false, message: 'Grantee and permission type required' });
            }
            
            if (!Object.values(PERMISSION_TYPES).includes(permissionType)) {
                return res.status(400).json({ success: false, message: 'Invalid permission type' });
            }
            
            // Check if already exists
            const [existing] = await pool.query(
                'SELECT * FROM permission_grants WHERE grantor_id = ? AND grantee_id = ? AND permission_type = ? AND is_active = TRUE',
                [grantorId, granteeId, permissionType]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Permission already granted' });
            }
            
            const grantId = uuidv4();
            let expiresAt = null;
            if (expiresIn) {
                expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
            }
            
            await pool.query(
                `INSERT INTO permission_grants (id, grantor_id, grantee_id, permission_type, expires_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [grantId, grantorId, granteeId, permissionType, expiresAt]
            );
            
            res.status(201).json({
                success: true,
                message: 'Permission granted',
                data: { id: grantId, expiresAt }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to grant permission' });
        }
    },

    // Revoke Permission
    async revokePermission(req, res) {
        try {
            const pool = getPool();
            const { grantId } = req.params;
            const userId = req.user.id;
            
            await pool.query(
                `UPDATE permission_grants SET is_active = FALSE, revoked_at = NOW(), revoked_by = ? WHERE id = ? AND grantor_id = ?`,
                [userId, grantId, userId]
            );
            
            res.json({ success: true, message: 'Permission revoked' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to revoke permission' });
        }
    },

    // Get My Permissions (from others)
    async getMyPermissions(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            
            const [grants] = await pool.query(
                `SELECT pg.*, u.first_name, u.last_name 
                 FROM permission_grants pg 
                 JOIN users u ON pg.grantor_id = u.id 
                 WHERE pg.grantee_id = ? AND pg.is_active = TRUE 
                 ORDER BY pg.granted_at DESC`,
                [userId]
            );
            
            res.json({
                success: true,
                count: grants.length,
                data: grants.map(g => ({
                    id: g.id,
                    from: `${g.first_name} ${g.last_name}`,
                    permission: g.permission_type,
                    grantedAt: g.granted_at,
                    expiresAt: g.expires_at
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get permissions' });
        }
    },

    // Get Access History
    async getAccessHistory(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            
            const [logs] = await pool.query(
                `SELECT * FROM access_logs WHERE owner_id = ? ORDER BY accessed_at DESC LIMIT 100`,
                [userId]
            );
            
            res.json({
                success: true,
                count: logs.length,
                data: logs
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get access history' });
        }
    },

    // Admin: Get all QR tokens
    async adminGetAllQRCodes(req, res) {
        try {
            const pool = getPool();
            const { userId, activeOnly, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;
            
            let query = `
                SELECT qt.*, u.first_name, u.last_name, u.email 
                FROM qr_tokens qt 
                JOIN users u ON qt.user_id = u.id 
                WHERE 1=1`;
            const params = [];
            
            if (userId) {
                query += ' AND qt.user_id = ?';
                params.push(userId);
            }
            if (activeOnly === 'true') {
                query += ' AND qt.is_active = TRUE';
            }
            
            query += ' ORDER BY qt.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const [tokens] = await pool.query(query, params);
            
            const [[{ total }]] = await pool.query(
                `SELECT COUNT(*) as total FROM qr_tokens qt WHERE 1=1 ${userId ? 'AND qt.user_id = ?' : ''}`,
                userId ? [userId] : []
            );
            
            res.json({
                success: true,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                data: tokens.map(t => ({
                    id: t.id,
                    user: { id: t.user_id, name: `${t.first_name} ${t.last_name}`, email: t.email },
                    type: t.token_type,
                    permissions: JSON.parse(t.permissions || '[]'),
                    expiresAt: t.expires_at,
                    maxUses: t.max_uses,
                    useCount: t.use_count,
                    isActive: t.is_active,
                    createdAt: t.created_at,
                    lastUsedAt: t.last_used_at
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get QR codes' });
        }
    },

    // Admin: Revoke any QR
    async adminRevokeQR(req, res) {
        try {
            const pool = getPool();
            const { tokenId } = req.params;
            const adminId = req.user.id;
            
            const [token] = await pool.query('SELECT * FROM qr_tokens WHERE id = ?', [tokenId]);
            if (token.length === 0) {
                return res.status(404).json({ success: false, message: 'Token not found' });
            }
            
            await pool.query('UPDATE qr_tokens SET is_active = FALSE WHERE id = ?', [tokenId]);
            
            await pool.query(
                `INSERT INTO admin_actions (id, admin_id, target_user_id, target_qr_id, action_type, action_details)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), adminId, token[0].user_id, tokenId, 'revoke_qr', JSON.stringify({ reason: 'Admin revoked' })]
            );
            
            res.json({ success: true, message: 'QR code revoked by admin' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to revoke QR' });
        }
    },

    // Admin: Force grant permission
    async adminForceGrantPermission(req, res) {
        try {
            const pool = getPool();
            const adminId = req.user.id;
            const { targetUserId, permissionType, reason } = req.body;
            
            const grantId = uuidv4();
            await pool.query(
                `INSERT INTO permission_grants (id, grantor_id, grantee_id, permission_type, expires_at)
                 VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
                [grantId, adminId, targetUserId, permissionType]
            );
            
            await pool.query(
                `INSERT INTO admin_actions (id, admin_id, target_user_id, action_type, action_details)
                 VALUES (?, ?, ?, ?, ?)`,
                [uuidv4(), adminId, targetUserId, 'force_grant', JSON.stringify({ permissionType, reason })]
            );
            
            res.status(201).json({ success: true, message: 'Permission granted by admin' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to grant permission' });
        }
    },

    // Generate QR Code Image
    async generateQRImage(req, res) {
        try {
            const { token } = req.params;
            
            if (!qrCode) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'QR code generation not available. Run: npm install qrcode' 
                });
            }

            // Validate token format
            let tokenData;
            try {
                tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());
            } catch {
                return res.status(400).json({ success: false, message: 'Invalid QR token format' });
            }

            // Generate QR code as data URL (base64 PNG)
            const qrDataUrl = await qrCode.toDataURL(token, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            res.json({
                success: true,
                data: {
                    token: token,
                    qrImage: qrDataUrl,
                    expiresAt: tokenData.expiresAt || null
                }
            });
        } catch (error) {
            console.error('Generate QR image error:', error);
            res.status(500).json({ success: false, message: 'Failed to generate QR image' });
        }
    },

    // Get QR Code as PNG Buffer (for direct download)
    async getQRImageBuffer(req, res) {
        try {
            const { token } = req.params;
            
            if (!qrCode) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'QR code generation not available' 
                });
            }

            const buffer = await qrCode.toBuffer(token, {
                width: 400,
                margin: 2,
                type: 'png',
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            res.set('Content-Type', 'image/png');
            res.set('Content-Disposition', `attachment; filename="qr-code-${token.substring(0, 8)}.png"`);
            res.send(buffer);
        } catch (error) {
            console.error('Get QR buffer error:', error);
            res.status(500).json({ success: false, message: 'Failed to get QR image' });
        }
    }
};

module.exports = qrController;

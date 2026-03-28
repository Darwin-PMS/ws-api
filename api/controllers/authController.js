const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const userModel = require('../models/userModel');
const sessionHistoryModel = require('../models/sessionHistoryModel');
const logger = require('../../logger');

const authController = {
    // Register new user
    async register(req, res) {
        try {
            const { firstName, lastName, email, phone, password, role, gender } = req.body;

            // Validate required fields
            const missingFields = [];
            if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
                missingFields.push('firstName');
            }
            if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
                missingFields.push('lastName');
            }
            if (!email || typeof email !== 'string' || email.trim() === '') {
                missingFields.push('email');
            }
            if (!password || typeof password !== 'string' || password.trim() === '') {
                missingFields.push('password');
            }

            if (missingFields.length > 0) {
                logger.warning('auth', 'Registration validation failed - missing fields', { missingFields, email });
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    missingFields
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Validate password minimum length
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }

            // Validate role if provided
            const validRoles = ['woman', 'parent', 'guardian', 'friend', 'admin'];
            if (role && !validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
                });
            }

            // Validate gender if provided
            const validGenders = ['female', 'male', 'transgender', 'other', 'prefer_not_to_say'];
            if (gender && !validGenders.includes(gender)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid gender. Must be one of: ${validGenders.join(', ')}`
                });
            }

            // Check if user exists
            const existingUser = await userModel.findByEmail(email.trim().toLowerCase());
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }

            // Create user
            const user = await userModel.create({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone ? phone.trim() : null,
                password: password,
                role: role || 'woman',
                gender: gender || null
            });

            // Generate tokens
            const accessToken = jwt.sign({ id: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

            // Save refresh token
            const pool = getPool();
            const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await pool.query(
                'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                [uuidv4(), user.id, refreshToken, refreshExpiry]
            );

            // Record login session
            await sessionHistoryModel.createSession({
                userId: user.id,
                action: 'login',
                appVersion: req.body.appVersion,
                deviceInfo: req.body.deviceInfo,
                deviceId: req.body.deviceId,
                osVersion: req.body.osVersion,
                ipAddress: req.ip || req.connection.remoteAddress,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                locationName: req.body.locationName,
                userAgent: req.headers['user-agent'],
                success: true
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                user,
                token: accessToken,
                refreshToken
            });
        } catch (error) {
            logger.error('auth', 'Registration failed', { email: req.body?.email }, error);
            console.error('Registration error:', error);
            res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
        }
    },

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Generate tokens
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

            // Save refresh token
            const pool = getPool();
            const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await pool.query(
                'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                [uuidv4(), user.id, refreshToken, refreshExpiry]
            );

            // Record login session
            await sessionHistoryModel.createSession({
                userId: user.id,
                action: 'login',
                appVersion: req.body.appVersion,
                deviceInfo: req.body.deviceInfo,
                deviceId: req.body.deviceId,
                osVersion: req.body.osVersion,
                ipAddress: req.ip || req.connection.remoteAddress,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                locationName: req.body.locationName,
                userAgent: req.headers['user-agent'],
                success: true
            });

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                },
                token: accessToken,
                refreshToken
            });
        } catch (error) {
            logger.error('auth', 'Login failed', { email: req.body?.email }, error);
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Login failed: ' + error.message });
        }
    },

    // Biometric Login
    async biometricLogin(req, res) {
        try {
            const { userId, deviceId } = req.body;

            if (!userId || !deviceId) {
                return res.status(400).json({ success: false, message: 'User ID and Device ID required' });
            }

            // Find user
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            // Generate tokens
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

            // Save refresh token
            const pool = getPool();
            const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await pool.query(
                'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                [uuidv4(), user.id, refreshToken, refreshExpiry]
            );

            // Record biometric login session
            await sessionHistoryModel.createSession({
                userId: user.id,
                action: 'biometric_login',
                appVersion: req.body.appVersion,
                deviceInfo: req.body.deviceInfo,
                deviceId: deviceId,
                osVersion: req.body.osVersion,
                ipAddress: req.ip || req.connection.remoteAddress,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                locationName: req.body.locationName,
                userAgent: req.headers['user-agent'],
                success: true
            });

            res.json({
                success: true,
                message: 'Biometric login successful',
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                },
                token: accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Biometric login error:', error);
            res.status(500).json({ success: false, message: 'Biometric login failed' });
        }
    },

    // Refresh token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const pool = getPool();

            if (!refreshToken) {
                return res.status(400).json({ success: false, message: 'Refresh token required' });
            }

            // Verify token
            const decoded = jwt.verify(refreshToken, JWT_SECRET);

            // Check if token exists in database
            const [tokens] = await pool.query(
                'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
                [decoded.id, refreshToken]
            );

            if (tokens.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid refresh token' });
            }

            // Get user
            const user = await userModel.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            // Generate new access token
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token: accessToken
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }
    },

    // Logout
    async logout(req, res) {
        try {
            const pool = getPool();
            
            // Only try to delete tokens if user is authenticated
            if (req.user && req.user.id) {
                await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);

                // Record logout session
                await sessionHistoryModel.createSession({
                    userId: req.user.id,
                    action: 'logout',
                    appVersion: req.body.appVersion,
                    deviceInfo: req.body.deviceInfo,
                    deviceId: req.body.deviceId,
                    osVersion: req.body.osVersion,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    locationName: req.body.locationName,
                    userAgent: req.headers['user-agent'],
                    success: true
                });
            }

            logger.info('auth', 'User logged out', { userId: req.user?.id });
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            logger.error('auth', 'Logout failed', { userId: req.user?.id }, error);
            console.error('Logout error:', error);
            res.status(500).json({ success: false, message: 'Logout failed' });
        }
    },

    // Change password
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const pool = getPool();

            // Get user
            const user = await userModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Verify current password
            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ success: false, message: 'Password change failed' });
        }
    },

    // Admin: Force logout user (invalidates all their refresh tokens)
    async forceLogoutUser(req, res) {
        try {
            const { userId } = req.params;
            const pool = getPool();

            // Delete all refresh tokens for this user
            await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

            // Record force logout session
            await sessionHistoryModel.createSession({
                userId: userId,
                action: 'force_logout',
                appVersion: req.body.appVersion,
                deviceInfo: req.body.deviceInfo,
                deviceId: req.body.deviceId,
                osVersion: req.body.osVersion,
                ipAddress: req.ip || req.connection.remoteAddress,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                locationName: req.body.locationName,
                userAgent: req.headers['user-agent'],
                success: true,
                reason: req.body.reason || 'Admin initiated force logout'
            });

            res.json({ success: true, message: 'User has been force logged out successfully' });
        } catch (error) {
            console.error('Force logout error:', error);
            res.status(500).json({ success: false, message: 'Force logout failed' });
        }
    },

    // Forgot password - request password reset
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const pool = getPool();

            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            // Check if user exists
            const user = await userModel.findByEmail(email);
            if (!user) {
                // Return success even if user doesn't exist to prevent email enumeration
                return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
            }

            // Generate reset token
            const resetToken = uuidv4();
            const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Store reset token
            await pool.query(
                'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                [uuidv4(), user.id, resetToken, resetExpiry]
            );

            // In production, send email with reset link
            // For now, return the token (in production, this would be sent via email)
            console.log(`Password reset token for ${email}: ${resetToken}`);

            res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent',
                // Remove this in production - only for testing
                debugToken: resetToken
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
        }
    },

    // Reset password - using reset token
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            const pool = getPool();

            if (!token || !newPassword) {
                return res.status(400).json({ success: false, message: 'Token and new password are required' });
            }

            // Verify token
            const [resets] = await pool.query(
                'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
                [token]
            );

            if (resets.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid or expired reset token' });
            }

            const reset = resets[0];

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update user password
            await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, reset.user_id]);

            // Delete all reset tokens for this user
            await pool.query('DELETE FROM password_resets WHERE user_id = ?', [reset.user_id]);

            // Delete all refresh tokens (force re-login)
            await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [reset.user_id]);

            res.json({ success: true, message: 'Password reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ success: false, message: 'Failed to reset password' });
        }
    }
};

module.exports = authController;

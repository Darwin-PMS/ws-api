const jwt = require('jsonwebtoken');
const logger = require('../../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warning('auth', 'Authentication failed - No token provided', { 
            url: req.originalUrl, 
            method: req.method 
        });
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            logger.warning('auth', 'Authentication failed - Invalid/expired token', { 
                url: req.originalUrl, 
                method: req.method,
                error: err.message 
            });
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
    const adminRoles = ['system_admin', 'agency_admin', 'admin', 'supervisor'];
    if (!req.user || !adminRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Role-based authorization middleware
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    authorizeRole,
    JWT_SECRET
};

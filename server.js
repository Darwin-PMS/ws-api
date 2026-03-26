const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const logger = require('./logger');

// Import routes
const v1Routes = require('./api/routes/v1');
const authRoutes = require('./api/routes/auth');
const userRoutes = require('./api/routes/users');
const userLocationsRoutes = require('./api/routes/userLocations');
const sosRoutes = require('./api/routes/sos');
const adminRoutes = require('./api/routes/admin');
const trackingRoutes = require('./api/routes/tracking');
const homeAutomationRoutes = require('./api/routes/homeAutomation');
const familyRoutes = require('./api/routes/family');
const familyPlaceRoutes = require('./api/routes/familyPlaces');
const eventRoutes = require('./api/routes/events');
const consentRoutes = require('./api/routes/consent');
const themeRoutes = require('./api/routes/theme');
const menuRoutes = require('./api/routes/menu');
const permissionRoutes = require('./api/routes/permission');
const childcareRoutes = require('./api/routes/childcare');
const settingsRoutes = require('./api/routes/settings');
const safetyTutorialRoutes = require('./api/routes/safetyTutorial');
const safetyNewsRoutes = require('./api/routes/safetyNews');
const safetyLawRoutes = require('./api/routes/safetyLaw');
const behaviorRoutes = require('./api/routes/behavior');
const sessionHistoryRoutes = require('./api/routes/sessionHistory');
const contentRoutes = require('./api/routes/content');
const grievanceRoutes = require('./api/routes/grievance');

// Import database modules
const { initDatabase } = require('./api/config/db');
const { createTables, tablesExist } = require('./api/config/createTables');
const { seedDefaultData, initializeAllDefaultData, isSeedingRequired } = require('./api/config/seedData');

// Import WebSocket
const WebSocketServer = require('./api/services/websocket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket server
let wsServer;
try {
    wsServer = new WebSocketServer(server);
} catch (err) {
    console.warn('WebSocket server initialization failed:', err.message);
}

// Initialize logger
// const logger = require('./logger');
logger.info('server', 'Server starting...');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || process.env.NODE_ENV !== 'production') return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173',
            'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:5173',
            'http://192.168.29.84:3000', 'http://192.168.29.84:5173',
            'http://192.168.29.84',
        ];
        
        if (allowedOrigins.includes(origin) || origin.startsWith('http://192.168.')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Time', 'X-Auth-Token', 'X-API-Version', 'X-Client-Type'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Sensitive headers that should not be logged
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'password', 'token'];
const SENSITIVE_BODY_FIELDS = ['password', 'token', 'secret', 'apiKey', 'api_key', 'creditCard', 'credit_card'];

// Sanitize headers for logging
const sanitizeHeaders = (headers) => {
    const sanitized = { ...headers };
    for (const key of Object.keys(sanitized)) {
        if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
            sanitized[key] = '[REDACTED]';
        }
    }
    return sanitized;
};

// Sanitize body for logging
const sanitizeBody = (body) => {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    for (const field of SENSITIVE_BODY_FIELDS) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
};

// Request logging middleware
app.use((req, res, next) => {
    console.log('═══════════════════════════════════════');
    console.log('📥 SERVER RECEIVED REQUEST');
    console.log('METHOD:', req.method);
    console.log('URL:', req.originalUrl);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('BODY:', JSON.stringify(sanitizeBody(req.body), null, 2));
    }
    console.log('═══════════════════════════════════════');

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        console.log('═══════════════════════════════════════');
        console.log('📤 SERVER SENDING RESPONSE');
        console.log('STATUS:', res.statusCode);
        // Truncate response if too large
        const responseStr = typeof data === 'string' ? data : JSON.stringify(data);
        const truncatedResponse = responseStr.length > 500
            ? responseStr.substring(0, 500) + '... [truncated]'
            : responseStr;
        console.log('RESPONSE:', truncatedResponse);
        console.log('═══════════════════════════════════════');
        return originalSend.call(this, data);
    };

    next();
});

// VERSIONED ROUTES (v1) - Mobile and Admin APIs
app.use('/api/v1', v1Routes);

// LEGACY ROUTES (for backward compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', userLocationsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/tracking', trackingRoutes);
app.use('/api/home-automation', homeAutomationRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/families', familyPlaceRoutes);
app.use('/api', eventRoutes);
app.use('/api', consentRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/childcare', childcareRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/safety-tutorials', safetyTutorialRoutes);
app.use('/api/safety-news', safetyNewsRoutes);
app.use('/api/safety-laws', safetyLawRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/sessions', sessionHistoryRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/grievance', grievanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    const stats = wsServer ? wsServer.getStats() : null;
    res.json({ 
        status: 'ok', 
        message: 'API is running',
        websocket: stats ? { enabled: true, ...stats } : { enabled: false }
    });
});

// WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
    if (!wsServer) {
        return res.status(503).json({ success: false, message: 'WebSocket not available' });
    }
    res.json({ success: true, stats: wsServer.getStats() });
});

// Get server logs (for debugging)
app.get('/api/logs', (req, res) => {
    try {
        const { type = 'errors', lines = 100 } = req.query;
        let logs;

        if (type === 'errors') {
            logs = logger.getErrorLogs(parseInt(lines));
        } else if (type === 'all') {
            logs = logger.getAppLogs(parseInt(lines));
        } else {
            logs = logger.getErrorLogs(parseInt(lines));
        }

        res.json({ success: true, logs, count: logs.length });
    } catch (error) {
        logger.error('api', 'Failed to get logs', null, error);
        res.status(500).json({ success: false, message: 'Failed to get logs' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('server', 'Unhandled error', {
        method: req.method,
        url: req.url,
        error: err.message
    }, err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server with database setup
initDatabase().then(async () => {
    try {
        // Step 1: Check if tables exist, create if not (runs once when needed)
        const hasTables = await tablesExist();
        if (!hasTables) {
            console.log('Creating database tables...');
            await createTables();
            console.log('Tables created successfully');
        } else {
            console.log('Tables already exist, skipping creation');
        }

        // Step 2: Check if data is seeded, seed if not (runs once when needed)
        const needsSeeding = await isSeedingRequired();
        if (needsSeeding) {
            console.log('Seeding default data...');
            await seedDefaultData();
            console.log('Default data seeded successfully');
        } else {
            console.log('Data already seeded, skipping');
        }

        // Step 3: Initialize application default data (themes, menus, permissions)
        // These can run every time as they check for existing data before inserting
        console.log('Initializing default themes...');
        await initializeAllDefaultData();

    } catch (err) {
        console.error('Error during database setup:', err);
    }

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

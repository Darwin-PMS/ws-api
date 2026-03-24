const express = require('express');
const { getPool } = require('../../../config/db');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

function generateSessionId() {
    return 'live_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateToken() {
    return 'token_' + Math.random().toString(36).substr(2, 16) + Date.now();
}

router.post('/start', async (req, res) => {
    try {
        const pool = getPool();
        const userId = req.user.id;
        const { userName, contactIds, location } = req.body;
        
        const sessionId = generateSessionId();
        const token = generateToken();
        const id = uuidv4();
        
        const streams = JSON.stringify({
            screen: false,
            frontCamera: false,
            backCamera: false
        });
        
        await pool.query(
            `INSERT INTO live_stream_sessions (id, session_id, token, user_id, user_name, contact_ids, status, location, streams) 
             VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
            [id, sessionId, token, userId, userName || req.user.first_name, JSON.stringify(contactIds || []), JSON.stringify(location || {}), streams]
        );
        
        res.json({
            success: true,
            message: 'Live stream session started',
            session: {
                id,
                sessionId,
                token,
                userId,
                userName: userName || req.user.first_name,
                contactIds: contactIds || [],
                status: 'active',
                startedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
});

router.get('/session/:sessionId', async (req, res) => {
    try {
        const pool = getPool();
        const { sessionId } = req.params;
        
        const [rows] = await pool.query(
            'SELECT * FROM live_stream_sessions WHERE session_id = ?',
            [sessionId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        const session = rows[0];
        session.streams = typeof session.streams === 'string' ? JSON.parse(session.streams) : session.streams;
        session.location = typeof session.location === 'string' ? JSON.parse(session.location) : session.location;
        session.contactIds = typeof session.contact_ids === 'string' ? JSON.parse(session.contact_ids) : session.contact_ids;
        
        res.json({ success: true, session });
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(500).json({ success: false, message: 'Failed to get session' });
    }
});

router.put('/session/:sessionId/stream', async (req, res) => {
    try {
        const pool = getPool();
        const { sessionId } = req.params;
        const { streamType, isActive } = req.body;
        
        const [rows] = await pool.query(
            'SELECT streams FROM live_stream_sessions WHERE session_id = ? AND status = "active"',
            [sessionId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found or not active' });
        }
        
        let streams = typeof rows[0].streams === 'string' ? JSON.parse(rows[0].streams) : rows[0].streams;
        
        if (streamType === 'screen') {
            streams.screen = isActive;
        } else if (streamType === 'frontCamera') {
            streams.frontCamera = isActive;
        } else if (streamType === 'backCamera') {
            streams.backCamera = isActive;
        }
        
        await pool.query(
            'UPDATE live_stream_sessions SET streams = ? WHERE session_id = ?',
            [JSON.stringify(streams), sessionId]
        );
        
        res.json({ success: true, message: 'Stream updated', streams });
    } catch (error) {
        console.error('Error updating stream:', error);
        res.status(500).json({ success: false, message: 'Failed to update stream' });
    }
});

router.put('/session/:sessionId/location', async (req, res) => {
    try {
        const pool = getPool();
        const { sessionId } = req.params;
        const { latitude, longitude } = req.body;
        
        const locationData = { latitude, longitude, timestamp: new Date().toISOString() };
        
        const [result] = await pool.query(
            'UPDATE live_stream_sessions SET location = ? WHERE session_id = ? AND status = "active"',
            [JSON.stringify(locationData), sessionId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        res.json({ success: true, message: 'Location updated', location: locationData });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ success: false, message: 'Failed to update location' });
    }
});

router.post('/session/:sessionId/stop', async (req, res) => {
    try {
        const pool = getPool();
        const { sessionId } = req.params;
        
        const [rows] = await pool.query(
            'SELECT * FROM live_stream_sessions WHERE session_id = ?',
            [sessionId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        const session = rows[0];
        const now = new Date();
        const duration = Math.floor((now - new Date(session.started_at)) / 1000);
        
        await pool.query(
            'UPDATE live_stream_sessions SET status = "stopped", stopped_at = ?, duration = ? WHERE session_id = ?',
            [now, duration, sessionId]
        );
        
        res.json({
            success: true,
            message: 'Live stream session stopped',
            session: {
                sessionId: session.session_id,
                startedAt: session.started_at,
                stoppedAt: now,
                duration
            }
        });
    } catch (error) {
        console.error('Error stopping session:', error);
        res.status(500).json({ success: false, message: 'Failed to stop session' });
    }
});

router.get('/active/:userId', async (req, res) => {
    try {
        const pool = getPool();
        const { userId } = req.params;
        
        const [rows] = await pool.query(
            'SELECT * FROM live_stream_sessions WHERE user_id = ? AND status = "active" ORDER BY started_at DESC',
            [userId]
        );
        
        const sessions = rows.map(row => {
            row.streams = typeof row.streams === 'string' ? JSON.parse(row.streams) : row.streams;
            row.location = typeof row.location === 'string' ? JSON.parse(row.location) : row.location;
            row.contactIds = typeof row.contact_ids === 'string' ? JSON.parse(row.contact_ids) : row.contact_ids;
            return row;
        });
        
        res.json({ success: true, sessions });
    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to get sessions' });
    }
});

router.get('/history/:userId', async (req, res) => {
    try {
        const pool = getPool();
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM live_stream_sessions WHERE user_id = ? AND status = "stopped"',
            [userId]
        );
        
        const [rows] = await pool.query(
            'SELECT * FROM live_stream_sessions WHERE user_id = ? AND status = "stopped" ORDER BY started_at DESC LIMIT ? OFFSET ?',
            [userId, parseInt(limit), parseInt(offset)]
        );
        
        const sessions = rows.map(row => {
            row.streams = typeof row.streams === 'string' ? JSON.parse(row.streams) : row.streams;
            row.location = typeof row.location === 'string' ? JSON.parse(row.location) : row.location;
            row.contactIds = typeof row.contact_ids === 'string' ? JSON.parse(row.contact_ids) : row.contact_ids;
            return row;
        });
        
        res.json({
            success: true,
            sessions,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error getting session history:', error);
        res.status(500).json({ success: false, message: 'Failed to get session history' });
    }
});

router.post('/session/:sessionId/view', async (req, res) => {
    try {
        const pool = getPool();
        const { sessionId } = req.params;
        const { viewerId, viewerName, viewerPhone } = req.body;
        
        const [rows] = await pool.query(
            'SELECT id FROM live_stream_sessions WHERE session_id = ? AND status = "active"',
            [sessionId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found or not active' });
        }
        
        const viewerId_db = uuidv4();
        await pool.query(
            'INSERT INTO live_stream_viewers (id, session_id, viewer_id, viewer_name, viewer_phone) VALUES (?, ?, ?, ?, ?)',
            [viewerId_db, sessionId, viewerId, viewerName, viewerPhone]
        );
        
        res.json({ success: true, message: 'Viewer added to session' });
    } catch (error) {
        console.error('Error adding viewer:', error);
        res.status(500).json({ success: false, message: 'Failed to add viewer' });
    }
});

module.exports = router;

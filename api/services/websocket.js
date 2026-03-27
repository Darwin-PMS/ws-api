const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server, path: '/ws' });
        this.clients = new Map();
        this.userConnections = new Map();
        this.heartbeatInterval = null;
        this.activeShares = new Map();
        
        this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
        this.startHeartbeat();
        
        console.log('WebSocket server initialized on /ws');
    }

    async handleConnection(ws, req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        
        let user = null;
        if (token) {
            try {
                user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                ws.userId = user.id;
                ws.role = user.role;
            } catch (err) {
                console.log('Invalid WebSocket token');
            }
        }

        const clientId = this.generateClientId();
        ws.clientId = clientId;
        ws.isAlive = true;
        
        this.clients.set(clientId, ws);
        
        if (user) {
            if (!this.userConnections.has(user.id)) {
                this.userConnections.set(user.id, new Set());
            }
            this.userConnections.get(user.id).add(clientId);
            console.log(`User ${user.id} connected. Total connections for this user: ${this.userConnections.get(user.id).size}`);
            console.log('All connected user IDs:', Array.from(this.userConnections.keys()));
        }

        console.log(`WebSocket client connected: ${clientId}, User: ${user?.id || 'Anonymous'}, Role: ${user?.role || 'N/A'}`);

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (data) => this.handleMessage(ws, data));

        ws.on('close', () => {
            this.handleDisconnect(ws);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for ${clientId}:`, error.message);
        });

        this.send(ws, {
            type: 'connected',
            payload: { clientId, userId: user?.id, role: user?.role }
        });
    }

    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            const { type, payload } = message;

            console.log(`[WS MSG] type: ${type}, payload:`, payload);

            switch (type) {
                case 'subscribe':
                    this.handleSubscribe(ws, payload);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(ws, payload);
                    break;
                case 'location_update':
                    this.handleLocationUpdate(ws, payload);
                    break;
                case 'sos_trigger':
                    this.handleSOSTrigger(ws, payload);
                    break;
                case 'live_share_start':
                    this.handleLiveShareStart(ws, payload);
                    break;
                case 'live_share_accept':
                    this.handleLiveShareAccept(ws, payload);
                    break;
                case 'live_share_decline':
                    this.handleLiveShareDecline(ws, payload);
                    break;
                case 'live_share_location':
                    this.handleLiveShareLocation(ws, payload);
                    break;
                case 'live_share_stop':
                    this.handleLiveShareStop(ws, payload);
                    break;
                case 'live_share_ended':
                    this.handleLiveShareEnded(ws, payload);
                    break;
                case 'stop':
                case 'stop_live_share':
                    this.handleLiveShareStop(ws, payload);
                    break;
                case 'ping':
                    this.send(ws, { type: 'pong', payload: { timestamp: Date.now() } });
                    break;
                default:
                    console.log(`Unknown message type: ${type}`);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    handleSubscribe(ws, payload) {
        const { channels } = payload;
        if (!ws.subscriptions) ws.subscriptions = new Set();
        
        channels.forEach(channel => {
            ws.subscriptions.add(channel);
        });
        
        this.send(ws, {
            type: 'subscribed',
            payload: { channels: Array.from(ws.subscriptions) }
        });
    }

    handleUnsubscribe(ws, payload) {
        const { channels } = payload;
        if (!ws.subscriptions) return;
        
        channels.forEach(channel => {
            ws.subscriptions.delete(channel);
        });
        
        this.send(ws, {
            type: 'unsubscribed',
            payload: { channels }
        });
    }

    async handleLocationUpdate(ws, payload) {
        const { userId, latitude, longitude, accuracy, speed, heading } = payload;
        
        try {
            const pool = getPool();
            await pool.query(
                `INSERT INTO user_locations (user_id, latitude, longitude, accuracy, speed, heading, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [userId || ws.userId, latitude, longitude, accuracy || 0, speed || 0, heading || 0]
            );

            this.broadcast({
                type: 'location_update',
                payload: {
                    userId: userId || ws.userId,
                    latitude,
                    longitude,
                    accuracy,
                    speed,
                    heading,
                    timestamp: new Date().toISOString()
                }
            }, ['tracking', 'admin']);
        } catch (error) {
            console.error('Error saving location update:', error);
        }
    }

    async handleSOSTrigger(ws, payload) {
        const { userId, latitude, longitude, message } = payload;
        const sosUserId = userId || ws.userId;
        
        try {
            const pool = getPool();
            const sosId = require('uuid').v4();
            
            await pool.query(
                `INSERT INTO sos_alerts (id, user_id, latitude, longitude, message, status, created_at)
                 VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
                [sosId, sosUserId, latitude, longitude, message || 'Emergency SOS alert']
            );

            const sosAlert = {
                id: sosId,
                userId: sosUserId,
                latitude,
                longitude,
                message,
                status: 'active',
                triggeredAt: new Date().toISOString()
            };

            this.broadcast({
                type: 'sos_alert',
                payload: sosAlert
            }, ['admin']);

            this.broadcastToUser(sosUserId, {
                type: 'sos_confirmed',
                payload: { sosId, status: 'active' }
            });

            const guardians = await pool.query(
                'SELECT guardian_id FROM guardians WHERE user_id = ? AND status = ?',
                [sosUserId, 'accepted']
            );

            for (const guardian of guardians[0] || []) {
                await pool.query(
                    `INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [require('uuid').v4(), guardian.guardian_id, 'SOS Alert!', 
                     `Emergency alert from user`, 'sos', sosId]
                );
                
                this.broadcastToUser(guardian.guardian_id, {
                    type: 'sos_alert',
                    payload: sosAlert
                });
            }
        } catch (error) {
            console.error('Error handling SOS trigger:', error);
            this.send(ws, {
                type: 'sos_error',
                payload: { message: 'Failed to trigger SOS' }
            });
        }
    }

    async handleLiveShareStart(ws, payload) {
        const { sessionId, sharerId, sharerName, recipients, latitude, longitude, message } = payload;
        
        console.log('═══════════════════════════════════════');
        console.log('LIVE SHARE STARTED');
        console.log('Session:', sessionId);
        console.log('Sharer:', sharerId, sharerName);
        console.log('Recipients:', recipients);
        console.log('═══════════════════════════════════════');
        
        const shareData = {
            sessionId,
            sharerId,
            sharerName,
            sharerLocation: { latitude, longitude },
            recipients: new Set(recipients),
            acceptedRecipients: new Set(),
            declinedRecipients: new Set(),
            status: 'active',
            startedAt: new Date().toISOString()
        };
        
        this.activeShares.set(sessionId, shareData);

        let onlineRecipients = [];
        let offlineRecipients = [];

        for (const recipientId of recipients) {
            console.log(`Checking recipient ${recipientId}...`);
            const clientIds = this.userConnections.get(recipientId);
            console.log(`  clientIds found:`, clientIds ? Array.from(clientIds) : null);
            
            if (clientIds && clientIds.size > 0) {
                onlineRecipients.push(recipientId);
                console.log(`  -> Recipient is ONLINE, sending request`);
                this.broadcastToUser(recipientId, {
                    type: 'live_share_request',
                    payload: {
                        sessionId,
                        sharerId,
                        sharerName,
                        sharerLocation: { latitude, longitude },
                        message: message || `${sharerName} wants to share their live location with you`,
                        timestamp: new Date().toISOString(),
                        isOnline: true
                    }
                });
            } else {
                offlineRecipients.push(recipientId);
                console.log(`  -> Recipient is OFFLINE`);
            }
        }
        
        console.log('Online recipients:', onlineRecipients);
        console.log('Offline recipients:', offlineRecipients);

        const pool = getPool();
        for (const recipientId of offlineRecipients) {
            try {
                const notifId = require('uuid').v4();
                await pool.query(
                    `INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at)
                     VALUES (?, ?, ?, ?, 'live_share_request', ?, NOW())`,
                    [notifId, recipientId, 'Live Location Request', 
                     `${sharerName} wants to share their live location - Open app to respond`, sessionId]
                );
            } catch (e) {
                console.log('Error saving notification:', e.message);
            }
        }

        this.send(ws, {
            type: 'live_share_started',
            payload: { 
                sessionId, 
                recipients,
                onlineRecipients,
                offlineRecipients 
            }
        });
    }

    async handleLiveShareAccept(ws, payload) {
        const { sessionId, userId, userName } = payload;
        
        console.log('Live share accepted:', { sessionId, userId, userName });
        
        const share = this.activeShares.get(sessionId);
        if (!share) {
            this.send(ws, { type: 'error', payload: { message: 'Share session not found' } });
            return;
        }

        share.acceptedRecipients.add(userId);

        const pool = getPool();
        await pool.query(
            `INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at)
             VALUES (?, ?, ?, ?, 'live_share_accepted', ?, NOW())`,
            [require('uuid').v4(), share.sharerId, 'Share Accepted', 
             `${userName} accepted your live location sharing`, sessionId]
        );

        this.broadcastToUser(share.sharerId, {
            type: 'live_share_accepted',
            payload: { sessionId, userId, userName }
        });

        this.send(ws, {
            type: 'live_share_accept_confirmed',
            payload: { 
                sessionId, 
                status: 'accepted',
                currentLocation: share.sharerLocation,
                sharerId: share.sharerId,
                sharerName: share.sharerName
            }
        });

        for (const recipientId of share.acceptedRecipients) {
            if (recipientId !== userId) {
                this.broadcastToUser(recipientId, {
                    type: 'live_share_viewer_joined',
                    payload: { sessionId, userId, userName }
                });
            }
        }
    }

    async handleLiveShareDecline(ws, payload) {
        const { sessionId, userId, userName, reason } = payload;
        
        console.log('Live share declined:', { sessionId, userId, userName });
        
        const share = this.activeShares.get(sessionId);
        if (!share) return;

        share.declinedRecipients.add(userId);

        const pool = getPool();
        await pool.query(
            `INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at)
             VALUES (?, ?, ?, ?, 'live_share_declined', ?, NOW())`,
            [require('uuid').v4(), share.sharerId, 'Share Declined', 
             `${userName} declined your live location sharing`, sessionId]
        );

        this.broadcastToUser(share.sharerId, {
            type: 'live_share_declined',
            payload: { sessionId, userId, userName, reason }
        });
    }

    async handleLiveShareLocation(ws, payload) {
        const { sessionId, latitude, longitude, accuracy, speed } = payload;
        
        const share = this.activeShares.get(sessionId);
        if (!share) return;

        share.sharerLocation = { latitude, longitude, accuracy, speed, timestamp: new Date().toISOString() };

        for (const recipientId of share.acceptedRecipients) {
            this.broadcastToUser(recipientId, {
                type: 'live_share_location_update',
                payload: {
                    sessionId,
                    sharerId: share.sharerId,
                    sharerName: share.sharerName,
                    latitude,
                    longitude,
                    accuracy,
                    speed,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    async handleLiveShareStop(ws, payload) {
        const { sessionId } = payload;
        
        console.log('Live share stopped:', sessionId);
        
        const share = this.activeShares.get(sessionId);
        if (!share) return;

        share.status = 'ended';
        share.endedAt = new Date().toISOString();

        for (const recipientId of share.acceptedRecipients) {
            const pool = getPool();
            await pool.query(
                `INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at)
                 VALUES (?, ?, ?, ?, 'live_share_ended', ?, NOW())`,
                [require('uuid').v4(), recipientId, 'Live Sharing Ended', 
                 `${share.sharerName} has stopped sharing their location`, sessionId]
            );

            this.broadcastToUser(recipientId, {
                type: 'live_share_ended',
                payload: { sessionId, sharerName: share.sharerName }
            });
        }

        this.activeShares.delete(sessionId);

        this.send(ws, {
            type: 'live_share_stopped',
            payload: { sessionId }
        });
    }

    handleLiveShareEnded(ws, payload) {
        this.handleLiveShareStop(ws, payload);
    }

    handleDisconnect(ws) {
        console.log(`WebSocket client disconnected: ${ws.clientId}`);
        
        this.clients.delete(ws.clientId);
        
        if (ws.userId && this.userConnections.has(ws.userId)) {
            this.userConnections.get(ws.userId).delete(ws.clientId);
            if (this.userConnections.get(ws.userId).size === 0) {
                this.userConnections.delete(ws.userId);
            }
        }

        for (const [sessionId, share] of this.activeShares.entries()) {
            if (share.sharerId === ws.userId) {
                this.handleLiveShareStop(ws, { sessionId });
            }
        }
    }

    send(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            console.log(`[WS SEND] to client ${ws.clientId}:`, JSON.stringify(message));
            ws.send(JSON.stringify(message));
        } else {
            console.log(`[WS SEND FAILED] client ${ws.clientId} not open, state: ${ws.readyState}`);
        }
    }

    broadcast(message, channels = []) {
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                if (channels.length === 0 || 
                    channels.some(ch => client.subscriptions?.has(ch))) {
                    this.send(client, message);
                }
            }
        });
    }

    broadcastToUser(userId, message) {
        const clientIds = this.userConnections.get(userId);
        console.log(`broadcastToUser: ${userId}, hasConnection: ${!!clientIds}, clients: ${clientIds?.size || 0}`);
        
        if (clientIds) {
            clientIds.forEach(clientId => {
                const client = this.clients.get(clientId);
                if (client) {
                    console.log(`Sending message to client ${clientId}:`, JSON.stringify(message));
                    this.send(client, message);
                } else {
                    console.log(`Client ${clientId} not found in clients map`);
                }
            });
        } else {
            console.log(`No userConnections entry for userId: ${userId}`);
            console.log('Available userConnections:', Array.from(this.userConnections.keys()));
        }
    }

    broadcastToRole(role, message) {
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.role === role) {
                this.send(client, message);
            }
        });
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    this.handleDisconnect(ws);
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    close() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.wss.close();
    }

    getStats() {
        return {
            totalClients: this.clients.size,
            userConnections: this.userConnections.size,
            userConnectionsArray: Array.from(this.userConnections.keys()),
            adminClients: Array.from(this.clients.values()).filter(c => c.role === 'admin').length,
            activeShares: this.activeShares.size
        };
    }
    
    isUserConnected(userId) {
        return this.userConnections.has(userId);
    }
}

module.exports = WebSocketServer;

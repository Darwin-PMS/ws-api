const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server, path: '/ws' });
        this.clients = new Map();
        this.userConnections = new Map();
        this.heartbeatInterval = null;
        
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

    handleDisconnect(ws) {
        console.log(`WebSocket client disconnected: ${ws.clientId}`);
        
        this.clients.delete(ws.clientId);
        
        if (ws.userId && this.userConnections.has(ws.userId)) {
            this.userConnections.get(ws.userId).delete(ws.clientId);
            if (this.userConnections.get(ws.userId).size === 0) {
                this.userConnections.delete(ws.userId);
            }
        }
    }

    send(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
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
        if (clientIds) {
            clientIds.forEach(clientId => {
                const client = this.clients.get(clientId);
                if (client) {
                    this.send(client, message);
                }
            });
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
            adminClients: Array.from(this.clients.values()).filter(c => c.role === 'admin').length
        };
    }
}

module.exports = WebSocketServer;

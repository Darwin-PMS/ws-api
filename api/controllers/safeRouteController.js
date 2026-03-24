const { getPool } = require('../config/db');
const crypto = require('crypto');

const SAFE_ROUTE_SECRET = process.env.SAFE_ROUTE_SECRET || 'your-safe-route-secret';

const safeRouteController = {
    async analyzeRoute(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;
            const { 
                originLat, originLng, originName,
                destLat, destLng, destName,
                mode = 'walking',
                userId: targetUserId // Admin can specify target user
            } = req.body;

            if (!originLat || !originLng || !destLat || !destLng) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Origin and destination coordinates are required' 
                });
            }

            // Admin can analyze routes for any user, regular users only their own
            const analyzedUserId = (userRole === 'admin' || userRole === 'system_admin') && targetUserId 
                ? targetUserId 
                : userId;

            // Get recent incidents near origin (last 30 days)
            const [originIncidents] = await pool.query(`
                SELECT * FROM anomaly_events 
                WHERE latitude BETWEEN ? AND ? 
                AND longitude BETWEEN ? AND ?
                AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            `, [
                parseFloat(originLat) - 0.01, parseFloat(originLat) + 0.01,
                parseFloat(originLng) - 0.01, parseFloat(originLng) + 0.01
            ]);

            // Get recent incidents near destination
            const [destIncidents] = await pool.query(`
                SELECT * FROM anomaly_events 
                WHERE latitude BETWEEN ? AND ? 
                AND longitude BETWEEN ? AND ?
                AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            `, [
                parseFloat(destLat) - 0.01, parseFloat(destLat) + 0.01,
                parseFloat(destLng) - 0.01, parseFloat(destLng) + 0.01
            ]);

            // Get safe zones near origin
            const [originSafeZones] = await pool.query(`
                SELECT * FROM geofences 
                WHERE latitude BETWEEN ? AND ? 
                AND longitude BETWEEN ? AND ?
                AND is_active = TRUE
            `, [
                parseFloat(originLat) - 0.02, parseFloat(originLat) + 0.02,
                parseFloat(originLng) - 0.02, parseFloat(originLng) + 0.02
            ]);

            // Get safe zones near destination
            const [destSafeZones] = await pool.query(`
                SELECT * FROM geofences 
                WHERE latitude BETWEEN ? AND ? 
                AND longitude BETWEEN ? AND ?
                AND is_active = TRUE
            `, [
                parseFloat(destLat) - 0.02, parseFloat(destLat) + 0.02,
                parseFloat(destLng) - 0.02, parseFloat(destLng) + 0.02
            ]);

            // Get user's behavior patterns for this route
            const [userPatterns] = await pool.query(`
                SELECT * FROM behavior_patterns 
                WHERE user_id = ?
                AND pattern_type IN ('route', 'commute')
                AND is_active = TRUE
            `, [analyzedUserId]);

            // Calculate safety score
            const safetyScore = calculateSafetyScore(
                originIncidents, destIncidents, 
                originSafeZones, destSafeZones, 
                mode
            );

            // Calculate distance (Haversine formula)
            const distance = calculateDistance(
                parseFloat(originLat), parseFloat(originLng),
                parseFloat(destLat), parseFloat(destLng)
            );

            // Generate recommendations based on data
            const recommendations = generateRecommendations(
                safetyScore, originIncidents, destIncidents,
                originSafeZones, destSafeZones, mode
            );

            // Generate alternative routes
            const alternativeRoutes = generateAlternativeRoutes(
                { lat: originLat, lng: originLng, name: originName },
                { lat: destLat, lng: destLng, name: destName },
                safetyScore
            );

            res.json({
                success: true,
                data: {
                    analyzedForUserId: analyzedUserId,
                    origin: { lat: originLat, lng: originLng, name: originName },
                    destination: { lat: destLat, lng: destLng, name: destName },
                    mode,
                    safetyScore,
                    distance: distance.toFixed(2),
                    estimatedTime: mode === 'walking' ? Math.round(distance / 5 * 60) : Math.round(distance / 30 * 60),
                    incidents: {
                        origin: originIncidents.length,
                        destination: destIncidents.length,
                        details: [...originIncidents, ...destIncidents].slice(0, 5).map(i => ({
                            type: i.anomaly_type,
                            severity: i.severity,
                            time: i.created_at
                        }))
                    },
                    safeZones: {
                        origin: originSafeZones.length,
                        destination: destSafeZones.length
                    },
                    recommendations,
                    alternativeRoutes,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Route analysis error:', error);
            res.status(500).json({ success: false, message: 'Failed to analyze route' });
        }
    },

    async getRouteHistory(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;
            const { userId: targetUserId, limit = 20, page = 1 } = req.query;

            // Admin can view any user's history
            const queryUserId = (userRole === 'admin' || userRole === 'system_admin') && targetUserId
                ? targetUserId
                : userId;

            const offset = (page - 1) * limit;

            const [routes] = await pool.query(`
                SELECT * FROM route_analysis_history
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [queryUserId, parseInt(limit), parseInt(offset)]);

            const [[{ total }]] = await pool.query(
                'SELECT COUNT(*) as total FROM route_analysis_history WHERE user_id = ?',
                [queryUserId]
            );

            res.json({
                success: true,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                data: routes
            });
        } catch (error) {
            console.error('Get route history error:', error);
            res.status(500).json({ success: false, message: 'Failed to get route history' });
        }
    },

    async saveRouteAnalysis(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { 
                originLat, originLng, originName,
                destLat, destLng, destName,
                mode, safetyScore, recommendations, distance
            } = req.body;

            const { v4: uuidv4 } = require('uuid');

            await pool.query(`
                INSERT INTO route_analysis_history 
                (id, user_id, origin_lat, origin_lng, origin_name, 
                 dest_lat, dest_lng, dest_name, mode, safety_score, 
                 recommendations, distance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [uuidv4(), userId, originLat, originLng, originName,
                destLat, destLng, destName, mode, safetyScore,
                JSON.stringify(recommendations), distance]);

            res.json({ success: true, message: 'Route analysis saved' });
        } catch (error) {
            console.error('Save route error:', error);
            res.status(500).json({ success: false, message: 'Failed to save route analysis' });
        }
    },

    async getUserRoutes(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;
            const { targetUserId, limit = 50 } = req.query;

            // Only admins can view other users' routes
            if (targetUserId && (userRole === 'admin' || userRole === 'system_admin')) {
                const [routes] = await pool.query(`
                    SELECT rah.*, u.first_name, u.last_name
                    FROM route_analysis_history rah
                    JOIN users u ON rah.user_id = u.id
                    WHERE rah.user_id = ?
                    ORDER BY rah.created_at DESC
                    LIMIT ?
                `, [targetUserId, parseInt(limit)]);

                return res.json({ success: true, data: routes });
            }

            // Regular users only see their own
            const [routes] = await pool.query(`
                SELECT * FROM route_analysis_history
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            `, [userId, parseInt(limit)]);

            res.json({ success: true, data: routes });
        } catch (error) {
            console.error('Get user routes error:', error);
            res.status(500).json({ success: false, message: 'Failed to get routes' });
        }
    },

    async getRouteStats(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;

            let statsQuery;
            let params;

            if (userRole === 'admin' || userRole === 'system_admin') {
                statsQuery = `
                    SELECT 
                        COUNT(*) as total_routes,
                        AVG(safety_score) as avg_safety_score,
                        MAX(safety_score) as max_safety_score,
                        MIN(safety_score) as min_safety_score,
                        SUM(CASE WHEN safety_score >= 80 THEN 1 ELSE 0 END) as safe_routes,
                        SUM(CASE WHEN safety_score < 60 THEN 1 ELSE 0 END) as unsafe_routes
                    FROM route_analysis_history
                `;
                params = [];
            } else {
                statsQuery = `
                    SELECT 
                        COUNT(*) as total_routes,
                        AVG(safety_score) as avg_safety_score,
                        MAX(safety_score) as max_safety_score,
                        MIN(safety_score) as min_safety_score,
                        SUM(CASE WHEN safety_score >= 80 THEN 1 ELSE 0 END) as safe_routes,
                        SUM(CASE WHEN safety_score < 60 THEN 1 ELSE 0 END) as unsafe_routes
                    FROM route_analysis_history
                    WHERE user_id = ?
                `;
                params = [userId];
            }

            const [[stats]] = await pool.query(statsQuery, params);

            res.json({
                success: true,
                data: {
                    totalRoutes: stats.total_routes || 0,
                    avgSafetyScore: stats.avg_safety_score ? parseFloat(stats.avg_safety_score.toFixed(1)) : 0,
                    maxSafetyScore: stats.max_safety_score || 0,
                    minSafetyScore: stats.min_safety_score || 0,
                    safeRoutes: stats.safe_routes || 0,
                    unsafeRoutes: stats.unsafe_routes || 0,
                    safePercentage: stats.total_routes > 0 
                        ? Math.round((stats.safe_routes / stats.total_routes) * 100) 
                        : 0
                }
            });
        } catch (error) {
            console.error('Get route stats error:', error);
            res.status(500).json({ success: false, message: 'Failed to get route stats' });
        }
    },

    async getIncidentHotspots(req, res) {
        try {
            const pool = getPool();
            const { lat, lng, radius = 0.05, limit = 20 } = req.query;

            if (!lat || !lng) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Latitude and longitude are required' 
                });
            }

            const [hotspots] = await pool.query(`
                SELECT 
                    latitude, longitude,
                    anomaly_type,
                    severity,
                    COUNT(*) as incident_count,
                    MAX(created_at) as last_incident
                FROM anomaly_events
                WHERE latitude BETWEEN ? AND ?
                AND longitude BETWEEN ? AND ?
                AND created_at > DATE_SUB(NOW(), INTERVAL 90 DAY)
                GROUP BY latitude, longitude, anomaly_type, severity
                ORDER BY incident_count DESC
                LIMIT ?
            `, [
                parseFloat(lat) - parseFloat(radius), parseFloat(lat) + parseFloat(radius),
                parseFloat(lng) - parseFloat(radius), parseFloat(lng) + parseFloat(radius),
                parseInt(limit)
            ]);

            res.json({ success: true, data: hotspots });
        } catch (error) {
            console.error('Get hotspots error:', error);
            res.status(500).json({ success: false, message: 'Failed to get hotspots' });
        }
    },

    async adminGetAllRoutes(req, res) {
        try {
            const pool = getPool();
            const { page = 1, limit = 50, userId, minScore, maxScore } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT rah.*, u.first_name, u.last_name, u.email
                FROM route_analysis_history rah
                JOIN users u ON rah.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (userId) {
                query += ' AND rah.user_id = ?';
                params.push(userId);
            }
            if (minScore) {
                query += ' AND rah.safety_score >= ?';
                params.push(parseFloat(minScore));
            }
            if (maxScore) {
                query += ' AND rah.safety_score <= ?';
                params.push(parseFloat(maxScore));
            }

            query += ' ORDER BY rah.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [routes] = await pool.query(query, params);

            const [[{ total }]] = await pool.query(
                `SELECT COUNT(*) as total FROM route_analysis_history rah 
                 JOIN users u ON rah.user_id = u.id WHERE 1=1 
                 ${userId ? 'AND rah.user_id = ?' : ''}`,
                userId ? [userId] : []
            );

            res.json({
                success: true,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                data: routes.map(r => ({
                    id: r.id,
                    user: {
                        id: r.user_id,
                        name: `${r.first_name} ${r.last_name}`,
                        email: r.email
                    },
                    origin: { lat: r.origin_lat, lng: r.origin_lng, name: r.origin_name },
                    destination: { lat: r.dest_lat, lng: r.dest_lng, name: r.dest_name },
                    mode: r.mode,
                    safetyScore: r.safety_score,
                    distance: r.distance,
                    createdAt: r.created_at
                }))
            });
        } catch (error) {
            console.error('Admin get all routes error:', error);
            res.status(500).json({ success: false, message: 'Failed to get routes' });
        }
    }
};

function calculateSafetyScore(originIncidents, destIncidents, originZones, destZones, mode) {
    let score = 85;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentOrigin = originIncidents.filter(i => new Date(i.created_at).getTime() > oneDayAgo).length;
    const recentDest = destIncidents.filter(i => new Date(i.created_at).getTime() > oneDayAgo).length;

    score -= recentOrigin * 15;
    score -= recentDest * 15;

    const highSeverityTypes = ['harassment', 'assault', 'stalking', 'theft'];
    const highSeverityOrigin = originIncidents.filter(i => highSeverityTypes.includes(i.anomaly_type)).length;
    const highSeverityDest = destIncidents.filter(i => highSeverityTypes.includes(i.anomaly_type)).length;

    score -= highSeverityOrigin * 10;
    score -= highSeverityDest * 10;

    score += originZones.length * 5;
    score += destZones.length * 5;

    if (mode === 'walking') {
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
            score -= 15;
        }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function generateRecommendations(safetyScore, originIncidents, destIncidents, originZones, destZones, mode) {
    const recommendations = [];

    if (safetyScore >= 80) {
        recommendations.push('This route is generally safe for travel.');
    } else if (safetyScore >= 60) {
        recommendations.push('Exercise caution on this route, especially at night.');
        recommendations.push('Stay in well-lit areas and avoid shortcuts through isolated areas.');
    } else {
        recommendations.push('Consider alternative routes with better safety ratings.');
        recommendations.push('Travel during daylight hours if possible.');
        recommendations.push('Share your location with a trusted contact.');
    }

    if (originIncidents.length > 0) {
        recommendations.push('There have been incidents reported near your starting point recently.');
    }

    if (destIncidents.length > 0) {
        recommendations.push('Exercise caution near your destination area.');
    }

    if (originZones.length > 0 || destZones.length > 0) {
        recommendations.push('There are designated safe zones along your route.');
    }

    if (mode === 'walking') {
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
            recommendations.push('Walking at night: Keep your phone charged and avoid using headphones.');
        }
    }

    return recommendations;
}

function generateAlternativeRoutes(origin, destination, mainScore) {
    return [
        {
            id: '1',
            name: 'Main Route',
            description: 'Most direct path',
            safetyScore: mainScore,
            estimatedTime: Math.round(Math.random() * 10 + 15),
            distance: (Math.random() * 2 + 1).toFixed(1),
            waypoints: [origin, destination]
        },
        {
            id: '2',
            name: 'Via Main Road',
            description: 'Well-lit, busier route',
            safetyScore: Math.min(100, mainScore + 15),
            estimatedTime: Math.round(Math.random() * 10 + 20),
            distance: (Math.random() * 3 + 2).toFixed(1),
            waypoints: [origin, { lat: (origin.lat + destination.lat) / 2, lng: destination.lng }, destination]
        },
        {
            id: '3',
            name: 'Via Safe Zone',
            description: 'Passes through designated safe zones',
            safetyScore: Math.min(100, mainScore + 25),
            estimatedTime: Math.round(Math.random() * 15 + 25),
            distance: (Math.random() * 4 + 3).toFixed(1),
            waypoints: [origin, { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 }, destination]
        }
    ];
}

module.exports = safeRouteController;

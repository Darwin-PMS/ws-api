// Behavior Analysis Controller
// Handles all behavior pattern analysis API endpoints

const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// ========================
// Analyze Location
// ========================
const analyzeLocation = async (req, res) => {
    try {
        const { userId, location, context } = req.body;

        if (!userId || !location || !location.latitude || !location.longitude) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
            });
        }

        // Store location data
        const locationId = uuidv4();
        await db.query(
            `INSERT INTO location_history 
            (id, user_id, latitude, longitude, accuracy, speed, activity_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                locationId,
                userId,
                location.latitude,
                location.longitude,
                location.accuracy || null,
                location.speed || null,
                context?.activityType || 'unknown',
                location.timestamp || new Date()
            ]
        );

        // Get user behavior settings
        const [settings] = await db.query(
            'SELECT * FROM user_behavior_settings WHERE user_id = ?',
            [userId]
        );

        if (!settings || !settings.monitoring_enabled) {
            return res.json({
                success: true,
                data: { anomalyDetected: false, reason: 'Monitoring disabled' }
            });
        }

        // Get user patterns
        const [patterns] = await db.query(
            `SELECT * FROM behavior_patterns 
            WHERE user_id = ? AND is_active = TRUE`,
            [userId]
        );

        // Analyze for anomalies (simplified rule-based for now)
        const anomalyResult = await analyzeForAnomalies(userId, location, context, settings, patterns);

        // If anomaly detected, store it
        if (anomalyResult.anomalyDetected) {
            const anomalyId = uuidv4();
            await db.query(
                `INSERT INTO anomaly_events 
                (id, user_id, anomaly_type, severity, latitude, longitude, location_name, 
                speed, duration_minutes, context_data, ai_analysis, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    anomalyId,
                    userId,
                    anomalyResult.anomaly.type,
                    anomalyResult.anomaly.severity,
                    location.latitude,
                    location.longitude,
                    anomalyResult.anomaly.locationName || null,
                    location.speed || null,
                    anomalyResult.anomaly.duration || null,
                    JSON.stringify(context || {}),
                    anomalyResult.anomaly.aiAnalysis || null,
                    new Date()
                ]
            );

            anomalyResult.anomaly.id = anomalyId;

            // Check if alert should be triggered
            if (anomalyResult.shouldAlert) {
                await triggerBehaviorAlert(userId, anomalyId, anomalyResult.anomaly);
            }
        }

        res.json({
            success: true,
            data: {
                anomalyDetected: anomalyResult.anomalyDetected,
                anomaly: anomalyResult.anomaly || null,
                context: {
                    type: anomalyResult.contextType || 'unknown',
                    confidence: anomalyResult.contextConfidence || 0.5,
                    patternMatch: anomalyResult.patternMatch || 0
                },
                riskScore: anomalyResult.riskScore || 0
            }
        });

    } catch (error) {
        console.error('Analyze location error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Helper: Analyze for Anomalies
// ========================
async function analyzeForAnomalies(userId, location, context, settings, patterns) {
    const detectionSettings = JSON.parse(settings.detection_settings || '{}');
    const sensitivity = JSON.parse(settings.sensitivity_settings || '{}');
    const alertSettings = JSON.parse(settings.alert_settings || '{}');

    let anomalyDetected = false;
    let anomaly = null;
    let shouldAlert = false;
    let riskScore = 0;
    let contextType = 'normal';
    let contextConfidence = 0.9;
    let patternMatch = 100;

    // Check for route deviation
    if (detectionSettings.routeDeviation && patterns.length > 0) {
        const deviation = checkRouteDeviation(location, patterns);
        if (deviation.isDeviating) {
            anomalyDetected = true;
            const severity = deviation.distance > 500 ? 'high' : 'medium';
            anomaly = {
                type: 'route_deviation',
                severity,
                locationName: 'Unknown Location',
                aiAnalysis: `User deviated ${Math.round(deviation.distance)}m from expected route`
            };
            riskScore += severity === 'high' ? 40 : 20;
            shouldAlert = severity === 'high' || alertSettings.severityThreshold === 'low';
        } else {
            patternMatch = deviation.matchPercentage;
        }
    }

    // Check for inactivity (based on location updates)
    if (detectionSettings.inactivityDetection && !anomalyDetected) {
        const [recentLocations] = await db.query(
            `SELECT * FROM location_history 
            WHERE user_id = ? 
            AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
            ORDER BY created_at DESC 
            LIMIT 10`,
            [userId]
        );

        if (recentLocations.length > 0) {
            const lastMovement = new Date(recentLocations[0].created_at);
            const now = new Date();
            const minutesSinceMovement = (now - lastMovement) / 1000 / 60;

            const threshold = (alertSettings.alertThreshold || 3) * 10;
            if (minutesSinceMovement > threshold && !context?.isAtKnownLocation) {
                anomalyDetected = true;
                anomaly = {
                    type: 'unusual_inactivity',
                    severity: 'medium',
                    locationName: 'Stationary',
                    duration: Math.round(minutesSinceMovement),
                    aiAnalysis: `No movement detected for ${Math.round(minutesSinceMovement)} minutes`
                };
                riskScore += 25;
                shouldAlert = true;
            }
        }
    }

    // Check for abnormal speed
    if (detectionSettings.speedAnalysis && location.speed) {
        const avgSpeed = await getAverageSpeed(userId);
        if (avgSpeed) {
            const speedMultiplier = location.speed / avgSpeed;
            if (speedMultiplier > 3 || speedMultiplier < 0.1) {
                anomalyDetected = true;
                anomaly = {
                    type: 'abnormal_speed',
                    severity: 'low',
                    aiAnalysis: `Speed (${location.speed} km/h) is unusual compared to average (${avgSpeed} km/h)`
                };
                riskScore += 10;
            }
        }
    }

    return {
        anomalyDetected,
        anomaly,
        shouldAlert,
        riskScore: Math.min(100, riskScore),
        contextType,
        contextConfidence,
        patternMatch
    };
}

// ========================
// Helper: Check Route Deviation
// ========================
function checkRouteDeviation(location, patterns) {
    const routePatterns = patterns.filter(p => p.pattern_type === 'route' || p.pattern_type === 'commute');

    if (routePatterns.length === 0) {
        return { isDeviating: false, distance: 0, matchPercentage: 0 };
    }

    let minDistance = Infinity;
    let closestPattern = null;

    for (const pattern of routePatterns) {
        const data = JSON.parse(pattern.pattern_data);
        if (data.waypoints) {
            for (const waypoint of data.waypoints) {
                const distance = calculateDistance(
                    location.latitude, location.longitude,
                    waypoint.latitude, waypoint.longitude
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPattern = pattern;
                }
            }
        }
    }

    const isDeviating = minDistance > 200; // 200m threshold
    const matchPercentage = isDeviating ? 0 : Math.max(0, 100 - minDistance);

    return {
        isDeviating,
        distance: minDistance,
        matchPercentage
    };
}

// ========================
// Helper: Calculate Distance (Haversine)
// ========================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// ========================
// Helper: Get Average Speed
// ========================
async function getAverageSpeed(userId) {
    const [locations] = await db.query(
        `SELECT AVG(speed) as avg_speed FROM location_history 
        WHERE user_id = ? AND speed > 0 
        AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [userId]
    );
    return locations[0]?.avg_speed || null;
}

// ========================
// Helper: Trigger Behavior Alert
// ========================
async function triggerBehaviorAlert(userId, anomalyId, anomaly) {
    const alertId = uuidv4();

    // Get trusted contacts for behavior alerts
    const [contacts] = await db.query(
        `SELECT btc.*, ec.name, ec.phone 
        FROM behavior_trusted_contacts btc
        JOIN emergency_contacts ec ON ec.id = btc.contact_id
        WHERE btc.user_id = ? 
        AND btc.notify_on_anomaly = TRUE
        AND btc.is_active = TRUE`,
        [userId]
    );

    if (contacts.length > 0) {
        for (const contact of contacts) {
            await db.query(
                `INSERT INTO behavior_alerts 
                (id, user_id, anomaly_id, alert_type, recipient_type, recipient_id, 
                recipient_name, recipient_phone, message, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    alertId,
                    userId,
                    anomalyId,
                    'trusted_contact',
                    'trusted_contact',
                    contact.contact_id,
                    contact.name,
                    contact.phone,
                    `Safety Alert: ${anomaly.type} detected. ${anomaly.aiAnalysis || ''}`,
                    'pending',
                    new Date()
                ]
            );
        }
    }
}

// ========================
// Get Anomalies
// ========================
const getAnomalies = async (req, res) => {
    try {
        const { userId, startDate, endDate, severity, type, limit = 20, offset = 0 } = req.query;

        let query = 'SELECT * FROM anomaly_events WHERE user_id = ?';
        const params = [userId];

        if (startDate) {
            query += ' AND created_at >= ?';
            params.push(new Date(startDate));
        }
        if (endDate) {
            query += ' AND created_at <= ?';
            params.push(new Date(endDate));
        }
        if (severity) {
            query += ' AND severity = ?';
            params.push(severity);
        }
        if (type) {
            query += ' AND anomaly_type = ?';
            params.push(type);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [anomalies] = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM anomaly_events WHERE user_id = ?';
        const countParams = [userId];
        if (severity) {
            countQuery += ' AND severity = ?';
            countParams.push(severity);
        }
        if (type) {
            countQuery += ' AND anomaly_type = ?';
            countParams.push(type);
        }
        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            success: true,
            data: {
                anomalies,
                pagination: {
                    total: countResult[0].total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: countResult[0].total > parseInt(offset) + anomalies.length
                }
            }
        });

    } catch (error) {
        console.error('Get anomalies error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Get Behavior Summary
// ========================
const getBehaviorSummary = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get anomaly counts
        const [anomalies] = await db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN anomaly_type = 'unexpected_stop' THEN 1 ELSE 0 END) as unexpected_stop,
                SUM(CASE WHEN anomaly_type = 'route_deviation' THEN 1 ELSE 0 END) as route_deviation,
                SUM(CASE WHEN anomaly_type = 'unusual_inactivity' THEN 1 ELSE 0 END) as unusual_inactivity,
                SUM(CASE WHEN anomaly_type = 'abnormal_speed' THEN 1 ELSE 0 END) as abnormal_speed
            FROM anomaly_events 
            WHERE user_id = ? 
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [userId]
        );

        // Get patterns count
        const [patterns] = await db.query(
            'SELECT COUNT(*) as total FROM behavior_patterns WHERE user_id = ? AND is_active = TRUE',
            [userId]
        );

        // Get settings
        const [settings] = await db.query(
            'SELECT monitoring_enabled FROM user_behavior_settings WHERE user_id = ?',
            [userId]
        );

        // Calculate risk score
        const data = anomalies[0];
        let riskScore = 0;
        riskScore += (data.critical || 0) * 30;
        riskScore += (data.high || 0) * 20;
        riskScore += (data.medium || 0) * 10;
        riskScore = Math.min(100, riskScore);

        const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

        res.json({
            success: true,
            data: {
                userId,
                period: '24h',
                anomalyCount: data.total || 0,
                anomaliesBySeverity: {
                    critical: data.critical || 0,
                    high: data.high || 0,
                    medium: data.medium || 0,
                    low: data.low || 0
                },
                anomaliesByType: {
                    unexpected_stop: data.unexpected_stop || 0,
                    route_deviation: data.route_deviation || 0,
                    unusual_inactivity: data.unusual_inactivity || 0,
                    abnormal_speed: data.abnormal_speed || 0
                },
                riskScore,
                riskLevel,
                patternsLearned: patterns[0]?.total || 0,
                monitoringActive: settings[0]?.monitoring_enabled || false,
                lastUpdate: new Date()
            }
        });

    } catch (error) {
        console.error('Get behavior summary error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Submit Feedback
// ========================
const submitFeedback = async (req, res) => {
    try {
        const { userId, anomalyId, feedbackType, notes, expectedBehavior, context } = req.body;

        if (!userId || !anomalyId || !feedbackType) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
            });
        }

        const feedbackId = uuidv4();
        await db.query(
            `INSERT INTO behavior_feedback 
            (id, user_id, anomaly_id, feedback_type, user_notes, expected_behavior, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [feedbackId, userId, anomalyId, feedbackType, notes, expectedBehavior, new Date()]
        );

        // Update anomaly with feedback
        const isConfirmed = feedbackType === 'accurate';
        await db.query(
            'UPDATE anomaly_events SET is_confirmed = ?, confirmed_at = ?, feedback_notes = ? WHERE id = ?',
            [isConfirmed ? TRUE : FALSE, new Date(), notes, anomalyId]
        );

        // If false positive, adjust thresholds (in production, this would update ML model)
        if (feedbackType === 'false_positive') {
            console.log('False positive detected - adjusting thresholds for user:', userId);
        }

        res.json({
            success: true,
            data: {
                feedbackId,
                status: 'submitted',
                impactOnDetection: feedbackType === 'false_positive' ? 'threshold_adjusted' : 'learning_updated',
                message: 'Thank you for your feedback.'
            }
        });

    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Get/Update Settings
// ========================
const getSettings = async (req, res) => {
    try {
        const { userId } = req.params;

        let [settings] = await db.query(
            'SELECT * FROM user_behavior_settings WHERE user_id = ?',
            [userId]
        );

        if (settings.length === 0) {
            // Create default settings
            const settingsId = uuidv4();
            await db.query(
                'INSERT INTO user_behavior_settings (id, user_id) VALUES (?, ?)',
                [settingsId, userId]
            );
            [settings] = await db.query(
                'SELECT * FROM user_behavior_settings WHERE user_id = ?',
                [userId]
            );
        }

        res.json({
            success: true,
            data: {
                userId,
                ...settings[0]
            }
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const allowedFields = [
            'monitoring_enabled',
            'detection_settings',
            'sensitivity_settings',
            'alert_settings',
            'notification_settings',
            'privacy_settings'
        ];

        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(typeof value === 'object' ? JSON.stringify(value) : value);
            }
        }

        if (updateFields.length > 0) {
            updateValues.push(userId);
            await db.query(
                `UPDATE user_behavior_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
                updateValues
            );
        }

        res.json({
            success: true,
            data: { message: 'Settings updated successfully' }
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Get Routines
// ========================
const getRoutines = async (req, res) => {
    try {
        const { userId } = req.params;

        const [patterns] = await db.query(
            'SELECT * FROM behavior_patterns WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC',
            [userId]
        );

        const [recentLocations] = await db.query(
            `SELECT latitude, longitude, created_at, activity_type 
            FROM location_history 
            WHERE user_id = ? 
            AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY created_at DESC 
            LIMIT 1000`,
            [userId]
        );

        // Organize into routes and locations
        const routes = patterns.filter(p => p.pattern_type === 'route' || p.pattern_type === 'commute');
        const locations = patterns.filter(p => p.pattern_type === 'location');

        res.json({
            success: true,
            data: {
                userId,
                commonRoutes: routes.map(r => ({
                    ...r,
                    patternData: JSON.parse(r.pattern_data || '{}')
                })),
                commonLocations: locations.map(l => ({
                    ...l,
                    patternData: JSON.parse(l.pattern_data || '{}')
                })),
                recentLocationsCount: recentLocations.length,
                analyzedPeriod: '30 days'
            }
        });

    } catch (error) {
        console.error('Get routines error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Learn Routines
// ========================
const learnRoutines = async (req, res) => {
    try {
        const { userId } = req.body;

        // Get location history for analysis
        const [locations] = await db.query(
            `SELECT * FROM location_history 
            WHERE user_id = ? 
            AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY created_at`,
            [userId]
        );

        if (locations.length < 50) {
            return res.json({
                success: false,
                error: { code: 'INSUFFICIENT_DATA', message: 'Need at least 50 location points to learn routines' }
            });
        }

        // Cluster locations to find common places
        const clusters = clusterLocations(locations);

        // Extract common routes
        const routes = extractRoutes(locations);

        // Store patterns
        const patternId = uuidv4();
        await db.query(
            `INSERT INTO behavior_patterns 
            (id, user_id, pattern_type, pattern_name, pattern_data, confidence)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                patternId,
                userId,
                'location',
                'Learned Locations',
                JSON.stringify({ clusters, totalPoints: locations.length }),
                0.75,
                new Date()
            ]
        );

        // Store route patterns
        for (const route of routes) {
            const routeId = uuidv4();
            await db.query(
                `INSERT INTO behavior_patterns 
                (id, user_id, pattern_type, pattern_name, pattern_data, confidence)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    routeId,
                    userId,
                    'commute',
                    route.name,
                    JSON.stringify(route),
                    route.confidence,
                    new Date()
                ]
            );
        }

        res.json({
            success: true,
            data: {
                routinesLearned: clusters.length + routes.length,
                commonLocations: clusters.length,
                commonRoutes: routes.length,
                message: 'Routines learned successfully'
            }
        });

    } catch (error) {
        console.error('Learn routines error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Helper: Cluster Locations
// ========================
function clusterLocations(locations) {
    const clusters = [];
    const RADIUS = 50; // meters

    for (const loc of locations) {
        let found = false;
        for (const cluster of clusters) {
            const dist = calculateDistance(
                loc.latitude, loc.longitude,
                cluster.latitude, cluster.longitude
            );
            if (dist < RADIUS) {
                cluster.count++;
                cluster.latitude = (cluster.latitude * (cluster.count - 1) + loc.latitude) / cluster.count;
                cluster.longitude = (cluster.longitude * (cluster.count - 1) + loc.longitude) / cluster.count;
                found = true;
                break;
            }
        }
        if (!found) {
            clusters.push({
                latitude: loc.latitude,
                longitude: loc.longitude,
                count: 1,
                firstSeen: loc.created_at,
                lastSeen: loc.created_at
            });
        }
    }

    return clusters.sort((a, b) => b.count - a.count).slice(0, 10);
}

// ========================
// Helper: Extract Routes
// ========================
function extractRoutes(locations) {
    // Simplified route extraction based on time of day
    const routes = {
        morning: [],
        evening: [],
        other: []
    };

    for (let i = 1; i < locations.length; i++) {
        const hour = new Date(locations[i].created_at).getHours();
        const key = (hour >= 6 && hour <= 10) ? 'morning' : (hour >= 16 && hour <= 20) ? 'evening' : 'other';

        const dist = calculateDistance(
            locations[i - 1].latitude, locations[i - 1].longitude,
            locations[i].latitude, locations[i].longitude
        );

        if (dist > 100) {
            routes[key].push({
                start: { lat: locations[i - 1].latitude, lng: locations[i - 1].longitude },
                end: { lat: locations[i].latitude, lng: locations[i].longitude },
                distance: dist
            });
        }
    }

    return Object.entries(routes)
        .filter(([_, points]) => points.length > 5)
        .map(([time, points]) => ({
            name: `${time} commute`,
            type: 'commute',
            waypoints: points.slice(0, 10),
            confidence: Math.min(0.9, points.length / 50)
        }));
}

// ========================
// Get Alerts
// ========================
const getAlerts = async (req, res) => {
    try {
        const { userId, status, type, limit = 20 } = req.query;

        let query = 'SELECT * FROM behavior_alerts WHERE user_id = ?';
        const params = [userId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (type) {
            query += ' AND alert_type = ?';
            params.push(type);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [alerts] = await db.query(query, params);

        res.json({
            success: true,
            data: { alerts }
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

// ========================
// Resolve Alert
// ========================
const resolveAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { userId, resolution, notes, responseTime } = req.body;

        await db.query(
            `UPDATE behavior_alerts 
            SET status = 'resolved', resolved_at = ?, response_data = ?
            WHERE id = ? AND user_id = ?`,
            [new Date(), JSON.stringify({ resolution, notes, responseTime }), alertId, userId]
        );

        res.json({
            success: true,
            data: { message: 'Alert resolved successfully' }
        });

    } catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: error.message }
        });
    }
};

module.exports = {
    analyzeLocation,
    getAnomalies,
    getBehaviorSummary,
    submitFeedback,
    getSettings,
    updateSettings,
    getRoutines,
    learnRoutines,
    getAlerts,
    resolveAlert
};

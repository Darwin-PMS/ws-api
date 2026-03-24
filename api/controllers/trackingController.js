const db = require('../config/db');

// HTTP Status Codes
const OK = 200;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const INTERNAL_SERVER_ERROR = 500;

/**
 * Get all user locations for tracking
 * GET /admin/tracking/locations
 */
const getAllLocations = async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            // Query to get all users with their latest location
            const query = `
                SELECT
                    u.id as user_id,
                    CONCAT(u.first_name, ' ', u.last_name) as name,
                    u.email,
                    u.phone,
                    COALESCE(
                        (SELECT latitude FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        28.6139
                    ) as latitude,
                    COALESCE(
                        (SELECT longitude FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        77.2090
                    ) as longitude,
                    COALESCE(
                        (SELECT status FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        'safe'
                    ) as status,
                    COALESCE(
                        (SELECT timestamp FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        NOW()
                    ) as last_updated,
                    COALESCE(
                        (SELECT address FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        'Location not available'
                    ) as address,
                    f.id as family_id,
                    f.name as family_name,
                    (SELECT COUNT(*) FROM family_members WHERE family_id = f.id) as family_members_count
                FROM users u
                LEFT JOIN family_members fm ON u.id = fm.user_id
                LEFT JOIN families f ON fm.family_id = f.id
                WHERE u.role IN ('woman', 'parent', 'guardian')
                ORDER BY u.id
            `;

            const [results] = await connection.execute(query);

            // Format the results
            const locations = results.map(row => ({
                user_id: row.user_id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                status: row.status,
                last_updated: row.last_updated,
                address: row.address,
                family: row.family_id ? {
                    id: row.family_id,
                    name: row.family_name,
                    members: row.family_members_count
                } : null,
                emergency_contacts: [] // Can be populated from emergency_contacts table
            }));

            res.status(OK).json({
                success: true,
                locations: locations,
                count: locations.length
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching all locations:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch locations',
            error: error.message
        });
    }
};

/**
 * Get family locations
 * GET /admin/tracking/family/:familyId
 */
const getFamilyLocations = async (req, res) => {
    try {
        const { familyId } = req.params;
        const connection = await db.getConnection();

        try {
            const query = `
                SELECT
                    u.id as user_id,
                    CONCAT(u.first_name, ' ', u.last_name) as name,
                    u.email,
                    u.phone,
                    COALESCE(
                        (SELECT latitude FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        28.6139
                    ) as latitude,
                    COALESCE(
                        (SELECT longitude FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        77.2090
                    ) as longitude,
                    COALESCE(
                        (SELECT status FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        'safe'
                    ) as status,
                    COALESCE(
                        (SELECT timestamp FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        NOW()
                    ) as last_updated,
                    COALESCE(
                        (SELECT address FROM user_locations
                         WHERE user_id = u.id
                         ORDER BY timestamp DESC LIMIT 1),
                        'Location not available'
                    ) as address
                FROM users u
                INNER JOIN family_members fm ON u.id = fm.user_id
                WHERE fm.family_id = ?
                AND u.role IN ('woman', 'parent', 'guardian')
            `;

            const [results] = await connection.execute(query, [familyId]);

            const locations = results.map(row => ({
                user_id: row.user_id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                status: row.status,
                last_updated: row.last_updated,
                address: row.address
            }));

            res.status(OK).json({
                success: true,
                locations: locations,
                count: locations.length
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching family locations:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch family locations',
            error: error.message
        });
    }
};

/**
 * Get single user location
 * GET /admin/tracking/user/:userId
 */
const getUserLocation = async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await db.getConnection();

        try {
            const query = `
                SELECT
                    u.id as user_id,
                    CONCAT(u.first_name, ' ', u.last_name) as name,
                    u.email,
                    u.phone,
                    COALESCE(ul.latitude, 28.6139) as latitude,
                    COALESCE(ul.longitude, 77.2090) as longitude,
                    COALESCE(ul.status, 'safe') as status,
                    COALESCE(ul.timestamp, NOW()) as last_updated,
                    COALESCE(ul.address, 'Location not available') as address,
                    fm.family_id,
                    f.name as family_name
                FROM users u
                LEFT JOIN family_members fm ON u.id = fm.user_id
                LEFT JOIN families f ON fm.family_id = f.id
                LEFT JOIN user_locations ul ON u.id = ul.user_id
                WHERE u.id = ?
                ORDER BY ul.timestamp DESC
                LIMIT 1
            `;

            const [results] = await connection.execute(query, [userId]);

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const row = results[0];
            const location = {
                user_id: row.user_id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                status: row.status,
                last_updated: row.last_updated,
                address: row.address,
                family: row.family_id ? {
                    id: row.family_id,
                    name: row.family_name
                } : null
            };

            res.status(200).json({
                success: true,
                location: location
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching user location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user location',
            error: error.message
        });
    }
};

/**
 * Get user location history
 * GET /admin/tracking/user/:userId/history?minutes=30
 */
const getUserLocationHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { minutes = 30 } = req.query;
        const connection = await db.getConnection();

        try {
            const query = `
                SELECT 
                    id,
                    user_id,
                    latitude,
                    longitude,
                    status,
                    address,
                    speed,
                    accuracy,
                    timestamp
                FROM user_locations
                WHERE user_id = ?
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
                ORDER BY timestamp DESC
            `;

            const [results] = await connection.execute(query, [userId, minutes]);

            const history = results.map(row => ({
                id: row.id,
                user_id: row.user_id,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                status: row.status,
                address: row.address,
                speed: row.speed ? parseFloat(row.speed) : null,
                accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
                timestamp: row.timestamp
            }));

            res.status(OK).json({
                success: true,
                userId: userId,
                history: history,
                count: history.length,
                minutes: parseInt(minutes)
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching user location history:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch location history',
            error: error.message
        });
    }
};

/**
 * Update user location
 * POST /admin/tracking/user/:userId/location
 */
const updateUserLocation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { latitude, longitude, status, address, speed, accuracy } = req.body;
        const connection = await db.getConnection();

        try {
            // Validate required fields
            if (!latitude || !longitude) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            // Insert new location record
            const insertQuery = `
                INSERT INTO user_locations 
                (user_id, latitude, longitude, status, address, speed, accuracy, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            await connection.execute(insertQuery, [
                userId,
                latitude,
                longitude,
                status || 'safe',
                address || null,
                speed || null,
                accuracy || null
            ]);

            res.status(OK).json({
                success: true,
                message: 'Location updated successfully',
                data: {
                    user_id: userId,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    status: status || 'safe',
                    timestamp: new Date()
                }
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating user location:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
};

/**
 * Get nearby emergency services
 * GET /admin/tracking/nearby?lat=28.6139&lng=77.2090&radius=5000
 */
const getNearbyEmergencyServices = async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;
        const connection = await db.getConnection();

        try {
            if (!lat || !lng) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            // Haversine formula to calculate distance
            const query = `
                SELECT 
                    id,
                    name,
                    type,
                    latitude,
                    longitude,
                    address,
                    phone,
                    (
                        6371 * acos(
                            cos(radians(?)) * cos(radians(latitude)) *
                            cos(radians(longitude) - radians(?)) +
                            sin(radians(?)) * sin(radians(latitude))
                        )
                    ) as distance_km
                FROM emergency_services
                WHERE 
                    latitude BETWEEN ? - ? AND ? + ?
                    AND longitude BETWEEN ? - ? AND ? + ?
                HAVING distance_km <= ?
                ORDER BY distance_km
                LIMIT 20
            `;

            const latRad = lat * Math.PI / 180;
            const radiusDegrees = radius / 111000; // Convert meters to approximate degrees

            const [results] = await connection.execute(query, [
                lat, lng, lat,
                lat, radiusDegrees, lat, radiusDegrees,
                lng, radiusDegrees, lng, radiusDegrees,
                radius / 1000 // Convert to km
            ]);

            const services = results.map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                address: row.address,
                phone: row.phone,
                distance: parseFloat(row.distance_km)
            }));

            res.status(OK).json({
                success: true,
                services: services,
                count: services.length,
                searchParams: {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                    radius: parseInt(radius)
                }
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching nearby emergency services:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch emergency services',
            error: error.message
        });
    }
};

/**
 * Get geofences
 * GET /admin/tracking/geofences
 */
const getGeofences = async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            const query = `
                SELECT 
                    id,
                    name,
                    type,
                    latitude,
                    longitude,
                    radius,
                    description,
                    is_active,
                    created_at,
                    updated_at
                FROM geofences
                WHERE is_active = 1
                ORDER BY created_at DESC
            `;

            const [results] = await connection.execute(query);

            const geofences = results.map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude),
                radius: parseFloat(row.radius),
                description: row.description,
                is_active: row.is_active,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));

            res.status(OK).json({
                success: true,
                geofences: geofences,
                count: geofences.length
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching geofences:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch geofences',
            error: error.message
        });
    }
};

/**
 * Create geofence
 * POST /admin/tracking/geofences
 */
const createGeofence = async (req, res) => {
    try {
        const { name, type, latitude, longitude, radius, description } = req.body;
        const connection = await db.getConnection();

        try {
            // Validate required fields
            if (!name || !type || !latitude || !longitude || !radius) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Name, type, latitude, longitude, and radius are required'
                });
            }

            const query = `
                INSERT INTO geofences 
                (name, type, latitude, longitude, radius, description, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            `;

            const [result] = await connection.execute(query, [
                name,
                type,
                latitude,
                longitude,
                radius,
                description || null
            ]);

            res.status(OK).json({
                success: true,
                message: 'Geofence created successfully',
                data: {
                    id: result.insertId,
                    name,
                    type,
                    latitude,
                    longitude,
                    radius
                }
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating geofence:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create geofence',
            error: error.message
        });
    }
};

/**
 * Update geofence
 * PUT /admin/tracking/geofences/:id
 */
const updateGeofence = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, latitude, longitude, radius, description, is_active } = req.body;
        const connection = await db.getConnection();

        try {
            const query = `
                UPDATE geofences
                SET name = ?, type = ?, latitude = ?, longitude = ?, 
                    radius = ?, description = ?, is_active = ?, updated_at = NOW()
                WHERE id = ?
            `;

            await connection.execute(query, [
                name,
                type,
                latitude,
                longitude,
                radius,
                description,
                is_active !== undefined ? is_active : 1,
                id
            ]);

            res.status(OK).json({
                success: true,
                message: 'Geofence updated successfully'
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating geofence:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update geofence',
            error: error.message
        });
    }
};

/**
 * Delete geofence
 * DELETE /admin/tracking/geofences/:id
 */
const deleteGeofence = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await db.getConnection();

        try {
            const query = `DELETE FROM geofences WHERE id = ?`;
            const [result] = await connection.execute(query, [id]);

            if (result.affectedRows === 0) {
                return res.status(NOT_FOUND).json({
                    success: false,
                    message: 'Geofence not found'
                });
            }

            res.status(OK).json({
                success: true,
                message: 'Geofence deleted successfully'
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting geofence:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete geofence',
            error: error.message
        });
    }
};

/**
 * Get heatmap data
 * GET /admin/tracking/heatmap
 */
const getHeatmapData = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const connection = await db.getConnection();

        try {
            // Get location density for heatmap
            const query = `
                SELECT 
                    ROUND(latitude, 3) as lat_group,
                    ROUND(longitude, 3) as lng_group,
                    COUNT(*) as incident_count,
                    MAX(timestamp) as last_incident
                FROM user_locations
                WHERE 
                    status IN ('danger', 'sos')
                    AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY lat_group, lng_group
                HAVING incident_count >= 1
                ORDER BY incident_count DESC
                LIMIT 100
            `;

            const [results] = await connection.execute(query, [days]);

            const heatmapData = results.map(row => ({
                latitude: parseFloat(row.lat_group),
                longitude: parseFloat(row.lng_group),
                intensity: Math.min(row.incident_count / 10, 1), // Normalize to 0-1
                count: row.incident_count,
                last_incident: row.last_incident
            }));

            res.status(OK).json({
                success: true,
                heatmapData: heatmapData,
                count: heatmapData.length,
                days: parseInt(days)
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch heatmap data',
            error: error.message
        });
    }
};

/**
 * Predict route based on movement history
 * GET /admin/tracking/predict/:userId
 */
const predictRoute = async (req, res) => {
    try {
        const { userId } = req.params;
        const { hours = 24 } = req.query;
        const connection = await db.getConnection();

        try {
            const query = `
                SELECT 
                    latitude,
                    longitude,
                    speed,
                    heading,
                    timestamp,
                    address
                FROM user_locations
                WHERE user_id = ?
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY timestamp ASC
            `;

            const [results] = await connection.execute(query, [userId, hours]);

            if (results.length < 3) {
                return res.status(OK).json({
                    success: true,
                    prediction: null,
                    message: 'Not enough data for prediction',
                    dataPoints: results.length
                });
            }

            const points = results.map(row => ({
                lat: parseFloat(row.latitude),
                lng: parseFloat(row.longitude),
                speed: parseFloat(row.speed) || 0,
                heading: parseFloat(row.heading) || 0,
                timestamp: row.timestamp,
                address: row.address
            }));

            const prediction = analyzeMovement(points);

            res.status(OK).json({
                success: true,
                userId: userId,
                prediction: prediction,
                dataPoints: points.length,
                analysisPeriod: `${hours} hours`
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error predicting route:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to predict route',
            error: error.message
        });
    }
};

/**
 * Analyze movement patterns
 */
function analyzeMovement(points) {
    if (points.length < 2) return null;

    const recentPoints = points.slice(-10);
    const avgSpeed = recentPoints.reduce((sum, p) => sum + p.speed, 0) / recentPoints.length;
    const latestPoint = points[points.length - 1];
    const previousPoint = points[points.length - 2];

    const direction = calculateBearing(
        previousPoint.lat, previousPoint.lng,
        latestPoint.lat, latestPoint.lng
    );

    const directionName = getDirectionName(direction);
    
    const isMoving = avgSpeed > 1;
    
    const estimatedArrival = isMoving ? estimateArrival(recentPoints) : null;

    const routePath = points.map(p => [p.lat, p.lng]);

    const nextPoint = predictNextPosition(latestPoint, direction, avgSpeed);

    return {
        currentLocation: {
            latitude: latestPoint.lat,
            longitude: latestPoint.lng,
            address: latestPoint.address,
            lastUpdated: latestPoint.timestamp
        },
        movement: {
            isMoving: isMoving,
            averageSpeed: Math.round(avgSpeed * 100) / 100,
            direction: directionName,
            bearing: Math.round(direction),
            speedKmh: Math.round(avgSpeed * 3.6 * 100) / 100
        },
        prediction: {
            nextPosition: nextPoint,
            estimatedArrival: estimatedArrival,
            confidence: calculateConfidence(points)
        },
        route: {
            path: routePath,
            totalPoints: points.length,
            startTime: points[0].timestamp,
            endTime: latestPoint.timestamp
        },
        status: isMoving ? 'in_transit' : 'stationary'
    };
}

function calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
              Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
    const bearing = Math.atan2(y, x);
    return (toDeg(bearing) + 360) % 360;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

function toDeg(rad) {
    return rad * (180 / Math.PI);
}

function getDirectionName(bearing) {
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
}

function predictNextPosition(current, direction, speed) {
    const distanceKm = (speed || 0) * 0.1 / 3600;
    const bearingRad = toRad(direction);
    
    const lat2 = Math.asin(
        Math.sin(toRad(current.lat)) * Math.cos(distanceKm / 6371) +
        Math.cos(toRad(current.lat)) * Math.sin(distanceKm / 6371) * Math.cos(bearingRad)
    );
    
    const lng2 = toRad(current.lng) + Math.atan2(
        Math.sin(bearingRad) * Math.sin(distanceKm / 6371) * Math.cos(toRad(current.lat)),
        Math.cos(distanceKm / 6371) - Math.sin(toRad(current.lat)) * Math.sin(lat2)
    );

    return {
        latitude: toDeg(lat2),
        longitude: toDeg(lng2),
        estimatedDistance: distanceKm
    };
}

function estimateArrival(recentPoints) {
    if (recentPoints.length < 2) return null;

    const speeds = recentPoints.map(p => p.speed).filter(s => s > 0);
    if (speeds.length === 0) return null;

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const avgSpeedKmh = avgSpeed * 3.6;

    const destDist = estimateDistanceToDestination(recentPoints);
    const timeHours = destDist / avgSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);

    const arrivalTime = new Date(Date.now() + timeMinutes * 60000);

    return {
        estimatedMinutes: timeMinutes,
        estimatedArrival: arrivalTime.toISOString(),
        distanceKm: Math.round(destDist * 100) / 100,
        averageSpeedKmh: Math.round(avgSpeedKmh * 100) / 100
    };
}

function estimateDistanceToDestination(points) {
    if (points.length < 5) return 0;

    const recent = points.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];

    return haversineDistance(first.lat, first.lng, last.lat, last.lng) * 0.5;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateConfidence(points) {
    const recent = points.slice(-10);
    if (recent.length < 3) return 0;

    let directionChanges = 0;
    for (let i = 1; i < recent.length; i++) {
        const bearing = calculateBearing(
            recent[i-1].lat, recent[i-1].lng,
            recent[i].lat, recent[i].lng
        );
        const prevBearing = i > 1 ? calculateBearing(
            recent[i-2].lat, recent[i-2].lng,
            recent[i-1].lat, recent[i-1].lng
        ) : bearing;

        if (Math.abs(bearing - prevBearing) > 30) {
            directionChanges++;
        }
    }

    const consistency = 1 - (directionChanges / Math.max(recent.length - 1, 1));
    const dataQuality = Math.min(recent.length / 10, 1);
    const confidence = Math.round((consistency * 0.6 + dataQuality * 0.4) * 100);

    return {
        percentage: confidence,
        level: confidence > 70 ? 'high' : confidence > 40 ? 'medium' : 'low',
        factors: {
            directionConsistency: Math.round(consistency * 100),
            dataQuality: Math.round(dataQuality * 100)
        }
    };
}

/**
 * Get user offline status
 * GET /admin/tracking/status/:userId
 */
const getUserOfflineStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = await db.getConnection();

        try {
            const query = `
                SELECT 
                    latitude,
                    longitude,
                    status,
                    address,
                    timestamp,
                    TIMESTAMPDIFF(MINUTE, timestamp, NOW()) as minutesOffline
                FROM user_locations
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT 1
            `;

            const [results] = await connection.execute(query, [userId]);

            if (results.length === 0) {
                return res.status(OK).json({
                    success: true,
                    userId: userId,
                    status: 'unknown',
                    message: 'No location data found'
                });
            }

            const lastLocation = results[0];
            const minutesOffline = lastLocation.minutesOffline;
            const isOffline = minutesOffline > 5;

            res.status(OK).json({
                success: true,
                userId: userId,
                status: isOffline ? 'offline' : 'online',
                lastLocation: {
                    latitude: parseFloat(lastLocation.latitude),
                    longitude: parseFloat(lastLocation.longitude),
                    address: lastLocation.address,
                    status: lastLocation.status,
                    lastSeen: lastLocation.timestamp
                },
                offlineDuration: {
                    minutes: minutesOffline,
                    formatted: formatOfflineDuration(minutesOffline)
                },
                isStale: minutesOffline > 30
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error getting offline status:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get offline status',
            error: error.message
        });
    }
};

function formatOfflineDuration(minutes) {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

module.exports = {
    getAllLocations,
    getFamilyLocations,
    getUserLocation,
    getUserLocationHistory,
    updateUserLocation,
    getNearbyEmergencyServices,
    getGeofences,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    getHeatmapData,
    predictRoute,
    getUserOfflineStatus
};

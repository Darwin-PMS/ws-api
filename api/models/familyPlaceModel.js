// Family Place Model - Database operations for family places

const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const familyPlaceModel = {
    // ==================== PLACE CRUD ====================

    // Create a new family place
    async createPlace(data) {
        const pool = getPool();
        const { familyId, name, placeType, address, latitude, longitude, radiusMeters, privacyTag, createdBy } = data;

        const placeId = uuidv4();

        await pool.query(
            `INSERT INTO family_places 
            (id, family_id, name, place_type, address, latitude, longitude, radius_meters, privacy_tag, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [placeId, familyId, name, placeType, address || null, latitude, longitude, radiusMeters || 100, privacyTag || null, createdBy]
        );

        // Get the created place
        const [places] = await pool.query(
            'SELECT * FROM family_places WHERE id = ?',
            [placeId]
        );

        return places[0];
    },

    // Get place by ID
    async getPlaceById(placeId) {
        const pool = getPool();
        const [places] = await pool.query(
            'SELECT * FROM family_places WHERE id = ?',
            [placeId]
        );
        return places[0] || null;
    },

    // Get all places for a family
    async getFamilyPlaces(familyId) {
        const pool = getPool();
        const [places] = await pool.query(
            'SELECT * FROM family_places WHERE family_id = ? AND is_active = TRUE ORDER BY name ASC',
            [familyId]
        );
        return places;
    },

    // Get places by type for a family
    async getPlacesByType(familyId, placeType) {
        const pool = getPool();
        const [places] = await pool.query(
            'SELECT * FROM family_places WHERE family_id = ? AND place_type = ? AND is_active = TRUE',
            [familyId, placeType]
        );
        return places;
    },

    // Update place
    async updatePlace(placeId, data) {
        const pool = getPool();
        const { name, address, latitude, longitude, radiusMeters, privacyTag, isActive } = data;

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            params.push(address);
        }
        if (latitude !== undefined) {
            updates.push('latitude = ?');
            params.push(latitude);
        }
        if (longitude !== undefined) {
            updates.push('longitude = ?');
            params.push(longitude);
        }
        if (radiusMeters !== undefined) {
            updates.push('radius_meters = ?');
            params.push(radiusMeters);
        }
        if (privacyTag !== undefined) {
            updates.push('privacy_tag = ?');
            params.push(privacyTag);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive);
        }

        if (updates.length === 0) return true;

        params.push(placeId);
        await pool.query(
            `UPDATE family_places SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        return true;
    },

    // Delete (deactivate) place
    async deletePlace(placeId) {
        const pool = getPool();
        await pool.query(
            'UPDATE family_places SET is_active = FALSE WHERE id = ?',
            [placeId]
        );
        return true;
    },

    // ==================== GEOFENCING HELPERS ====================

    // Check if a location is within any family place
    async checkLocationInFamilyPlaces(familyId, latitude, longitude) {
        const places = await this.getFamilyPlaces(familyId);
        const matchingPlaces = [];

        for (const place of places) {
            const distance = this.calculateDistance(
                latitude, longitude,
                parseFloat(place.latitude), parseFloat(place.longitude)
            );

            if (distance <= place.radius_meters) {
                matchingPlaces.push({
                    ...place,
                    distance
                });
            }
        }

        return matchingPlaces;
    },

    // Calculate distance between two points in meters (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },

    // Find nearest place to a location
    async findNearestPlace(familyId, latitude, longitude) {
        const places = await this.getFamilyPlaces(familyId);
        let nearestPlace = null;
        let minDistance = Infinity;

        for (const place of places) {
            const distance = this.calculateDistance(
                latitude, longitude,
                parseFloat(place.latitude), parseFloat(place.longitude)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestPlace = {
                    ...place,
                    distance
                };
            }
        }

        return nearestPlace;
    },

    // ==================== VALIDATION ====================

    // Verify user is member of the family that owns the place
    async isPlaceOwnedByFamily(placeId, familyId) {
        const pool = getPool();
        const [places] = await pool.query(
            'SELECT id FROM family_places WHERE id = ? AND family_id = ?',
            [placeId, familyId]
        );
        return places.length > 0;
    }
};

module.exports = familyPlaceModel;

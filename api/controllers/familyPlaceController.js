// Family Place Controller - API endpoints for family places management

const familyPlaceModel = require('../models/familyPlaceModel');
const familyModel = require('../models/familyModel');

const familyPlaceController = {
    // ==================== PLACE CRUD ====================

    // Create a new family place
    async createPlace(req, res) {
        try {
            const { familyId } = req.params;
            const { name, placeType, address, latitude, longitude, radiusMeters, privacyTag } = req.body;
            const userId = req.user.id;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            // Validate required fields
            if (!name || !placeType || latitude === undefined || longitude === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, placeType, latitude, and longitude are required'
                });
            }

            // Validate place type
            const validTypes = ['home', 'school', 'daycare', 'park', 'clinic', 'hospital', 'relative_home', 'work', 'sports', 'other'];
            if (!validTypes.includes(placeType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid place type'
                });
            }

            const place = await familyPlaceModel.createPlace({
                familyId,
                name,
                placeType,
                address,
                latitude,
                longitude,
                radiusMeters,
                privacyTag,
                createdBy: userId
            });

            res.status(201).json({
                success: true,
                message: 'Place created successfully',
                place
            });
        } catch (error) {
            console.error('Create place error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create place'
            });
        }
    },

    // Get all places for a family
    async getFamilyPlaces(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            const places = await familyPlaceModel.getFamilyPlaces(familyId);

            res.status(200).json({
                success: true,
                places
            });
        } catch (error) {
            console.error('Get places error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get places'
            });
        }
    },

    // Get place by ID
    async getPlaceById(req, res) {
        try {
            const { familyId, placeId } = req.params;
            const userId = req.user.id;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            const place = await familyPlaceModel.getPlaceById(placeId);
            if (!place || place.family_id !== familyId) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            res.status(200).json({
                success: true,
                place
            });
        } catch (error) {
            console.error('Get place error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get place'
            });
        }
    },

    // Update place
    async updatePlace(req, res) {
        try {
            const { familyId, placeId } = req.params;
            const { name, address, latitude, longitude, radiusMeters, privacyTag, isActive } = req.body;
            const userId = req.user.id;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            // Check if place belongs to family
            const isOwner = await familyPlaceModel.isPlaceOwnedByFamily(placeId, familyId);
            if (!isOwner) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            await familyPlaceModel.updatePlace(placeId, {
                name,
                address,
                latitude,
                longitude,
                radiusMeters,
                privacyTag,
                isActive
            });

            res.status(200).json({
                success: true,
                message: 'Place updated successfully'
            });
        } catch (error) {
            console.error('Update place error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update place'
            });
        }
    },

    // Delete (deactivate) place
    async deletePlace(req, res) {
        try {
            const { familyId, placeId } = req.params;
            const userId = req.user.id;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            // Check if place belongs to family
            const isOwner = await familyPlaceModel.isPlaceOwnedByFamily(placeId, familyId);
            if (!isOwner) {
                return res.status(404).json({
                    success: false,
                    message: 'Place not found'
                });
            }

            await familyPlaceModel.deletePlace(placeId);

            res.status(200).json({
                success: true,
                message: 'Place deleted successfully'
            });
        } catch (error) {
            console.error('Delete place error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete place'
            });
        }
    },

    // ==================== GEOFENCING ====================

    // Check current location against family places
    async checkLocation(req, res) {
        try {
            const { familyId } = req.params;
            const { latitude, longitude } = req.body;
            const userId = req.user.id;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            if (latitude === undefined || longitude === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            const matchingPlaces = await familyPlaceModel.checkLocationInFamilyPlaces(
                familyId,
                parseFloat(latitude),
                parseFloat(longitude)
            );

            // Filter out places with do_not_log privacy tag
            const visiblePlaces = matchingPlaces.filter(p => p.privacy_tag !== 'do_not_log');

            res.status(200).json({
                success: true,
                places: visiblePlaces,
                isInsideFamilyPlace: visiblePlaces.length > 0
            });
        } catch (error) {
            console.error('Check location error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check location'
            });
        }
    },

    // Find nearest family place
    async findNearestPlace(req, res) {
        try {
            const { familyId } = req.params;
            const { latitude, longitude } = req.body;
            const userId = req.user.id;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            if (latitude === undefined || longitude === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            const nearestPlace = await familyPlaceModel.findNearestPlace(
                familyId,
                parseFloat(latitude),
                parseFloat(longitude)
            );

            res.status(200).json({
                success: true,
                place: nearestPlace
            });
        } catch (error) {
            console.error('Find nearest place error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to find nearest place'
            });
        }
    }
};

module.exports = familyPlaceController;

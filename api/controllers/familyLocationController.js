// Family Location Controller - API endpoints for family member location tracking

const familyModel = require('../models/familyModel');
const userModel = require('../models/userModel');

const familyLocationController = {
    // Get last known location for all family members - INCLUDING members without location
    async getFamilyLocations(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            console.log('═══════════════════════════════════════');
            console.log('📍 GET FAMILY LOCATIONS API');
            console.log('Family ID:', familyId);
            console.log('User ID:', userId);

            // Admin can access any family
            if (userRole !== 'admin') {
                // Verify caller is a member of the family
                const membership = await familyModel.getMemberByFamilyAndUser(familyId, userId);
                if (!membership) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not a member of this family'
                    });
                }
            }

            // Get all family members
            const members = await familyModel.getFamilyMembers(familyId);
            console.log('Family members found:', members?.length || 0);

            if (!members || members.length === 0) {
                return res.status(200).json({
                    success: true,
                    locations: []
                });
            }

            // Get location for each member - include ALL members (even without location)
            const locations = await Promise.all(
                members.map(async (member) => {
                    // Check if user has location sharing enabled
                    const userSettings = await userModel.getUserSettings(member.user_id);
                    console.log(`Member ${member.user_id} settings:`, userSettings);

                    // Get latest location from location_history
                    let location = null;
                    try {
                        location = await userModel.getLatestLocation(member.user_id);
                        console.log(`Member ${member.user_id} location:`, location);
                    } catch (locError) {
                        console.log(`Error getting location for ${member.user_id}:`, locError.message);
                    }

                    // Calculate if member is online (location updated within last 5 minutes)
                    // Use updated_at for current_location table, created_at for history
                    const locationTime = location ? (location.updated_at ? new Date(location.updated_at).getTime() : new Date(location.created_at).getTime()) : null;
                    let isOnline = false;
                    let lastSeen = null;
                    
                    if (location && locationTime) {
                        const now = Date.now();
                        const fiveMinutes = 5 * 60 * 1000;
                        isOnline = (now - locationTime) < fiveMinutes;
                        lastSeen = location.updated_at || location.created_at;
                    }

                    // Return ALL members regardless of location sharing or location data
                    const locationEnabled = userSettings ? userSettings.location_enabled === 1 || userSettings.location_enabled === true : false;
                    return {
                        user_id: member.user_id,
                        first_name: member.first_name,
                        last_name: member.last_name,
                        nickname: member.nickname,
                        role: member.role,
                        // Location data (can be null if no location)
                        latitude: location?.latitude || null,
                        longitude: location?.longitude || null,
                        accuracy: location?.accuracy || null,
                        // Last seen timestamp
                        last_seen: lastSeen,
                        is_online: isOnline,
                        // Whether location tracking is enabled
                        location_sharing_enabled: locationEnabled
                    };
                })
            );

            res.status(200).json({
                success: true,
                locations: locations
            });
        } catch (error) {
            console.error('Get family locations error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get family locations'
            });
        }
    },

    // Get latest location for a specific family member
    async getMemberLocation(req, res) {
        try {
            const { familyId, userId } = req.params;
            const callerId = req.user.id;
            const userRole = req.user.role;

            // Admin can access any family
            if (userRole !== 'admin') {
                // Verify caller is a member of the family
                const membership = await familyModel.getMemberByFamilyAndUser(familyId, callerId);
                if (!membership) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not a member of this family'
                    });
                }

                // Verify target user is a member of the family
                const targetMembership = await familyModel.getMemberByFamilyAndUser(familyId, userId);
                if (!targetMembership) {
                    return res.status(404).json({
                        success: false,
                        message: 'Member not found in this family'
                    });
                }
            }

            // Get target user details
            const targetUser = await userModel.getUserById(userId);

            // Get latest location from location_history (no longer requires sharing to be enabled)
            const location = await userModel.getLatestLocation(userId);

            // Calculate if member is online
            let isOnline = false;
            let lastSeen = null;
            if (location && location.created_at) {
                const locationTime = new Date(location.created_at).getTime();
                const now = Date.now();
                const fiveMinutes = 5 * 60 * 1000;
                isOnline = (now - locationTime) < fiveMinutes;
                lastSeen = location.created_at;
            }

            res.status(200).json({
                success: true,
                location: {
                    user_id: userId,
                    first_name: targetUser.first_name,
                    last_name: targetUser.last_name,
                    nickname: targetMembership.nickname,
                    role: targetMembership.role,
                    latitude: location?.latitude || null,
                    longitude: location?.longitude || null,
                    accuracy: location?.accuracy || null,
                    last_seen: lastSeen,
                    is_online: isOnline
                }
            });
        } catch (error) {
            console.error('Get member location error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get member location'
            });
        }
    }
};

module.exports = familyLocationController;

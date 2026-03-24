// Event Controller - API endpoints for event ingestion (location, activity, etc.)

const familyModel = require('../models/familyModel');
const contextEngine = require('../services/contextEngine');
const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const eventController = {
    // ==================== LOCATION EVENTS ====================

    // Process a location update event
    async handleLocationEvent(req, res) {
        try {
            const { familyId } = req.params;
            const { latitude, longitude, accuracy, activityType, timestamp } = req.body;
            const userId = req.user.id;

            console.log('═══════════════════════════════════════');
            console.log('📍 LOCATION EVENT RECEIVED');
            console.log('Family ID:', familyId);
            console.log('User ID:', userId);
            console.log('Location:', { latitude, longitude, accuracy, activityType });

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            // Validate required fields
            if (latitude === undefined || longitude === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            // Build the event object
            const event = {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                accuracy: accuracy ? parseFloat(accuracy) : null,
                activityType: activityType || 'dwell',
                timestamp: timestamp || new Date().toISOString()
            };

            // Process through context engine
            const result = await contextEngine.processLocationEvent(userId, familyId, event);

            // Log the event for audit
            await contextEngine.logAuditAction(
                userId,
                familyId,
                'location_event_received',
                'location_event',
                null,
                { ...event, processed: result.processed, reason: result.reason }
            );

            // Store location in history
            await this.storeLocationHistory(userId, event);

            res.status(200).json({
                success: true,
                processed: result.processed,
                reason: result.reason,
                suggestion: result.suggestion || null
            });
        } catch (error) {
            console.error('Location event error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process location event'
            });
        }
    },

    // Batch process location events
    async handleBatchLocationEvents(req, res) {
        try {
            const { familyId } = req.params;
            const { events } = req.body;
            const userId = req.user.id;

            console.log('═══════════════════════════════════════');
            console.log('📍 BATCH LOCATION EVENTS RECEIVED');
            console.log('Family ID:', familyId);
            console.log('User ID:', userId);
            console.log('Events count:', events?.length || 0);

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            if (!events || !Array.isArray(events) || events.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Events array is required'
                });
            }

            // Process each event
            const results = [];
            for (const event of events) {
                const processed = await contextEngine.processLocationEvent(userId, familyId, event);
                results.push({
                    event,
                    result: processed
                });

                // Store location in history
                await this.storeLocationHistory(userId, event);
            }

            // Log batch event for audit
            await contextEngine.logAuditAction(
                userId,
                familyId,
                'batch_location_events_received',
                'batch_location_events',
                null,
                { eventsCount: events.length }
            );

            res.status(200).json({
                success: true,
                processed: results.filter(r => r.result.processed).length,
                total: events.length,
                suggestions: results.filter(r => r.result.suggestion).map(r => r.result.suggestion)
            });
        } catch (error) {
            console.error('Batch location event error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process batch location events'
            });
        }
    },

    // Store location in history
    async storeLocationHistory(userId, event) {
        const pool = getPool();
        const locationId = uuidv4();

        await pool.query(
            `INSERT INTO location_history (id, user_id, latitude, longitude, accuracy, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [locationId, userId, event.latitude, event.longitude, event.accuracy, event.timestamp || new Date()]
        );
    },

    // ==================== SUGGESTIONS ====================

    // Get pending suggestions for user
    async getSuggestions(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;
            const { status, limit = 20 } = req.query;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            const pool = getPool();
            let query = 'SELECT * FROM suggestions WHERE user_id = ? AND family_id = ?';
            const params = [userId, familyId];

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            query += ' ORDER BY created_at DESC LIMIT ?';
            params.push(parseInt(limit));

            const [suggestions] = await pool.query(query, params);

            res.status(200).json({
                success: true,
                suggestions
            });
        } catch (error) {
            console.error('Get suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get suggestions'
            });
        }
    },

    // Respond to a suggestion (accept, dismiss, snooze)
    async respondToSuggestion(req, res) {
        try {
            const { suggestionId } = req.params;
            const { action, payload } = req.body;
            const userId = req.user.id;

            console.log('═══════════════════════════════════════');
            console.log('💡 SUGGESTION RESPONSE RECEIVED');
            console.log('Suggestion ID:', suggestionId);
            console.log('Action:', action);

            const pool = getPool();

            // Get the suggestion
            const [suggestions] = await pool.query(
                'SELECT * FROM suggestions WHERE id = ? AND user_id = ?',
                [suggestionId, userId]
            );

            const suggestion = suggestions[0];
            if (!suggestion) {
                return res.status(404).json({
                    success: false,
                    message: 'Suggestion not found'
                });
            }

            // Validate action
            const validActions = ['accepted', 'dismissed', 'snoozed', 'shown'];
            if (!validActions.includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
            }

            const now = new Date();
            const updateData = {
                status: action,
                resolved_at: action === 'accepted' || action === 'dismissed' ? now : null,
                shown_at: action === 'shown' ? now : suggestion.shown_at
            };

            await pool.query(
                `UPDATE suggestions SET status = ?, resolved_at = ?, shown_at = ? WHERE id = ?`,
                [updateData.status, updateData.resolved_at, updateData.shown_at, suggestionId]
            );

            // If accepted, create activity log
            if (action === 'accepted') {
                const activityId = uuidv4();
                const activityData = payload || {};

                await pool.query(
                    `INSERT INTO family_activity_logs 
                    (id, family_id, user_id, context_id, activity_type, title, description, started_at, metadata) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        activityId,
                        suggestion.family_id,
                        userId,
                        suggestion.context_id,
                        activityData.type || 'general',
                        activityData.title || suggestion.title,
                        activityData.description || suggestion.body,
                        activityData.startedAt || now,
                        JSON.stringify(activityData.metadata || {})
                    ]
                );

                // Log audit
                await contextEngine.logAuditAction(
                    userId,
                    suggestion.family_id,
                    'suggestion_accepted',
                    'suggestion',
                    suggestionId,
                    { activityId }
                );
            } else {
                // Log audit for other actions
                await contextEngine.logAuditAction(
                    userId,
                    suggestion.family_id,
                    `suggestion_${action}`,
                    'suggestion',
                    suggestionId
                );
            }

            res.status(200).json({
                success: true,
                message: `Suggestion ${action} successfully`,
                action
            });
        } catch (error) {
            console.error('Respond to suggestion error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to respond to suggestion'
            });
        }
    },

    // ==================== ACTIVITY LOGS ====================

    // Get activity logs for family
    async getActivityLogs(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;
            const { limit = 50, offset = 0, type } = req.query;

            // Verify user is a member of the family
            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this family'
                });
            }

            const pool = getPool();
            let query = 'SELECT * FROM family_activity_logs WHERE family_id = ?';
            const params = [familyId];

            if (type) {
                query += ' AND activity_type = ?';
                params.push(type);
            }

            query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [logs] = await pool.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM family_activity_logs WHERE family_id = ?';
            const countParams = [familyId];
            if (type) {
                countQuery += ' AND activity_type = ?';
                countParams.push(type);
            }
            const [countResult] = await pool.query(countQuery, countParams);

            res.status(200).json({
                success: true,
                logs,
                total: countResult[0].total
            });
        } catch (error) {
            console.error('Get activity logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get activity logs'
            });
        }
    },

    // Manually create an activity log
    async createActivityLog(req, res) {
        try {
            const { familyId } = req.params;
            const { activityType, title, description, startedAt, endedAt, placeId, metadata } = req.body;
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
            if (!activityType || !title) {
                return res.status(400).json({
                    success: false,
                    message: 'Activity type and title are required'
                });
            }

            const pool = getPool();
            const logId = uuidv4();
            const now = new Date();

            await pool.query(
                `INSERT INTO family_activity_logs 
                (id, family_id, user_id, activity_type, title, description, started_at, ended_at, place_id, metadata) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    logId,
                    familyId,
                    userId,
                    activityType,
                    title,
                    description || null,
                    startedAt || now,
                    endedAt || null,
                    placeId || null,
                    JSON.stringify(metadata || {})
                ]
            );

            // Log audit
            await contextEngine.logAuditAction(
                userId,
                familyId,
                'activity_log_created',
                'activity_log',
                logId,
                { activityType, title }
            );

            res.status(201).json({
                success: true,
                message: 'Activity log created successfully',
                logId
            });
        } catch (error) {
            console.error('Create activity log error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create activity log'
            });
        }
    }
};

module.exports = eventController;

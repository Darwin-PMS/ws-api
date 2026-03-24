// Context Engine - Rules-based context detection and suggestion generation

const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const familyPlaceModel = require('../models/familyPlaceModel');
const userModel = require('../models/userModel');

// Context type definitions with their rules
const CONTEXT_RULES = {
    school_pickup: {
        placeTypes: ['school', 'daycare'],
        timeWindowStart: '14:00',
        timeWindowEnd: '18:00',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        defaultTitle: 'School Pickup',
        defaultBodyTemplate: 'You seem to be at {placeName} during pickup time. Would you like to log this activity?'
    },
    school_dropoff: {
        placeTypes: ['school', 'daycare'],
        timeWindowStart: '07:00',
        timeWindowEnd: '09:00',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        defaultTitle: 'School Drop-off',
        defaultBodyTemplate: 'You seem to be at {placeName} during drop-off time. Would you like to log this activity?'
    },
    doctor_visit: {
        placeTypes: ['clinic', 'hospital'],
        timeWindowStart: '00:00',
        timeWindowEnd: '23:59',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        defaultTitle: 'Doctor Visit',
        defaultBodyTemplate: 'You seem to be at a medical facility. Would you like to log this visit?'
    },
    park_visit: {
        placeTypes: ['park'],
        timeWindowStart: '00:00',
        timeWindowEnd: '23:59',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        defaultTitle: 'Park Visit',
        defaultBodyTemplate: 'You seem to be at {placeName}. Would you like to log this outing?'
    },
    sports_practice: {
        placeTypes: ['sports'],
        timeWindowStart: '14:00',
        timeWindowEnd: '21:00',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        defaultTitle: 'Sports Practice',
        defaultBodyTemplate: 'You seem to be at a sports venue. Would you like to log the practice?'
    },
    relative_visit: {
        placeTypes: ['relative_home'],
        timeWindowStart: '00:00',
        timeWindowEnd: '23:59',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        defaultTitle: 'Visiting Relative',
        defaultBodyTemplate: 'You seem to be visiting {placeName}. Would you like to log this visit?'
    },
    home_arrival: {
        placeTypes: ['home'],
        timeWindowStart: '00:00',
        timeWindowEnd: '23:59',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        defaultTitle: 'Home Arrival',
        defaultBodyTemplate: 'Welcome home! Would you like to log your arrival?'
    }
};

// Time window helper functions
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function getTimeInMinutes(date) {
    return date.getHours() * 60 + date.getMinutes();
}

function getDayOfWeek(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

// Check if current time is within a time window
function isWithinTimeWindow(timeStr, startStr, endStr) {
    const current = parseTime(timeStr);
    const start = parseTime(startStr);
    const end = parseTime(endStr);

    if (start <= end) {
        return current >= start && current <= end;
    } else {
        // Handle overnight windows
        return current >= start || current <= end;
    }
}

const contextEngine = {
    // ==================== CONTEXT DETECTION ====================

    // Analyze a location event and determine the context
    async analyzeLocationEvent(userId, familyId, event) {
        const pool = getPool();

        const { latitude, longitude, activityType, timestamp } = event;
        const eventTime = timestamp ? new Date(timestamp) : new Date();
        const timeStr = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;
        const dayOfWeek = getDayOfWeek(eventTime);

        // Find the nearest place
        const nearestPlace = await familyPlaceModel.findNearestPlace(
            familyId,
            parseFloat(latitude),
            parseFloat(longitude)
        );

        // If no place found or place has do_not_log tag, skip
        if (!nearestPlace || nearestPlace.distance > nearestPlace.radius_meters) {
            return null;
        }

        if (nearestPlace.privacy_tag === 'do_not_log') {
            return null;
        }

        // Find matching context types based on rules
        const matchingContexts = [];

        for (const [contextType, rules] of Object.entries(CONTEXT_RULES)) {
            // Check if place type matches
            if (!rules.placeTypes.includes(nearestPlace.place_type)) {
                continue;
            }

            // Check if day matches
            if (!rules.daysOfWeek.includes(dayOfWeek)) {
                continue;
            }

            // Check if time window matches
            if (!isWithinTimeWindow(timeStr, rules.timeWindowStart, rules.timeWindowEnd)) {
                continue;
            }

            // Context matches - calculate confidence
            const confidence = this.calculateConfidence(nearestPlace, eventTime, activityType);

            matchingContexts.push({
                type: contextType,
                confidence,
                rules,
                place: nearestPlace
            });
        }

        // If no matching contexts, return null
        if (matchingContexts.length === 0) {
            return null;
        }

        // Sort by confidence and return the best match
        matchingContexts.sort((a, b) => b.confidence - a.confidence);
        const bestMatch = matchingContexts[0];

        // Create context snapshot in database
        const contextId = uuidv4();
        await pool.query(
            `INSERT INTO context_snapshots 
            (id, user_id, family_id, place_id, place_type, timestamp, activity_type, candidate_context_types, confidence) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                contextId,
                userId,
                familyId,
                nearestPlace.id,
                nearestPlace.place_type,
                eventTime,
                activityType || 'dwell',
                JSON.stringify(matchingContexts.map(c => c.type)),
                bestMatch.confidence
            ]
        );

        return {
            id: contextId,
            place: nearestPlace,
            contextType: bestMatch.type,
            confidence: bestMatch.confidence,
            rules: bestMatch.rules,
            timestamp: eventTime
        };
    },

    // Calculate confidence score for a context match
    calculateConfidence(place, eventTime, activityType) {
        let confidence = 0.5; // Base confidence

        // Higher confidence if activity type matches expected behavior
        if (activityType) {
            if (activityType === 'arriving') {
                confidence += 0.2;
            } else if (activityType === 'dwell') {
                confidence += 0.1;
            }
        }

        // Higher confidence for exact time matches (within 30 min of window)
        const timeStr = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;
        // This is a simplified check - could be enhanced

        return Math.min(confidence, 0.95);
    },

    // ==================== SUGGESTION GENERATION ====================

    // Generate a suggestion based on detected context
    async generateSuggestion(userId, familyId, context) {
        const pool = getPool();

        if (!context || context.confidence < 0.5) {
            return null;
        }

        const { contextType, rules, place, id: contextId } = context;

        // Generate title and body from template
        const title = rules.defaultTitle;
        const body = rules.defaultBodyTemplate.replace('{placeName}', place.name);

        // Create suggestion in database
        const suggestionId = uuidv4();
        await pool.query(
            `INSERT INTO suggestions 
            (id, user_id, family_id, context_id, type, title, body, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                suggestionId,
                userId,
                familyId,
                contextId,
                'log_activity',
                title,
                body,
                'pending'
            ]
        );

        return {
            id: suggestionId,
            contextId,
            type: 'log_activity',
            title,
            body,
            place: {
                id: place.id,
                name: place.name,
                type: place.place_type
            }
        };
    },

    // ==================== LOCATION EVENT PROCESSING ====================

    // Process a location event and potentially generate suggestions
    async processLocationEvent(userId, familyId, event) {
        // Check consent settings
        const consentSettings = await this.getConsentSettings(userId);

        if (!consentSettings || !consentSettings.location_enabled || !consentSettings.family_agent_enabled) {
            return { processed: false, reason: 'consent_not_granted' };
        }

        // Check quiet hours
        if (this.isInQuietHours(consentSettings)) {
            return { processed: false, reason: 'quiet_hours' };
        }

        // Analyze the event
        const context = await this.analyzeLocationEvent(userId, familyId, event);

        if (!context) {
            return { processed: false, reason: 'no_context_match' };
        }

        // Generate suggestion if confidence is high enough
        const suggestion = await this.generateSuggestion(userId, familyId, context);

        if (suggestion) {
            return {
                processed: true,
                context,
                suggestion
            };
        }

        return { processed: false, reason: 'low_confidence' };
    },

    // ==================== CONSENT & SETTINGS ====================

    // Get user consent settings
    async getConsentSettings(userId) {
        const pool = getPool();
        const [settings] = await pool.query(
            'SELECT * FROM consent_settings WHERE user_id = ?',
            [userId]
        );
        return settings[0] || null;
    },

    // Check if current time is in quiet hours
    isInQuietHours(consentSettings) {
        if (!consentSettings.quiet_hours_start || !consentSettings.quiet_hours_end) {
            return false;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = this.timeToMinutes(consentSettings.quiet_hours_start);
        const endMinutes = this.timeToMinutes(consentSettings.quiet_hours_end);

        if (startMinutes <= endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        } else {
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }
    },

    // Convert time string to minutes
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },

    // ==================== AUDIT LOGGING ====================

    // Log an action to audit log
    async logAuditAction(userId, familyId, action, targetType, targetId, metadata = {}) {
        const pool = getPool();
        const auditId = uuidv4();

        await pool.query(
            `INSERT INTO audit_logs 
            (id, user_id, family_id, action, target_type, target_id, metadata) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [auditId, userId, familyId, action, targetType, targetId, JSON.stringify(metadata)]
        );
    }
};

module.exports = contextEngine;

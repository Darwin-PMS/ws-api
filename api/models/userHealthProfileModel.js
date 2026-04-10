const { getPool } = require('../config/db');

// User Health Profile Model - handles health profile data
const userHealthProfileModel = {
    // Get user health profile
    async findByUserId(userId) {
        const pool = getPool();
        const [profiles] = await pool.query(
            'SELECT * FROM user_health_profiles WHERE user_id = ?',
            [userId]
        );
        return profiles[0] || null;
    },

    // Create or update user health profile
    async upsert(userId, profileData) {
        const pool = getPool();
        const {
            hasDiabetes, diabetesType, hasPCOS, pregnancyMode, pregnancyTrimester,
            thyroid, thyroidType, weightGoal, dailySugarLimitGrams,
            breastfeeding, childAgeRange, dietaryPreference, allergies
        } = profileData;

        // Check if profile exists
        const [existing] = await pool.query(
            'SELECT id FROM user_health_profiles WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            // Create new profile
            const [result] = await pool.query(
                `INSERT INTO user_health_profiles (
                    user_id, has_diabetes, diabetes_type, has_pcos, pregnancy_mode,
                    pregnancy_trimester, thyroid, thyroid_type, weight_goal,
                    daily_sugar_limit_grams, breastfeeding, child_age_range,
                    dietary_preference, allergies
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, hasDiabetes || false, diabetesType, hasPCOS || false,
                    pregnancyMode || false, pregnancyTrimester, thyroid || false,
                    thyroidType, weightGoal, dailySugarLimitGrams || 25,
                    breastfeeding || false, childAgeRange, dietaryPreference,
                    allergies ? JSON.stringify(allergies) : null
                ]
            );
            return result.insertId;
        } else {
            // Update existing profile
            const updates = [];
            const params = [];

            if (hasDiabetes !== undefined) {
                updates.push('has_diabetes = ?');
                params.push(hasDiabetes);
            }
            if (diabetesType !== undefined) {
                updates.push('diabetes_type = ?');
                params.push(diabetesType);
            }
            if (hasPCOS !== undefined) {
                updates.push('has_pcos = ?');
                params.push(hasPCOS);
            }
            if (pregnancyMode !== undefined) {
                updates.push('pregnancy_mode = ?');
                params.push(pregnancyMode);
            }
            if (pregnancyTrimester !== undefined) {
                updates.push('pregnancy_trimester = ?');
                params.push(pregnancyTrimester);
            }
            if (thyroid !== undefined) {
                updates.push('thyroid = ?');
                params.push(thyroid);
            }
            if (thyroidType !== undefined) {
                updates.push('thyroid_type = ?');
                params.push(thyroidType);
            }
            if (weightGoal !== undefined) {
                updates.push('weight_goal = ?');
                params.push(weightGoal);
            }
            if (dailySugarLimitGrams !== undefined) {
                updates.push('daily_sugar_limit_grams = ?');
                params.push(dailySugarLimitGrams);
            }
            if (breastfeeding !== undefined) {
                updates.push('breastfeeding = ?');
                params.push(breastfeeding);
            }
            if (childAgeRange !== undefined) {
                updates.push('child_age_range = ?');
                params.push(childAgeRange);
            }
            if (dietaryPreference !== undefined) {
                updates.push('dietary_preference = ?');
                params.push(dietaryPreference);
            }
            if (allergies !== undefined) {
                updates.push('allergies = ?');
                params.push(allergies ? JSON.stringify(allergies) : null);
            }

            if (updates.length === 0) return false;

            params.push(userId);
            await pool.query(
                `UPDATE user_health_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
                params
            );
            return true;
        }
    },

    // Get users with specific health condition
    async getUsersWithCondition(condition, value = true) {
        const pool = getPool();
        const allowedConditions = ['has_diabetes', 'has_pcos', 'pregnancy_mode', 'thyroid', 'breastfeeding'];
        
        if (!allowedConditions.includes(condition)) {
            throw new Error('Invalid condition');
        }

        const [users] = await pool.query(
            `SELECT user_id FROM user_health_profiles WHERE ${condition} = ?`,
            [value]
        );
        return users.map(u => u.user_id);
    },

    // Get health alerts for user
    async getHealthAlerts(userId) {
        const pool = getPool();
        const [profile] = await pool.query(
            'SELECT * FROM user_health_profiles WHERE user_id = ?',
            [userId]
        );

        if (profile.length === 0) {
            return {
                alerts: [],
                dailySugarLimit: 25, // Default WHO recommendation
                profile: null
            };
        }

        const userProfile = profile[0];
        const alerts = [];

        if (userProfile.has_diabetes) {
            alerts.push({
                type: 'diabetes',
                severity: 'high',
                message: userProfile.diabetes_type === 'gestational' 
                    ? '🚨 High sugar not recommended during gestational diabetes'
                    : '⚠️ Monitor sugar intake carefully - Diabetes detected'
            });
        }

        if (userProfile.has_pcos) {
            alerts.push({
                type: 'pcos',
                severity: 'medium',
                message: '⚠️ High sugar can worsen PCOS symptoms. Choose low-sugar options.'
            });
        }

        if (userProfile.pregnancy_mode) {
            alerts.push({
                type: 'pregnancy',
                severity: 'high',
                message: '🤰 Pregnancy mode: Avoid high sugar and caffeine products',
                trimester: userProfile.pregnancy_trimester
            });
        }

        if (userProfile.thyroid) {
            alerts.push({
                type: 'thyroid',
                severity: 'medium',
                message: '⚠️ Thyroid condition: Monitor sugar and caffeine intake'
            });
        }

        if (userProfile.breastfeeding) {
            alerts.push({
                type: 'breastfeeding',
                severity: 'low',
                message: '🍼 Breastfeeding: Limit caffeine and high sugar foods'
            });
        }

        return {
            alerts,
            dailySugarLimit: userProfile.daily_sugar_limit_grams || 25,
            profile: userProfile
        };
    }
};

module.exports = userHealthProfileModel;

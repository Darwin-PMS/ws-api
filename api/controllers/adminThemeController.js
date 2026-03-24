const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const adminThemeController = {
    async getAllThemes(req, res) {
        try {
            const pool = getPool();
            const { includeInactive } = req.query;

            let query = 'SELECT * FROM themes';
            if (!includeInactive || includeInactive !== 'true') {
                query += ' WHERE is_active = true';
            }
            query += ' ORDER BY is_default DESC, name ASC';

            const [themes] = await pool.query(query);

            const formattedThemes = themes.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                isDefault: t.is_default,
                isActive: t.is_active,
                mode: t.name.toLowerCase().includes('light') ? 'light' : 'dark',
                createdAt: t.created_at,
                updatedAt: t.updated_at,
            }));

            res.json({
                success: true,
                data: formattedThemes,
            });
        } catch (error) {
            console.error('Get all themes error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get themes',
            });
        }
    },

    async getThemeById(req, res) {
        try {
            const pool = getPool();
            const { themeId } = req.params;

            const [themes] = await pool.query(
                'SELECT * FROM themes WHERE id = ?',
                [themeId]
            );

            if (themes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Theme not found',
                });
            }

            const theme = {
                id: themes[0].id,
                name: themes[0].name,
                description: themes[0].description,
                isDefault: themes[0].is_default,
                isActive: themes[0].is_active,
                mode: themes[0].name.toLowerCase().includes('light') ? 'light' : 'dark',
                config: JSON.parse(themes[0].config),
            };

            res.json({
                success: true,
                data: theme,
            });
        } catch (error) {
            console.error('Get theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get theme',
            });
        }
    },

    async createTheme(req, res) {
        try {
            const pool = getPool();
            const { name, description, mode, config } = req.body;

            if (!name || !config) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and config are required',
                });
            }

            const themeId = uuidv4();
            const themeName = mode === 'light' ? `Light ${name}` : `Dark ${name}`;

            await pool.query(
                'INSERT INTO themes (id, name, description, is_default, config) VALUES (?, ?, ?, ?, ?)',
                [themeId, themeName, description || null, false, JSON.stringify(config)]
            );

            res.status(201).json({
                success: true,
                message: 'Theme created successfully',
                data: {
                    id: themeId,
                    name: themeName,
                    mode: mode || 'dark',
                },
            });
        } catch (error) {
            console.error('Create theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create theme',
            });
        }
    },

    async updateTheme(req, res) {
        try {
            const pool = getPool();
            const { themeId } = req.params;
            const { name, description, config, isDefault, isActive } = req.body;

            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            if (config !== undefined) {
                updates.push('config = ?');
                params.push(JSON.stringify(config));
            }
            if (isDefault !== undefined) {
                updates.push('is_default = ?');
                params.push(isDefault);
                if (isDefault) {
                    await pool.query('UPDATE themes SET is_default = false');
                }
            }
            if (isActive !== undefined) {
                updates.push('is_active = ?');
                params.push(isActive);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update',
                });
            }

            params.push(themeId);
            await pool.query(
                `UPDATE themes SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            res.json({
                success: true,
                message: 'Theme updated successfully',
            });
        } catch (error) {
            console.error('Update theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update theme',
            });
        }
    },

    async deleteTheme(req, res) {
        try {
            const pool = getPool();
            const { themeId } = req.params;

            // Check if it's the default theme
            const [theme] = await pool.query(
                'SELECT * FROM themes WHERE id = ?',
                [themeId]
            );

            if (theme.length > 0 && theme[0].is_default) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the default theme',
                });
            }

            await pool.query(
                'UPDATE themes SET is_active = false WHERE id = ?',
                [themeId]
            );

            res.json({
                success: true,
                message: 'Theme deleted successfully',
            });
        } catch (error) {
            console.error('Delete theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete theme',
            });
        }
    },

    async setDefaultTheme(req, res) {
        try {
            const pool = getPool();
            const { themeId } = req.params;

            // Unset all defaults
            await pool.query('UPDATE themes SET is_default = false');

            // Set new default
            await pool.query(
                'UPDATE themes SET is_default = true WHERE id = ?',
                [themeId]
            );

            res.json({
                success: true,
                message: 'Default theme updated',
            });
        } catch (error) {
            console.error('Set default theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to set default theme',
            });
        }
    },

    async getUserThemePreferences(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.query;

            let query = `
                SELECT ut.*, t.name as theme_name, t.id as theme_id
                FROM user_themes ut
                JOIN themes t ON ut.theme_id = t.id
                WHERE ut.is_active = true
            `;
            const params = [];

            if (userId) {
                query += ' AND ut.user_id = ?';
                params.push(userId);
            }

            const [preferences] = await pool.query(query, params);

            const formatted = preferences.map(p => ({
                userId: p.user_id,
                themeId: p.theme_id,
                themeName: p.theme_name,
                mode: p.theme_name.toLowerCase().includes('light') ? 'light' : 'dark',
                assignedAt: p.created_at,
            }));

            res.json({
                success: true,
                data: formatted,
            });
        } catch (error) {
            console.error('Get user theme preferences error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user theme preferences',
            });
        }
    },

    async setUserThemePreference(req, res) {
        try {
            const pool = getPool();
            const { userId, themeId, mode } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
            }

            // Deactivate current assignments
            await pool.query(
                'UPDATE user_themes SET is_active = false WHERE user_id = ?',
                [userId]
            );

            let targetThemeId = themeId;

            if (!targetThemeId && mode) {
                // Find theme by mode
                const themeName = mode === 'light' ? 'Light Default' : 'Dark Default';
                const [themes] = await pool.query(
                    'SELECT id FROM themes WHERE name LIKE ? AND is_active = true LIMIT 1',
                    [`%${mode}%`]
                );
                if (themes.length > 0) {
                    targetThemeId = themes[0].id;
                }
            }

            if (targetThemeId) {
                const assignmentId = uuidv4();
                await pool.query(
                    'INSERT INTO user_themes (id, user_id, theme_id, is_active) VALUES (?, ?, ?, true)',
                    [assignmentId, userId, targetThemeId]
                );
            }

            res.json({
                success: true,
                message: 'User theme preference updated',
            });
        } catch (error) {
            console.error('Set user theme preference error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to set user theme preference',
            });
        }
    },

    async getThemeStats(req, res) {
        try {
            const pool = getPool();

            // Count by mode
            const [modeStats] = await pool.query(`
                SELECT 
                    CASE 
                        WHEN LOWER(name) LIKE '%light%' THEN 'light'
                        ELSE 'dark'
                    END as mode,
                    COUNT(*) as count
                FROM themes
                WHERE is_active = true
                GROUP BY mode
            `);

            // Count users per theme
            const [userStats] = await pool.query(`
                SELECT t.name, COUNT(ut.user_id) as user_count
                FROM themes t
                LEFT JOIN user_themes ut ON t.id = ut.theme_id AND ut.is_active = true
                WHERE t.is_active = true
                GROUP BY t.id, t.name
                ORDER BY user_count DESC
            `);

            // Default theme
            const [defaultTheme] = await pool.query(
                'SELECT name FROM themes WHERE is_default = true AND is_active = true LIMIT 1'
            );

            res.json({
                success: true,
                data: {
                    byMode: modeStats,
                    byUsers: userStats,
                    defaultTheme: defaultTheme[0]?.name || 'None',
                },
            });
        } catch (error) {
            console.error('Get theme stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get theme stats',
            });
        }
    },
};

module.exports = adminThemeController;

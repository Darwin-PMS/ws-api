const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

// Default theme configurations
const defaultThemes = {
    dark: {
        colors: {
            primary: '#8B5CF6',
            primaryLight: '#A78BFA',
            primaryDark: '#7C3AED',
            secondary: '#EC4899',
            secondaryLight: '#F472B6',
            secondaryDark: '#DB2777',
            background: '#0F0F14',
            backgroundLight: '#1A1A24',
            backgroundLighter: '#252532',
            surface: '#1E1E2C',
            surfaceElevated: '#252532',
            glass: 'rgba(30, 30, 44, 0.7)',
            glassBorder: 'rgba(139, 92, 246, 0.2)',
            glassHighlight: 'rgba(139, 92, 246, 0.1)',
            text: '#FFFFFF',
            textSecondary: '#A1A1AA',
            textMuted: '#71717A',
            textAccent: '#C4B5FD',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            danger: '#EF4444',
            info: '#3B82F6',
            userBubble: '#7C3AED',
            aiBubble: '#1E1E2C',
            aiBubbleBorder: '#3F3F5A',
            card: '#1E1E2C',
            tabBarBackground: '#14141B',
            tabBarActive: '#8B5CF6',
            tabBarInactive: '#71717A',
            border: '#3F3F5A',
            borderLight: '#27273A',
            overlay: 'rgba(0, 0, 0, 0.6)',
        },
        typography: {
            fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
            fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 32, title: 28 },
            fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
            lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
        shadows: {
            sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
            md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
            lg: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
            glow: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
        },
    },
    light: {
        colors: {
            primary: '#8B5CF6',
            primaryLight: '#A78BFA',
            primaryDark: '#7C3AED',
            secondary: '#EC4899',
            secondaryLight: '#F472B6',
            secondaryDark: '#DB2777',
            background: '#F8FAFC',
            backgroundLight: '#F1F5F9',
            backgroundLighter: '#E2E8F0',
            surface: '#FFFFFF',
            surfaceElevated: '#FFFFFF',
            glass: 'rgba(255, 255, 255, 0.8)',
            glassBorder: 'rgba(139, 92, 246, 0.15)',
            glassHighlight: 'rgba(139, 92, 246, 0.05)',
            text: '#1E293B',
            textSecondary: '#64748B',
            textMuted: '#94A3B8',
            textAccent: '#7C3AED',
            success: '#059669',
            warning: '#D97706',
            error: '#DC2626',
            danger: '#DC2626',
            info: '#2563EB',
            userBubble: '#7C3AED',
            aiBubble: '#F1F5F9',
            aiBubbleBorder: '#E2E8F0',
            card: '#FFFFFF',
            tabBarBackground: '#FFFFFF',
            tabBarActive: '#8B5CF6',
            tabBarInactive: '#94A3B8',
            border: '#E2E8F0',
            borderLight: '#F1F5F9',
            overlay: 'rgba(0, 0, 0, 0.4)',
        },
        typography: {
            fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
            fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 32, title: 28 },
            fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
            lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
        shadows: {
            sm: { shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
            md: { shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
            lg: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
            glow: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
        },
    },
};

const themeController = {
    // Get current user's theme
    async getCurrentTheme(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            // Get user's assigned theme
            const [userThemes] = await pool.query(
                `SELECT t.* FROM themes t
                 JOIN user_themes ut ON t.id = ut.theme_id
                 WHERE ut.user_id = ? AND ut.is_active = true AND t.is_active = true`,
                [userId]
            );

            let theme;
            if (userThemes.length > 0) {
                theme = {
                    id: userThemes[0].id,
                    name: userThemes[0].name,
                    description: userThemes[0].description,
                    isDefault: userThemes[0].is_default,
                    ...JSON.parse(userThemes[0].config),
                };
            } else {
                // Return default dark theme
                const [defaultTheme] = await pool.query(
                    'SELECT * FROM themes WHERE is_default = true AND is_active = true LIMIT 1'
                );

                if (defaultTheme.length > 0) {
                    theme = {
                        id: defaultTheme[0].id,
                        name: defaultTheme[0].name,
                        description: defaultTheme[0].description,
                        isDefault: true,
                        ...JSON.parse(defaultTheme[0].config),
                    };
                } else {
                    // Fallback to hardcoded dark theme
                    theme = {
                        id: 'theme-dark-fallback',
                        name: 'Dark Default',
                        isDefault: true,
                        ...defaultThemes.dark,
                    };
                }
            }

            res.json({
                success: true,
                data: theme,
            });
        } catch (error) {
            console.error('Get current theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get theme',
            });
        }
    },

    // Get theme by ID
    async getThemeById(req, res) {
        try {
            const pool = getPool();
            const { themeId } = req.params;

            const [themes] = await pool.query(
                'SELECT * FROM themes WHERE id = ? AND is_active = true',
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
                ...JSON.parse(themes[0].config),
            };

            res.json({
                success: true,
                data: theme,
            });
        } catch (error) {
            console.error('Get theme by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get theme',
            });
        }
    },

    // Get all themes (admin)
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
                createdAt: t.created_at,
                updatedAt: t.updated_at,
                ...JSON.parse(t.config),
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

    // Create new theme (admin)
    async createTheme(req, res) {
        try {
            const pool = getPool();
            const { name, description, config, isDefault = false } = req.body;

            if (!name || !config) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and config are required',
                });
            }

            const themeId = uuidv4();

            // If setting as default, unset other defaults
            if (isDefault) {
                await pool.query('UPDATE themes SET is_default = false');
            }

            await pool.query(
                'INSERT INTO themes (id, name, description, is_default, config) VALUES (?, ?, ?, ?, ?)',
                [themeId, name, description || null, isDefault, JSON.stringify(config)]
            );

            res.status(201).json({
                success: true,
                message: 'Theme created successfully',
                data: {
                    id: themeId,
                    name,
                    description,
                    isDefault,
                    ...config,
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

    // Update theme (admin)
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

    // Delete theme (admin)
    async deleteTheme(req, res) {
        try {
            const pool = getPool();
            const { themeId } = req.params;

            // Soft delete
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

    // Assign theme to user (admin)
    async assignThemeToUser(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.params;
            const { themeId } = req.body;

            // Deactivate current theme assignment
            await pool.query(
                'UPDATE user_themes SET is_active = false WHERE user_id = ?',
                [userId]
            );

            // Create new assignment
            const assignmentId = uuidv4();
            await pool.query(
                'INSERT INTO user_themes (id, user_id, theme_id, is_active) VALUES (?, ?, ?, true)',
                [assignmentId, userId, themeId]
            );

            res.json({
                success: true,
                message: 'Theme assigned successfully',
            });
        } catch (error) {
            console.error('Assign theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign theme',
            });
        }
    },

    // Get user's theme assignment
    async getUserTheme(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.params;

            const [userThemes] = await pool.query(
                `SELECT t.* FROM themes t
                 JOIN user_themes ut ON t.id = ut.theme_id
                 WHERE ut.user_id = ? AND ut.is_active = true`,
                [userId]
            );

            if (userThemes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No theme assigned to user',
                });
            }

            const theme = {
                id: userThemes[0].id,
                name: userThemes[0].name,
                description: userThemes[0].description,
                ...JSON.parse(userThemes[0].config),
            };

            res.json({
                success: true,
                data: theme,
            });
        } catch (error) {
            console.error('Get user theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user theme',
            });
        }
    },

    // Simple theme mode preference (light/dark) - user can set directly
    async setThemePreference(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const { mode, themeId } = req.body;

            if (!mode && !themeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Either mode (light/dark) or themeId is required',
                });
            }

            // Deactivate current assignments
            await pool.query(
                'UPDATE user_themes SET is_active = false WHERE user_id = ?',
                [userId]
            );

            if (mode) {
                // Find theme by mode (light or dark)
                const themeName = mode === 'light' ? 'Light Default' : 'Dark Default';
                const [themes] = await pool.query(
                    'SELECT * FROM themes WHERE name LIKE ? AND is_active = true',
                    [`%${mode}%`]
                );

                if (themes.length > 0) {
                    const assignmentId = uuidv4();
                    await pool.query(
                        'INSERT INTO user_themes (id, user_id, theme_id, is_active) VALUES (?, ?, ?, true)',
                        [assignmentId, userId, themes[0].id]
                    );
                }
            }

            if (themeId) {
                const assignmentId = uuidv4();
                await pool.query(
                    'INSERT INTO user_themes (id, user_id, theme_id, is_active) VALUES (?, ?, ?, true)',
                    [assignmentId, userId, themeId]
                );
            }

            // Return the current theme
            const [userThemes] = await pool.query(
                `SELECT t.* FROM themes t
                 JOIN user_themes ut ON t.id = ut.theme_id
                 WHERE ut.user_id = ? AND ut.is_active = true AND t.is_active = true`,
                [userId]
            );

            let theme;
            if (userThemes.length > 0) {
                theme = {
                    id: userThemes[0].id,
                    name: userThemes[0].name,
                    mode: userThemes[0].name.toLowerCase().includes('light') ? 'light' : 'dark',
                    ...JSON.parse(userThemes[0].config),
                };
            } else {
                // Return default
                const [defaultTheme] = await pool.query(
                    'SELECT * FROM themes WHERE is_default = true AND is_active = true LIMIT 1'
                );
                if (defaultTheme.length > 0) {
                    theme = {
                        id: defaultTheme[0].id,
                        name: defaultTheme[0].name,
                        mode: defaultTheme[0].name.toLowerCase().includes('light') ? 'light' : 'dark',
                        ...JSON.parse(defaultTheme[0].config),
                    };
                }
            }

            res.json({
                success: true,
                message: 'Theme preference updated',
                data: theme,
            });
        } catch (error) {
            console.error('Set theme preference error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to set theme preference',
            });
        }
    },

    // Get user's theme preference (simple mode)
    async getThemePreference(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;

            const [userThemes] = await pool.query(
                `SELECT t.* FROM themes t
                 JOIN user_themes ut ON t.id = ut.theme_id
                 WHERE ut.user_id = ? AND ut.is_active = true AND t.is_active = true`,
                [userId]
            );

            if (userThemes.length > 0) {
                const theme = userThemes[0];
                const isLight = theme.name.toLowerCase().includes('light');
                return res.json({
                    success: true,
                    data: {
                        mode: isLight ? 'light' : 'dark',
                        themeId: theme.id,
                        themeName: theme.name,
                    },
                });
            }

            // Check default theme
            const [defaultTheme] = await pool.query(
                'SELECT * FROM themes WHERE is_default = true AND is_active = true LIMIT 1'
            );

            if (defaultTheme.length > 0) {
                const theme = defaultTheme[0];
                const isLight = theme.name.toLowerCase().includes('light');
                return res.json({
                    success: true,
                    data: {
                        mode: isLight ? 'light' : 'dark',
                        themeId: theme.id,
                        themeName: theme.name,
                        isDefault: true,
                    },
                });
            }

            res.json({
                success: true,
                data: {
                    mode: 'dark',
                    isDefault: true,
                },
            });
        } catch (error) {
            console.error('Get theme preference error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get theme preference',
            });
        }
    },

    // Initialize default themes (called on server startup)
    async initializeDefaultThemes() {
        try {
            const pool = getPool();

            // Check if themes exist
            const [existing] = await pool.query('SELECT COUNT(*) as count FROM themes');

            if (existing[0].count === 0) {
                console.log('Initializing default themes...');

                // Insert dark theme
                await pool.query(
                    `INSERT INTO themes (id, name, description, is_default, is_active, config) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        'theme-dark-default',
                        'Dark Default',
                        'Default dark theme with purple accents',
                        true,
                        true,
                        JSON.stringify(defaultThemes.dark),
                    ]
                );

                // Insert light theme
                await pool.query(
                    `INSERT INTO themes (id, name, description, is_default, is_active, config) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        'theme-light-default',
                        'Light Default',
                        'Default light theme',
                        false,
                        true,
                        JSON.stringify(defaultThemes.light),
                    ]
                );

                console.log('Default themes initialized');
            }
        } catch (error) {
            console.error('Initialize default themes error:', error);
        }
    },
};

module.exports = themeController;

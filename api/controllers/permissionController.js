const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

// Role hierarchy - higher roles inherit lower role permissions
const ROLE_HIERARCHY = {
    system_admin: ['system_admin', 'agency_admin', 'admin', 'supervisor', 'local_police', 'village_head', 'guardian', 'parent', 'woman', 'friend'],
    agency_admin: ['agency_admin', 'admin', 'supervisor', 'local_police', 'village_head', 'guardian', 'parent', 'woman', 'friend'],
    admin: ['admin', 'guardian', 'parent', 'woman', 'friend'],
    supervisor: ['supervisor', 'village_head', 'guardian', 'parent', 'woman', 'friend'],
    local_police: ['local_police', 'village_head', 'woman', 'friend'],
    village_head: ['village_head', 'guardian', 'parent', 'woman', 'friend'],
    guardian: ['guardian', 'parent', 'woman', 'friend'],
    parent: ['parent', 'woman', 'friend'],
    woman: ['woman', 'friend'],
    friend: ['friend'],
};

// Roles that can assign other roles
const ROLE_ASSIGNMENT_HIERARCHY = {
    system_admin: ['system_admin', 'agency_admin', 'admin', 'supervisor', 'local_police', 'village_head', 'guardian', 'parent', 'woman', 'friend'],
    agency_admin: ['agency_admin', 'admin', 'supervisor', 'local_police', 'village_head', 'guardian', 'parent', 'woman', 'friend'],
    admin: ['admin', 'guardian', 'parent', 'woman', 'friend'],
    supervisor: ['guardian', 'parent', 'woman', 'friend'],
    local_police: [],
    village_head: ['woman', 'friend'],
    guardian: ['woman', 'friend'],
    parent: ['woman', 'friend'],
    woman: [],
    friend: [],
};

// Roles that can manage areas
const AREA_MANAGER_ROLES = ['system_admin', 'agency_admin', 'admin', 'supervisor', 'village_head'];

// Roles that can view SOS cases in their area
const SOS_AREA_VIEWER_ROLES = ['system_admin', 'agency_admin', 'admin', 'supervisor', 'local_police', 'village_head'];

// Default permissions and flags by role
const DEFAULT_ROLE_CONFIG = {
    system_admin: {
        flags: {
            'sos.emergency': true,
            'sos.manage_all': true,
            'sos.assign': true,
            'ai.chat': true,
            'ai.vision': true,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': true,
            'home.automation': true,
            'advanced.models': true,
            'export.data': true,
            'admin.panel': true,
            'users.manage': true,
            'roles.manage': true,
            'areas.manage': true,
            'reports.view': true,
            'reports.export': true,
            'live.stream': true,
            'childcare.access': true,
            'behavior.monitor': true,
            'community.access': true,
            'grievance.access': true,
            'cylinder.verify': true,
        },
        permissions: {
            users: { read: true, write: true, delete: true, assign_roles: true },
            family: { read: true, write: true, delete: true },
            sos: { trigger: true, view_all: true, view_area: true, manage: true, assign: true, resolve: true },
            ai: { read: true, write: true, admin: true },
            settings: { read: true, write: true, admin: true },
            menus: { read: true, write: true },
            themes: { read: true, write: true },
            automation: { read: true, write: true, delete: true },
            areas: { read: true, write: true, delete: true },
            roles: { read: true, write: true },
            stream: { read: true, write: true },
        },
        uiRestrictions: {
            hiddenScreens: [],
            readOnlyFields: [],
            disabledFeatures: [],
        },
    },
    agency_admin: {
        flags: {
            'sos.emergency': true,
            'sos.manage_agency': true,
            'sos.assign': true,
            'ai.chat': true,
            'ai.vision': true,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': true,
            'home.automation': false,
            'advanced.models': false,
            'export.data': true,
            'admin.panel': true,
            'users.manage': true,
            'roles.manage': false,
            'areas.manage': true,
            'reports.view': true,
            'reports.export': true,
        },
        permissions: {
            users: { read: true, write: true, delete: false, assign_roles: false },
            family: { read: true, write: true, delete: false },
            sos: { trigger: true, view_all: true, view_area: true, manage: true, assign: true, resolve: true },
            ai: { read: true, write: true, admin: false },
            settings: { read: true, write: true },
            menus: { read: true, write: true },
            themes: { read: true, write: false },
            automation: { read: true, write: false },
            areas: { read: true, write: true },
            roles: { read: true, write: false },
        },
        uiRestrictions: {
            hiddenScreens: ['SystemSettings', 'RoleManagement'],
            readOnlyFields: ['user.role', 'system_settings'],
            disabledFeatures: [],
        },
    },
    local_police: {
        flags: {
            'sos.emergency': true,
            'sos.view_area': true,
            'sos.acknowledge': true,
            'sos.investigate': true,
            'sos.resolve': true,
            'ai.chat': false,
            'ai.vision': true,
            'ai.speech': false,
            'ai.tts': false,
            'family.tracking': false,
            'home.automation': false,
            'advanced.models': false,
            'export.data': true,
            'admin.panel': false,
            'users.manage': false,
            'roles.manage': false,
            'areas.manage': false,
            'reports.view': true,
            'reports.export': false,
        },
        permissions: {
            users: { read: true, write: false, delete: false },
            family: { read: false, write: false, delete: false },
            sos: { trigger: true, view_area: true, acknowledge: true, investigate: true, resolve: true, assign: false },
            ai: { read: false, write: false },
            settings: { read: true, write: false },
            menus: { read: true },
            areas: { read: true, write: false },
        },
        uiRestrictions: {
            hiddenScreens: ['AdminPanel', 'FamilyManagement', 'WomenSafety', 'HomeAutomation'],
            readOnlyFields: ['user.role'],
            disabledFeatures: ['ai_features', 'family_tracking'],
        },
    },
    village_head: {
        flags: {
            'sos.emergency': true,
            'sos.view_area': true,
            'sos.acknowledge': true,
            'ai.chat': true,
            'ai.vision': false,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': true,
            'home.automation': false,
            'advanced.models': false,
            'export.data': false,
            'admin.panel': false,
            'users.manage': false,
            'roles.manage': false,
            'areas.manage': false,
            'reports.view': true,
            'reports.export': false,
        },
        permissions: {
            users: { read: true, write: false, delete: false },
            family: { read: true, write: true, delete: false },
            sos: { trigger: true, view_area: true, acknowledge: true },
            ai: { read: true, write: false },
            settings: { read: true, write: false },
            menus: { read: true },
            areas: { read: true, write: false },
        },
        uiRestrictions: {
            hiddenScreens: ['AdminPanel', 'FamilyManagement', 'HomeAutomation'],
            readOnlyFields: ['user.role'],
            disabledFeatures: ['ai_vision', 'advanced_settings'],
        },
    },
    supervisor: {
        flags: {
            'sos.emergency': true,
            'sos.view_area': true,
            'sos.assign': true,
            'ai.chat': true,
            'ai.vision': true,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': true,
            'home.automation': false,
            'advanced.models': false,
            'export.data': true,
            'admin.panel': false,
            'users.manage': false,
            'roles.manage': false,
            'areas.manage': false,
            'reports.view': true,
            'reports.export': true,
        },
        permissions: {
            users: { read: true, write: false, delete: false },
            family: { read: true, write: true, delete: false },
            sos: { trigger: true, view_area: true, assign: true, acknowledge: true },
            ai: { read: true, write: false },
            settings: { read: true, write: false },
            menus: { read: true },
            areas: { read: true },
        },
        uiRestrictions: {
            hiddenScreens: ['AdminPanel', 'FamilyManagement', 'HomeAutomation'],
            readOnlyFields: ['user.role'],
            disabledFeatures: ['role_management', 'system_settings'],
        },
    },
    admin: {
        flags: {
            'sos.emergency': true,
            'ai.chat': true,
            'ai.vision': true,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': true,
            'home.automation': true,
            'advanced.models': true,
            'export.data': true,
            'admin.panel': true,
            'live.stream': true,
            'childcare.access': true,
            'behavior.monitor': true,
            'community.access': true,
            'grievance.access': true,
            'cylinder.verify': true,
        },
        permissions: {
            users: { read: true, write: true, delete: true },
            family: { read: true, write: true, delete: true },
            sos: { trigger: true, view_history: true, manage: true },
            ai: { read: true, write: true, admin: true },
            settings: { read: true, write: true, admin: true },
            menus: { read: true, write: true },
            themes: { read: true, write: true },
            automation: { read: true, write: true, delete: true },
        },
        uiRestrictions: {
            hiddenScreens: [],
            readOnlyFields: [],
            disabledFeatures: [],
        },
    },
    guardian: {
        flags: {
            'sos.emergency': true,
            'ai.chat': true,
            'ai.vision': true,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': true,
            'home.automation': true,
            'advanced.models': false,
            'export.data': true,
            'live.stream': true,
            'childcare.access': true,
            'behavior.monitor': true,
            'community.access': true,
            'grievance.access': true,
            'cylinder.verify': true,
        },
        permissions: {
            users: { read: true, write: false, delete: false },
            family: { read: true, write: true, delete: false },
            sos: { trigger: true, view_history: true, manage: false },
            ai: { read: true, write: true, admin: false },
            settings: { read: true, write: true },
            menus: { read: true, write: false },
            automation: { read: true, write: true },
            stream: { read: true, write: true },
        },
        uiRestrictions: {
            hiddenScreens: ['AdminPanel'],
            readOnlyFields: ['user.role'],
            disabledFeatures: ['bulk-export'],
        },
    },
    parent: {
        flags: {
            'sos.emergency': true,
            'ai.chat': true,
            'ai.vision': true,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': true,
            'home.automation': false,
            'advanced.models': false,
            'export.data': false,
            'live.stream': true,
            'childcare.access': true,
            'behavior.monitor': true,
            'grievance.access': true,
            'cylinder.verify': true,
        },
        permissions: {
            users: { read: true, write: false, delete: false },
            family: { read: true, write: true, delete: false },
            sos: { trigger: true, view_history: true },
            ai: { read: true, write: true },
            settings: { read: true, write: true },
            menus: { read: true },
            automation: { read: false, write: false },
            stream: { read: true, write: true },
        },
        uiRestrictions: {
            hiddenScreens: ['AdminPanel', 'HomeAutomation'],
            readOnlyFields: ['user.role', 'family.settings'],
            disabledFeatures: ['advanced-settings'],
        },
    },
    woman: {
        flags: {
            'sos.emergency': true,
            'ai.chat': true,
            'ai.vision': true,
            'ai.speech': true,
            'ai.tts': true,
            'family.tracking': false,
            'home.automation': false,
            'advanced.models': false,
            'export.data': false,
            'live.stream': true,
            'grievance.access': true,
            'cylinder.verify': true,
        },
        permissions: {
            users: { read: true, write: false, delete: false },
            family: { read: false, write: false, delete: false },
            sos: { trigger: true, view_history: false },
            ai: { read: true, write: true },
            settings: { read: true, write: true },
            menus: { read: true },
            stream: { read: true, write: true },
        },
        uiRestrictions: {
            hiddenScreens: ['AdminPanel', 'HomeAutomation', 'FamilyManagement'],
            readOnlyFields: ['user.role'],
            disabledFeatures: ['family-tracking', 'advanced-settings'],
        },
    },
    friend: {
        flags: {
            'sos.emergency': false,
            'ai.chat': true,
            'ai.vision': false,
            'ai.speech': false,
            'ai.tts': false,
            'family.tracking': false,
            'home.automation': false,
            'advanced.models': false,
            'export.data': false,
        },
        permissions: {
            users: { read: true, write: false, delete: false },
            family: { read: false, write: false, delete: false },
            sos: { trigger: false, view_history: false },
            ai: { read: true, write: false },
            settings: { read: true, write: false },
            menus: { read: true },
        },
        uiRestrictions: {
            hiddenScreens: ['AdminPanel', 'HomeAutomation', 'FamilyManagement', 'WomenSafety'],
            readOnlyFields: ['user.role', 'user.settings'],
            disabledFeatures: ['sos', 'family', 'advanced-ai'],
        },
    },
};

const permissionController = {
    // Get current user's permissions
    async getCurrentPermissions(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;

            // Get or create user permissions
            let permissions = await permissionController.getOrCreateUserPermissions(userId, userRole);

            // Get all roles for user (based on hierarchy)
            const inheritedRoles = ROLE_HIERARCHY[userRole] || [userRole];

            res.json({
                success: true,
                data: {
                    userId,
                    role: userRole,
                    roles: inheritedRoles,
                    flags: JSON.parse(permissions.flags || '{}'),
                    permissions: JSON.parse(permissions.permissions || '{}'),
                    uiRestrictions: JSON.parse(permissions.ui_restrictions || '{}'),
                    expiresAt: permissions.expires_at,
                    updatedAt: permissions.updated_at,
                },
            });
        } catch (error) {
            console.error('Get current permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get permissions',
            });
        }
    },

    // Get all available roles
    async getAllRoles(req, res) {
        try {
            const roles = Object.keys(ROLE_HIERARCHY).map(role => ({
                id: role,
                name: role.charAt(0).toUpperCase() + role.slice(1),
                inheritedRoles: ROLE_HIERARCHY[role],
                description: permissionController.getRoleDescription(role),
            }));

            res.json({
                success: true,
                data: roles,
            });
        } catch (error) {
            console.error('Get all roles error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get roles',
            });
        }
    },

    // Check specific permissions (batch check)
    async checkPermissions(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;
            const { checks } = req.body; // Array of { type: 'flag'|'permission', key: string }

            if (!Array.isArray(checks)) {
                return res.status(400).json({
                    success: false,
                    message: 'checks array is required',
                });
            }

            // Get user permissions
            let permissions = await permissionController.getOrCreateUserPermissions(userId, userRole);
            const flags = JSON.parse(permissions.flags || '{}');
            const perms = JSON.parse(permissions.permissions || '{}');

            const results = checks.map(check => {
                if (check.type === 'flag') {
                    return {
                        key: check.key,
                        granted: !!flags[check.key],
                    };
                } else if (check.type === 'permission') {
                    const [resource, action] = check.key.split(':');
                    return {
                        key: check.key,
                        granted: !!(perms[resource] && perms[resource][action]),
                    };
                }
                return { key: check.key, granted: false };
            });

            res.json({
                success: true,
                data: {
                    results,
                    allGranted: results.every(r => r.granted),
                },
            });
        } catch (error) {
            console.error('Check permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check permissions',
            });
        }
    },

    // Get permissions for a specific user (admin only)
    async getUserPermissions(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.params;

            // Get user info
            const [users] = await pool.query(
                'SELECT id, first_name, last_name, email, role FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const user = users[0];
            const permissions = await permissionController.getOrCreateUserPermissions(userId, user.role);
            const inheritedRoles = ROLE_HIERARCHY[user.role] || [user.role];

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        role: user.role,
                    },
                    role: user.role,
                    roles: inheritedRoles,
                    flags: JSON.parse(permissions.flags || '{}'),
                    permissions: JSON.parse(permissions.permissions || '{}'),
                    uiRestrictions: JSON.parse(permissions.ui_restrictions || '{}'),
                    expiresAt: permissions.expires_at,
                    updatedAt: permissions.updated_at,
                },
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user permissions',
            });
        }
    },

    // Update user permissions (admin only)
    async updateUserPermissions(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.params;
            const { flags, permissions: newPerms, uiRestrictions, expiresAt } = req.body;

            // Check if user exists
            const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const userRole = users[0].role;

            // Get existing permissions or create new
            let existingPerms = await permissionController.getOrCreateUserPermissions(userId, userRole);

            // Merge updates
            const updatedFlags = flags !== undefined
                ? { ...JSON.parse(existingPerms.flags || '{}'), ...flags }
                : JSON.parse(existingPerms.flags || '{}');

            const updatedPerms = newPerms !== undefined
                ? permissionController.mergePermissions(JSON.parse(existingPerms.permissions || '{}'), newPerms)
                : JSON.parse(existingPerms.permissions || '{}');

            const updatedRestrictions = uiRestrictions !== undefined
                ? { ...JSON.parse(existingPerms.ui_restrictions || '{}'), ...uiRestrictions }
                : JSON.parse(existingPerms.ui_restrictions || '{}');

            // Update database
            await pool.query(
                `UPDATE permissions 
                 SET flags = ?, permissions = ?, ui_restrictions = ?, expires_at = ?, updated_at = NOW()
                 WHERE user_id = ?`,
                [
                    JSON.stringify(updatedFlags),
                    JSON.stringify(updatedPerms),
                    JSON.stringify(updatedRestrictions),
                    expiresAt || null,
                    userId,
                ]
            );

            res.json({
                success: true,
                message: 'Permissions updated successfully',
            });
        } catch (error) {
            console.error('Update user permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update permissions',
            });
        }
    },

    // Get role permission template
    async getRoleTemplate(req, res) {
        try {
            const { role } = req.params;

            if (!DEFAULT_ROLE_CONFIG[role]) {
                return res.status(404).json({
                    success: false,
                    message: 'Role template not found',
                });
            }

            res.json({
                success: true,
                data: {
                    role,
                    ...DEFAULT_ROLE_CONFIG[role],
                },
            });
        } catch (error) {
            console.error('Get role template error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get role template',
            });
        }
    },

    // Helper: Get or create user permissions
    async getOrCreateUserPermissions(userId, role) {
        const pool = getPool();

        // Try to get existing permissions
        const [existing] = await pool.query(
            'SELECT * FROM permissions WHERE user_id = ?',
            [userId]
        );

        if (existing.length > 0) {
            // Check if expired
            if (existing[0].expires_at && new Date(existing[0].expires_at) < new Date()) {
                // Reset to role defaults
                return permissionController.resetToRoleDefaults(userId, role);
            }
            return existing[0];
        }

        // Create new permissions from role defaults
        return permissionController.resetToRoleDefaults(userId, role);
    },

    // Helper: Reset user permissions to role defaults
    async resetToRoleDefaults(userId, role) {
        const pool = getPool();
        const defaults = DEFAULT_ROLE_CONFIG[role] || DEFAULT_ROLE_CONFIG.friend;

        const flags = JSON.stringify(defaults.flags);
        const permissions = JSON.stringify(defaults.permissions);
        const uiRestrictions = JSON.stringify(defaults.uiRestrictions);

        const [existing] = await pool.query(
            'SELECT id FROM permissions WHERE user_id = ?',
            [userId]
        );

        if (existing.length > 0) {
            await pool.query(
                `UPDATE permissions 
                 SET flags = ?, permissions = ?, ui_restrictions = ?, updated_at = NOW()
                 WHERE user_id = ?`,
                [flags, permissions, uiRestrictions, userId]
            );
        } else {
            const permId = uuidv4();
            await pool.query(
                `INSERT INTO permissions (id, user_id, flags, permissions, ui_restrictions)
                 VALUES (?, ?, ?, ?, ?)`,
                [permId, userId, flags, permissions, uiRestrictions]
            );
        }

        return {
            flags,
            permissions,
            ui_restrictions: uiRestrictions,
            updated_at: new Date(),
        };
    },

    // Helper: Merge permission objects
    mergePermissions(existing, updates) {
        const merged = { ...existing };

        for (const [resource, actions] of Object.entries(updates)) {
            if (!merged[resource]) {
                merged[resource] = {};
            }
            merged[resource] = { ...merged[resource], ...actions };
        }

        return merged;
    },

    // Helper: Get role description
    getRoleDescription(role) {
        const descriptions = {
            system_admin: 'Super admin with full system control and role management',
            agency_admin: 'Agency-level admin for managing organization users and cases',
            admin: 'Full system access and management',
            supervisor: 'Supervisor for managing field workers and volunteers',
            local_police: 'Local police to view and manage SOS in their jurisdiction',
            village_head: 'Village/Ward head to oversee women in their area',
            guardian: 'Family management and safety oversight',
            parent: 'Child care and family management',
            woman: 'Women safety and personal AI assistance',
            friend: 'Basic AI chat and limited access',
        };
        return descriptions[role] || 'Standard user access';
    },

    // ==================== ROLE ASSIGNMENT ====================

    // Check if current user can assign a specific role
    canAssignRole(assignerRole, targetRole) {
        const allowedRoles = ROLE_ASSIGNMENT_HIERARCHY[assignerRole] || [];
        return allowedRoles.includes(targetRole);
    },

    // Assign role to user (admin/system_admin only)
    async assignRole(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.params;
            const { role, reason } = req.body;
            const assignerId = req.user.id;
            const assignerRole = req.user.role;

            // Validate role
            if (!role || !DEFAULT_ROLE_CONFIG[role]) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role specified',
                });
            }

            // Check if assigner can assign this role
            if (!permissionController.canAssignRole(assignerRole, role)) {
                return res.status(403).json({
                    success: false,
                    message: `You don't have permission to assign '${role}' role`,
                });
            }

            // Get current user role
            const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            const previousRole = users[0].role;

            // Prevent role escalation
            if (!permissionController.canAssignRole(assignerRole, previousRole) && previousRole !== role) {
                return res.status(403).json({
                    success: false,
                    message: `You cannot change role from '${previousRole}'`,
                });
            }

            // Update user role
            await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

            // Log role change
            await pool.query(
                `INSERT INTO role_assignment_history (id, user_id, previous_role, new_role, assigned_by, reason)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), userId, previousRole, role, assignerId, reason || 'Role assigned by admin']
            );

            // Reset user permissions to new role defaults
            await permissionController.resetToRoleDefaults(userId, role);

            res.json({
                success: true,
                message: `Role '${role}' assigned successfully`,
                data: {
                    userId,
                    previousRole,
                    newRole: role,
                },
            });
        } catch (error) {
            console.error('Assign role error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign role',
            });
        }
    },

    // ==================== AREA MANAGEMENT ====================

    // Get user areas
    async getUserAreas(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.params;

            const [assignments] = await pool.query(
                `SELECT ua.*, ga.name as area_name, ga.type as area_type, ga.code as area_code
                 FROM user_area_assignments ua
                 JOIN geographic_areas ga ON ua.area_id = ga.id
                 WHERE ua.user_id = ? AND ua.is_active = TRUE`,
                [userId]
            );

            res.json({
                success: true,
                data: assignments,
            });
        } catch (error) {
            console.error('Get user areas error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user areas',
            });
        }
    },

    // Assign area to user
    async assignArea(req, res) {
        try {
            const pool = getPool();
            const { userId } = req.params;
            const { areaId, roleInArea, isPrimary } = req.body;
            const assignerId = req.user.id;

            // Check if area exists
            const [areas] = await pool.query('SELECT id, name FROM geographic_areas WHERE id = ?', [areaId]);
            if (areas.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Area not found',
                });
            }

            // Check if already assigned
            const [existing] = await pool.query(
                'SELECT id FROM user_area_assignments WHERE user_id = ? AND area_id = ?',
                [userId, areaId]
            );

            if (existing.length > 0) {
                // Update existing
                await pool.query(
                    `UPDATE user_area_assignments 
                     SET role_in_area = ?, is_primary = ?, assigned_by = ?, assigned_at = NOW()
                     WHERE user_id = ? AND area_id = ?`,
                    [roleInArea || 'member', isPrimary || false, assignerId, userId, areaId]
                );
            } else {
                // Insert new
                await pool.query(
                    `INSERT INTO user_area_assignments (id, user_id, area_id, role_in_area, is_primary, assigned_by)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), userId, areaId, roleInArea || 'member', isPrimary || false, assignerId]
                );
            }

            res.json({
                success: true,
                message: `Area '${areas[0].name}' assigned successfully`,
            });
        } catch (error) {
            console.error('Assign area error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign area',
            });
        }
    },

    // Get all areas (for admin)
    async getAllAreas(req, res) {
        try {
            const pool = getPool();
            const { type, parentId } = req.query;

            let query = 'SELECT * FROM geographic_areas WHERE is_active = TRUE';
            const params = [];

            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }
            if (parentId) {
                query += ' AND parent_area_id = ?';
                params.push(parentId);
            }

            query += ' ORDER BY type, name';

            const [areas] = await pool.query(query, params);

            res.json({
                success: true,
                data: areas,
            });
        } catch (error) {
            console.error('Get all areas error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get areas',
            });
        }
    },

    // ==================== SOS CASE MANAGEMENT ====================

    // Get SOS cases (filtered by user role and area)
    async getSOSCases(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;
            const { status, areaId, limit = 50, offset = 0 } = req.query;

            let query = `
                SELECT sc.*, 
                       u.first_name as victim_first_name, u.last_name as victim_last_name,
                       ga.name as area_name
                FROM sos_cases sc
                LEFT JOIN users u ON sc.victim_user_id = u.id
                LEFT JOIN geographic_areas ga ON sc.area_id = ga.id
                WHERE 1=1
            `;
            const params = [];

            // Filter based on role
            if (!['system_admin', 'agency_admin'].includes(userRole)) {
                // Get user's areas
                const [userAreas] = await pool.query(
                    'SELECT area_id FROM user_area_assignments WHERE user_id = ? AND is_active = TRUE',
                    [userId]
                );
                const areaIds = userAreas.map(ua => ua.area_id);

                if (areaIds.length > 0) {
                    query += ` AND (sc.area_id IN (${areaIds.map(() => '?').join(',')}) OR sc.assigned_to = ?)`;
                    params.push(...areaIds, userId);
                } else if (!['admin', 'supervisor'].includes(userRole)) {
                    // Can only see own cases
                    query += ' AND sc.victim_user_id = ?';
                    params.push(userId);
                }
            }

            if (status) {
                query += ' AND sc.status = ?';
                params.push(status);
            }

            if (areaId) {
                query += ' AND sc.area_id = ?';
                params.push(areaId);
            }

            query += ' ORDER BY sc.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [cases] = await pool.query(query, params);

            res.json({
                success: true,
                data: cases,
            });
        } catch (error) {
            console.error('Get SOS cases error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get SOS cases',
            });
        }
    },

    // Update SOS case status
    async updateSOSCase(req, res) {
        try {
            const pool = getPool();
            const { caseId } = req.params;
            const { status, priority, assignedTo, resolutionNotes } = req.body;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Check permission
            const canManage = ['system_admin', 'agency_admin', 'admin', 'supervisor', 'local_police'].includes(userRole);
            if (!canManage) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to manage SOS cases',
                });
            }

            // Build update query
            const updates = [];
            const params = [];

            if (status) {
                updates.push('status = ?');
                params.push(status);
                if (status === 'resolved' || status === 'closed') {
                    updates.push('resolved_at = NOW()');
                    updates.push('resolved_by = ?');
                    params.push(userId);
                }
            }
            if (priority) {
                updates.push('priority = ?');
                params.push(priority);
            }
            if (assignedTo !== undefined) {
                updates.push('assigned_to = ?');
                params.push(assignedTo);
                if (assignedTo) {
                    updates.push('assigned_at = NOW()');
                }
            }
            if (resolutionNotes) {
                updates.push('resolution_notes = ?');
                params.push(resolutionNotes);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No updates specified',
                });
            }

            params.push(caseId);
            await pool.query(`UPDATE sos_cases SET ${updates.join(', ')} WHERE id = ?`, params);

            // Log activity
            await pool.query(
                `INSERT INTO sos_case_activity (id, case_id, user_id, action, description)
                 VALUES (?, ?, ?, ?, ?)`,
                [uuidv4(), caseId, userId, 'status_update', `Status updated to ${status}`]
            );

            res.json({
                success: true,
                message: 'SOS case updated successfully',
            });
        } catch (error) {
            console.error('Update SOS case error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update SOS case',
            });
        }
    },

    // Initialize default role permissions in database
    async initializeRolePermissions() {
        try {
            const pool = getPool();

            // Check if role_permissions table has entries
            const [existing] = await pool.query('SELECT COUNT(*) as count FROM role_permissions');

            if (existing[0].count === 0) {
                console.log('Initializing default role permissions...');

                for (const [role, config] of Object.entries(DEFAULT_ROLE_CONFIG)) {
                    await pool.query(
                        `INSERT INTO role_permissions (id, role, flags, base_permissions, ui_restrictions)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            uuidv4(),
                            role,
                            JSON.stringify(config.flags),
                            JSON.stringify(config.permissions),
                            JSON.stringify(config.uiRestrictions),
                        ]
                    );
                }

                console.log('Default role permissions initialized');
            }
        } catch (error) {
            console.error('Initialize role permissions error:', error);
        }
    },
};

module.exports = permissionController;

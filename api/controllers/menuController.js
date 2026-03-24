const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

// Default menu configurations based on roles
const defaultMenus = {
    primary: {
        name: 'Primary Navigation',
        type: 'primary',
        items: [
            {
                id: 'nav-home',
                label: 'Home',
                icon: 'home',
                route: 'Home',
                order: 1,
                isVisible: true,
                requiredRoles: ['woman', 'parent', 'guardian', 'admin', 'friend'],
            },
            {
                id: 'nav-notifications',
                label: 'Alerts',
                icon: 'notifications',
                route: 'Notifications',
                order: 2,
                isVisible: true,
                requiredRoles: ['woman', 'parent', 'guardian', 'admin'],
                badge: {
                    type: 'count',
                    source: '/api/notifications/unread-count',
                },
            },
            {
                id: 'nav-ai-chat',
                label: 'AI Chat',
                icon: 'chatbubbles',
                route: 'AIChat',
                order: 3,
                isVisible: true,
                requiredRoles: ['woman', 'parent', 'guardian', 'admin', 'friend'],
                requiredFlags: ['ai.chat'],
                requiredPermissions: ['ai:read'],
            },
            {
                id: 'nav-more',
                label: 'More',
                icon: 'menu',
                route: 'More',
                order: 4,
                isVisible: true,
                requiredRoles: ['woman', 'parent', 'guardian', 'admin', 'friend'],
            },
            {
                id: 'nav-profile',
                label: 'Profile',
                icon: 'person',
                route: 'Profile',
                order: 5,
                isVisible: true,
                requiredRoles: ['woman', 'parent', 'guardian', 'admin', 'friend'],
            },
        ],
    },
    secondary: {
        name: 'Core Services',
        type: 'secondary',
        items: [
            {
                id: 'svc-women-safety',
                label: 'Women Safety',
                subtitle: 'SOS, emergency contacts & safety tips',
                icon: 'shield-checkmark',
                color: '#EC4899',
                screen: 'WomenSafety',
                order: 1,
                isVisible: true,
                requiredRoles: ['woman', 'parent', 'guardian'],
                requiredFlags: ['sos.emergency'],
                category: 'safety',
            },
            {
                id: 'svc-child-care',
                label: 'Child Care',
                subtitle: 'Tips, guidance & assistant',
                icon: 'happy',
                color: '#10B981',
                screen: 'ChildCare',
                order: 2,
                isVisible: true,
                requiredRoles: ['parent', 'guardian'],
                category: 'family',
            },
            {
                id: 'svc-family',
                label: 'Family',
                subtitle: 'Manage family members & relationships',
                icon: 'people',
                color: '#EC4899',
                screen: 'Family',
                order: 3,
                isVisible: true,
                requiredRoles: ['parent', 'guardian', 'admin'],
                requiredFlags: ['family.tracking'],
                requiredPermissions: ['family:read'],
                category: 'family',
            },
            {
                id: 'svc-home-automation',
                label: 'Home Automation',
                subtitle: 'Control smart devices & appliances',
                icon: 'home',
                color: '#3B82F6',
                screen: 'HomeAutomation',
                order: 4,
                isVisible: true,
                requiredFlags: ['home.automation'],
                requiredPermissions: ['automation:read'],
                category: 'lifestyle',
            },
            {
                id: 'svc-cylinder',
                label: 'Cylinder Verification',
                subtitle: 'Verify gas cylinder validity & expiration',
                icon: 'flame',
                color: '#EF4444',
                screen: 'CylinderVerification',
                order: 5,
                isVisible: true,
                category: 'safety',
            },
            {
                id: 'svc-live-share',
                label: 'Live Safety Share',
                subtitle: 'Share live camera & screen with contacts',
                icon: 'videocam',
                color: '#EF4444',
                screen: 'LiveShare',
                order: 6,
                isVisible: true,
                requiredRoles: ['woman', 'parent', 'guardian'],
                requiredFlags: ['live.stream'],
                category: 'safety',
            },
            {
                id: 'svc-vision',
                label: 'Vision',
                subtitle: 'Image analysis with AI',
                icon: 'camera',
                color: '#8B5CF6',
                screen: 'Vision',
                order: 5,
                isVisible: true,
                requiredFlags: ['ai.vision'],
                requiredPermissions: ['ai:read'],
                category: 'ai',
            },
            {
                id: 'svc-speech',
                label: 'Speech to Text',
                subtitle: 'Transcribe audio with AI',
                icon: 'mic',
                color: '#10B981',
                screen: 'Speech',
                order: 6,
                isVisible: true,
                requiredFlags: ['ai.speech'],
                requiredPermissions: ['ai:read'],
                category: 'ai',
            },
            {
                id: 'svc-tts',
                label: 'Text to Speech',
                subtitle: 'Convert text to speech',
                icon: 'volume-high',
                color: '#F59E0B',
                screen: 'TTS',
                order: 7,
                isVisible: true,
                requiredFlags: ['ai.tts'],
                requiredPermissions: ['ai:read'],
                category: 'ai',
            },
            {
                id: 'svc-models',
                label: 'Model Browser',
                subtitle: 'Browse and select AI models',
                icon: 'server',
                color: '#8B5CF6',
                screen: 'ModelsList',
                order: 8,
                isVisible: true,
                requiredPermissions: ['ai:read'],
                category: 'ai',
            },
            {
                id: 'svc-settings',
                label: 'Settings',
                subtitle: 'API key, preferences & about',
                icon: 'settings',
                color: '#F59E0B',
                screen: 'Settings',
                order: 9,
                isVisible: true,
                requiredPermissions: ['settings:read'],
                category: 'system',
            },
            {
                id: 'svc-profile',
                label: 'My Profile',
                subtitle: 'View & edit your profile',
                icon: 'person',
                color: '#8B5CF6',
                screen: 'Profile',
                order: 10,
                isVisible: true,
                requiredPermissions: ['users:read'],
                category: 'system',
            },

        ],
    },
};

const menuController = {
    // Helper method to build hierarchical menu structure from flat database rows
    buildHierarchy(menus) {
        const menuMap = new Map();
        const rootMenus = [];

        // First pass: create map of all menus
        menus.forEach(menu => {
            // Parse required fields from JSON columns
            let requiredFlags = [];
            let requiredPermissions = [];
            let requiredRoles = [];

            try {
                if (menu.required_flags) {
                    requiredFlags = typeof menu.required_flags === 'string'
                        ? JSON.parse(menu.required_flags)
                        : menu.required_flags;
                }
                if (menu.required_permissions) {
                    requiredPermissions = typeof menu.required_permissions === 'string'
                        ? JSON.parse(menu.required_permissions)
                        : menu.required_permissions;
                }
                if (menu.required_roles) {
                    requiredRoles = typeof menu.required_roles === 'string'
                        ? JSON.parse(menu.required_roles)
                        : menu.required_roles;
                }
            } catch (e) {
                console.warn('Failed to parse required fields:', e);
            }

            menuMap.set(menu.id, {
                id: menu.id,
                name: menu.name,
                type: menu.type,
                parent_id: menu.parent_id,
                bgColor: menu.bg_color || menu.bgColor || '#8B5CF6',
                textColor: menu.text_color || menu.textColor || '#FFFFFF',
                hoverBgColor: menu.hover_bg_color || menu.hoverBgColor || '#7C3AED',
                hoverTextColor: menu.hover_text_color || menu.hoverTextColor || '#FFFFFF',
                label: menu.label,
                route: menu.route,
                icon: menu.icon,
                subtitle: menu.subtitle,
                order: menu.menu_order || menu.order || 0,
                purpose: menu.purpose || menu.puspose || 'more',
                menuFor: menu.menu_for || menu.for || 'mobile',
                isVisible: menu.is_visible !== false && menu.isVisible !== false,
                items: JSON.parse(menu.items || '[]'),
                // Required access fields
                requiredFlags: requiredFlags,
                requiredPermissions: requiredPermissions,
                requiredRoles: requiredRoles,
                category: menu.category,
                children: [],
            });
        });

        // Second pass: build parent-child relationships
        menus.forEach(menu => {
            const menuItem = menuMap.get(menu.id);
            if (menu.parent_id && menuMap.has(menu.parent_id)) {
                menuMap.get(menu.parent_id).children.push(menuItem);
            } else if (!menu.parent_id) {
                rootMenus.push(menuItem);
            }
        });

        // Sort children by order
        const sortChildren = (items) => {
            items.sort((a, b) => (a.order || 0) - (b.order || 0));
            items.forEach(item => {
                if (item.children && item.children.length > 0) {
                    sortChildren(item.children);
                }
            });
        };

        sortChildren(rootMenus);
        return rootMenus;
    },

    // Get menus for current user (filtered by role/permissions)
    async getMenusForUser(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;

            // Get user's permissions
            const [permissions] = await pool.query(
                'SELECT * FROM permissions WHERE user_id = ?',
                [userId]
            );

            const userFlags = permissions.length > 0 ? JSON.parse(permissions[0].flags || '{}') : {};
            const userPermissions = permissions.length > 0 ? JSON.parse(permissions[0].permissions || '{}') : {};

            // Get all active menus
            const [menus] = await pool.query(
                'SELECT * FROM menus WHERE is_active = true ORDER BY type, menu_order'
            );

            // Build hierarchical structure
            const hierarchicalMenus = menuController.buildHierarchy(menus);

            // Filter menu items based on user's role, flags, and permissions
            const filteredMenus = hierarchicalMenus.map(menu => {
                const filterRecursive = (item) => {
                    // Check access for this item
                    if (!menuController.checkItemAccess(item, userRole, userFlags, userPermissions)) {
                        return null;
                    }

                    // Filter children recursively
                    if (item.children && item.children.length > 0) {
                        item.children = item.children
                            .map(child => filterRecursive(child))
                            .filter(child => child !== null);
                    }

                    return item;
                };

                return filterRecursive(menu);
            }).filter(menu => menu !== null);

            res.json({
                success: true,
                data: filteredMenus,
            });
        } catch (error) {
            console.error('Get menus for user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get menus',
            });
        }
    },

    // Get primary navigation menu
    async getPrimaryMenu(req, res) {
        try {
            const pool = getPool();
            const userId = req.user.id;
            const userRole = req.user.role;

            // Get user's permissions
            const [permissions] = await pool.query(
                'SELECT * FROM permissions WHERE user_id = ?',
                [userId]
            );

            const userFlags = permissions.length > 0 ? JSON.parse(permissions[0].flags || '{}') : {};
            const userPermissions = permissions.length > 0 ? JSON.parse(permissions[0].permissions || '{}') : {};

            // Get primary menu and its children
            const [menus] = await pool.query(
                "SELECT * FROM menus WHERE (type = 'primary' OR parent_id IS NOT NULL) AND is_active = true ORDER BY type, menu_order"
            );

            let primaryMenu = {
                id: 'default-primary',
                name: 'Primary Navigation',
                type: 'primary',
                bgColor: '#8B5CF6',
                textColor: '#FFFFFF',
                hoverBgColor: '#7C3AED',
                hoverTextColor: '#FFFFFF',
                items: [],
            };

            if (menus.length > 0) {
                // Build hierarchy from flat list
                const hierarchicalMenus = menuController.buildHierarchy(menus);

                // Find the primary menu container
                const foundPrimary = hierarchicalMenus.find(m => m.type === 'primary');
                if (foundPrimary) {
                    primaryMenu = foundPrimary;
                }

                // Filter items based on permissions
                const filterRecursive = (item) => {
                    if (!menuController.checkItemAccess(item, userRole, userFlags, userPermissions)) {
                        return null;
                    }
                    if (item.children && item.children.length > 0) {
                        item.children = item.children
                            .map(child => filterRecursive(child))
                            .filter(child => child !== null);
                    }
                    return item;
                };

                primaryMenu.items = (primaryMenu.children || [])
                    .map(item => {
                        // Convert child to item format
                        return {
                            id: item.id,
                            label: item.label || item.name,
                            icon: item.icon,
                            route: item.route,
                            order: item.order,
                            isVisible: item.isVisible,
                            children: item.children || [],
                        };
                    })
                    .map(item => filterRecursive(item))
                    .filter(item => item !== null);
            } else {
                // Fallback to default primary menu with filtering
                primaryMenu.items = defaultMenus.primary.items.filter(item => {
                    return menuController.checkItemAccess(item, userRole, userFlags, userPermissions);
                });
            }

            res.json({
                success: true,
                data: primaryMenu,
            });
        } catch (error) {
            console.error('Get primary menu error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get primary menu',
            });
        }
    },

    // Get specific menu by ID
    async getMenuById(req, res) {
        try {
            const pool = getPool();
            const { menuId } = req.params;
            const userRole = req.user.role;
            const userId = req.user.id;

            // Get user's permissions
            const [permissions] = await pool.query(
                'SELECT * FROM permissions WHERE user_id = ?',
                [userId]
            );

            const userFlags = permissions.length > 0 ? JSON.parse(permissions[0].flags || '{}') : {};
            const userPermissions = permissions.length > 0 ? JSON.parse(permissions[0].permissions || '{}') : {};

            const [menus] = await pool.query(
                'SELECT * FROM menus WHERE id = ? AND is_active = true',
                [menuId]
            );

            if (menus.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu not found',
                });
            }

            const parsedItems = JSON.parse(menus[0].items || '[]');
            const filteredItems = parsedItems.filter(item => {
                return menuController.checkItemAccess(item, userRole, userFlags, userPermissions);
            });

            res.json({
                success: true,
                data: {
                    id: menus[0].id,
                    name: menus[0].name,
                    type: menus[0].type,
                    bgColor: menus[0].bgColor || '#8B5CF6',
                    textColor: menus[0].textColor || '#FFFFFF',
                    hoverBgColor: menus[0].hoverBgColor || '#7C3AED',
                    hoverTextColor: menus[0].hoverTextColor || '#FFFFFF',
                    label: menus[0].label,
                    route: menus[0].route,
                    icon: menus[0].icon,
                    order: menus[0].menu_order || '0',
                    puspose: menus[0].puspose || 'more',
                    for: menus[0].menu_for || 'mobile',
                    isVisible: menus[0].isVisible !== false,
                    items: filteredItems,
                },
            });
        } catch (error) {
            console.error('Get menu by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get menu',
            });
        }
    },

    // Get all menus (admin)
    async getAllMenus(req, res) {
        try {
            const pool = getPool();
            const { includeInactive, hierarchical } = req.query;

            let query = 'SELECT * FROM menus';
            if (!includeInactive || includeInactive !== 'true') {
                query += ' WHERE is_active = true';
            }
            query += ' ORDER BY type, menu_order';

            const [menus] = await pool.query(query);

            let formattedMenus;

            // If hierarchical flag is set, build tree structure
            if (hierarchical === 'true') {
                formattedMenus = menuController.buildHierarchy(menus);
            } else {
                formattedMenus = menus.map(m => ({
                    id: m.id,
                    name: m.name,
                    type: m.type,
                    isActive: m.is_active,
                    parent_id: m.parent_id,
                    bgColor: m.bg_color || m.bgColor,
                    textColor: m.text_color || m.textColor,
                    hoverBgColor: m.hover_bg_color || m.hoverBgColor,
                    hoverTextColor: m.hover_text_color || m.hoverTextColor,
                    label: m.label,
                    route: m.route,
                    icon: m.icon,
                    order: m.menu_order,
                    purpose: m.purpose || m.puspose,
                    menuFor: m.menu_for || m.for,
                    isVisible: m.is_visible !== false,
                    itemCount: JSON.parse(m.items || '[]').length,
                    createdAt: m.created_at,
                    updatedAt: m.updated_at,
                }));
            }

            res.json({
                success: true,
                data: formattedMenus,
            });
        } catch (error) {
            console.error('Get all menus error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get menus',
            });
        }
    },

    // Create new menu (admin)
    async createMenu(req, res) {
        try {
            const pool = getPool();
            const {
                name, type, items,
                parent_id, order,
                bgColor, textColor, hoverBgColor, hoverTextColor,
                label, route, icon, purpose, menuFor, isVisible,
                required_roles, required_flags, required_permissions, category
            } = req.body;

            if (!name || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and type are required',
                });
            }

            const menuId = uuidv4();

            // Build the query dynamically based on provided fields
            const fields = ['id', 'name', 'type', 'items'];
            const values = [menuId, name, type, JSON.stringify(items || [])];
            const placeholders = ['?', '?', '?', '?'];

            if (parent_id !== undefined) {
                fields.push('parent_id');
                values.push(parent_id);
                placeholders.push('?');
            }
            if (order !== undefined) {
                fields.push('menu_order');
                values.push(order);
                placeholders.push('?');
            }
            if (bgColor !== undefined) {
                fields.push('bg_color');
                values.push(bgColor);
                placeholders.push('?');
            }
            if (textColor !== undefined) {
                fields.push('text_color');
                values.push(textColor);
                placeholders.push('?');
            }
            if (hoverBgColor !== undefined) {
                fields.push('hover_bg_color');
                values.push(hoverBgColor);
                placeholders.push('?');
            }
            if (hoverTextColor !== undefined) {
                fields.push('hover_text_color');
                values.push(hoverTextColor);
                placeholders.push('?');
            }
            if (label !== undefined) {
                fields.push('label');
                values.push(label);
                placeholders.push('?');
            }
            if (route !== undefined) {
                fields.push('route');
                values.push(route);
                placeholders.push('?');
            }
            if (icon !== undefined) {
                fields.push('icon');
                values.push(icon);
                placeholders.push('?');
            }
            if (purpose !== undefined) {
                fields.push('purpose');
                values.push(purpose);
                placeholders.push('?');
            }
            if (menuFor !== undefined) {
                fields.push('menu_for');
                values.push(menuFor);
                placeholders.push('?');
            }
            if (isVisible !== undefined) {
                fields.push('is_visible');
                values.push(isVisible);
                placeholders.push('?');
            }

            const query = `INSERT INTO menus (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            await pool.query(query, values);

            res.status(201).json({
                success: true,
                message: 'Menu created successfully',
                data: {
                    id: menuId,
                    name,
                    type,
                    items: items || [],
                    parent_id,
                    order,
                    bgColor,
                    textColor,
                    hoverBgColor,
                    hoverTextColor,
                    label,
                    route,
                    icon,
                    purpose,
                    menuFor,
                    isVisible,
                },
            });
        } catch (error) {
            console.error('Create menu error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create menu',
            });
        }
    },

    // Update menu (admin)
    async updateMenu(req, res) {
        try {
            const pool = getPool();
            const { menuId } = req.params;
            const {
                name, type, items, isActive,
                parent_id, order,
                bgColor, textColor, hoverBgColor, hoverTextColor,
                label, route, icon, purpose, menuFor, isVisible,
                required_roles, required_flags, required_permissions, category
            } = req.body;

            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (type !== undefined) {
                updates.push('type = ?');
                params.push(type);
            }
            if (items !== undefined) {
                updates.push('items = ?');
                params.push(JSON.stringify(items));
            }
            if (isActive !== undefined) {
                updates.push('is_active = ?');
                params.push(isActive);
            }
            // Parent support
            if (parent_id !== undefined) {
                updates.push('parent_id = ?');
                params.push(parent_id);
            }
            // New fields with snake_case
            if (bgColor !== undefined) {
                updates.push('bg_color = ?');
                params.push(bgColor);
            }
            if (textColor !== undefined) {
                updates.push('text_color = ?');
                params.push(textColor);
            }
            if (hoverBgColor !== undefined) {
                updates.push('hover_bg_color = ?');
                params.push(hoverBgColor);
            }
            if (hoverTextColor !== undefined) {
                updates.push('hover_text_color = ?');
                params.push(hoverTextColor);
            }
            if (label !== undefined) {
                updates.push('label = ?');
                params.push(label);
            }
            if (route !== undefined) {
                updates.push('route = ?');
                params.push(route);
            }
            if (icon !== undefined) {
                updates.push('icon = ?');
                params.push(icon);
            }
            if (order !== undefined) {
                updates.push('menu_order = ?');
                params.push(order);
            }
            if (purpose !== undefined) {
                updates.push('purpose = ?');
                params.push(purpose);
            }
            if (menuFor !== undefined) {
                updates.push('menu_for = ?');
                params.push(menuFor);
            }
            if (isVisible !== undefined) {
                updates.push('is_visible = ?');
                params.push(isVisible);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update',
                });
            }

            params.push(menuId);
            await pool.query(
                `UPDATE menus SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            res.json({
                success: true,
                message: 'Menu updated successfully',
            });
        } catch (error) {
            console.error('Update menu error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update menu',
            });
        }
    },

    // Delete menu (admin)
    async deleteMenu(req, res) {
        try {
            const pool = getPool();
            const { menuId } = req.params;

            // Soft delete
            await pool.query(
                'UPDATE menus SET is_active = false WHERE id = ?',
                [menuId]
            );

            res.json({
                success: true,
                message: 'Menu deleted successfully',
            });
        } catch (error) {
            console.error('Delete menu error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete menu',
            });
        }
    },

    // Role hierarchy for menu access
    ROLE_HIERARCHY: {
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
    },

    // Check if user has access to menu item
    checkItemAccess(item, userRole, userFlags, userPermissions) {
        // Check visibility
        if (item.isVisible === false || item.is_visible === false) return false;

        // Get required fields - support both old format (items JSON) and new format (DB columns)
        const requiredRoles = item.requiredRoles || item.required_roles || [];
        const requiredFlags = item.requiredFlags || item.required_flags || [];
        const requiredPermissions = item.requiredPermissions || item.required_permissions || [];

        // Check role requirements - use hierarchy to allow inherited roles
        if (requiredRoles && requiredRoles.length > 0) {
            const userInheritedRoles = menuController.ROLE_HIERARCHY[userRole] || [userRole];
            const hasAccess = requiredRoles.some(role => userInheritedRoles.includes(role));
            if (!hasAccess) {
                return false;
            }
        }

        // Check flag requirements
        if (requiredFlags && requiredFlags.length > 0) {
            for (const flag of requiredFlags) {
                if (!userFlags[flag]) {
                    return false;
                }
            }
        }

        // Check permission requirements
        if (requiredPermissions && requiredPermissions.length > 0) {
            for (const perm of requiredPermissions) {
                const [resource, action] = perm.split(':');
                if (!userPermissions[resource] || !userPermissions[resource][action]) {
                    return false;
                }
            }
        }

        return true;
    },

    // Initialize default menus (called on server startup)
    async initializeDefaultMenus() {
        try {
            const pool = getPool();

            // Check if menus exist
            const [existing] = await pool.query('SELECT COUNT(*) as count FROM menus');

            if (existing[0].count === 0) {
                console.log('Initializing default menus...');

                // Insert primary menu
                await pool.query(
                    `INSERT INTO menus (id, name, type, is_active, items) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        'menu-primary-default',
                        'Primary Navigation',
                        'primary',
                        true,
                        JSON.stringify(defaultMenus.primary.items),
                    ]
                );

                // Insert secondary menu (Core Services)
                await pool.query(
                    `INSERT INTO menus (id, name, type, is_active, items) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        'menu-secondary-default',
                        'Core Services',
                        'secondary',
                        true,
                        JSON.stringify(defaultMenus.secondary.items),
                    ]
                );

                console.log('Default menus initialized');
            }
        } catch (error) {
            console.error('Initialize default menus error:', error);
        }
    },
};

module.exports = menuController;

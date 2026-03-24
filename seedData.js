const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'safety_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci'
};

// Generate UUID
function generateId() {
    return uuidv4();
}

// Hash password
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

// Sample data for seeding
const sampleData = {
    // Users with different roles
    users: [
        {
            id: generateId(),
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@safetyapp.com',
            phone: '+91-9876543210',
            password: 'admin123',
            role: 'admin',
            is_verified: 1,
            is_active: 1
        },
        {
            id: generateId(),
            first_name: 'Priya',
            last_name: 'Sharma',
            email: 'priya@example.com',
            phone: '+91-9876543211',
            password: 'user123',
            role: 'woman',
            is_verified: 1,
            is_active: 1
        },
        {
            id: generateId(),
            first_name: 'Rajesh',
            last_name: 'Kumar',
            email: 'rajesh@example.com',
            phone: '+91-9876543212',
            password: 'parent123',
            role: 'parent',
            is_verified: 1,
            is_active: 1
        },
        {
            id: generateId(),
            first_name: 'Anita',
            last_name: 'Desai',
            email: 'anita@example.com',
            phone: '+91-9876543213',
            password: 'guardian123',
            role: 'guardian',
            is_verified: 1,
            is_active: 1
        }
    ],

    // Themes
    // themes: [
    //     {
    //         id: generateId(),
    //         name: 'Default Light',
    //         description: 'Default light theme for the app',
    //         is_default: true,
    //         is_active: true,
    //         config: JSON.stringify({
    //             primaryColor: '#6366f1',
    //             backgroundColor: '#ffffff',
    //             textColor: '#1f2937',
    //             accentColor: '#8b5cf6'
    //         })
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Dark Mode',
    //         description: 'Dark theme for night usage',
    //         is_default: false,
    //         is_active: true,
    //         config: JSON.stringify({
    //             primaryColor: '#818cf8',
    //             backgroundColor: '#1f2937',
    //             textColor: '#f9fafb',
    //             accentColor: '#a78bfa'
    //         })
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Safety Red',
    //         description: 'High visibility red theme',
    //         is_default: false,
    //         is_active: true,
    //         config: JSON.stringify({
    //             primaryColor: '#ef4444',
    //             backgroundColor: '#fef2f2',
    //             textColor: '#1f2937',
    //             accentColor: '#f87171'
    //         })
    //     }
    // ],

    // Default Emergency Contacts
    // emergencyContacts: [
    //     {
    //         id: generateId(),
    //         name: 'Police',
    //         phone: '100',
    //         description: 'Police Emergency',
    //         country: 'India',
    //         service_type: 'police',
    //         is_active: true,
    //         display_order: 1,
    //         icon: 'shield'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Women Helpline',
    //         phone: '1091',
    //         description: 'National Women Helpline',
    //         country: 'India',
    //         service_type: 'emergency',
    //         is_active: true,
    //         display_order: 2,
    //         icon: 'heart'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Ambulance',
    //         phone: '102',
    //         description: 'Medical Emergency',
    //         country: 'India',
    //         service_type: 'medical',
    //         is_active: true,
    //         display_order: 3,
    //         icon: 'plus-circle'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Fire Brigade',
    //         phone: '101',
    //         description: 'Fire Emergency',
    //         country: 'India',
    //         service_type: 'fire',
    //         is_active: true,
    //         display_order: 4,
    //         icon: 'flame'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Child Helpline',
    //         phone: '1098',
    //         description: 'Child Emergency Helpline',
    //         country: 'India',
    //         service_type: 'emergency',
    //         is_active: true,
    //         display_order: 5,
    //         icon: 'users'
    //     }
    // ],

    // Menus
    // menus: [
    //     {
    //         id: generateId(),
    //         name: 'Home',
    //         type: 'primary',
    //         is_active: true,
    //         items: JSON.stringify([]),
    //         menu_order: 1,
    //         route: '/home',
    //         icon: 'home',
    //         label: 'Home',
    //         menu_for: 'mobile',
    //         is_visible: true,
    //         category: 'main'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'SOS',
    //         type: 'primary',
    //         is_active: true,
    //         items: JSON.stringify([]),
    //         menu_order: 2,
    //         route: '/sos',
    //         icon: 'alert-circle',
    //         label: 'SOS',
    //         menu_for: 'mobile',
    //         is_visible: true,
    //         category: 'emergency'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Family',
    //         type: 'primary',
    //         is_active: true,
    //         items: JSON.stringify([]),
    //         menu_order: 3,
    //         route: '/family',
    //         icon: 'users',
    //         label: 'Family',
    //         menu_for: 'mobile',
    //         is_visible: true,
    //         category: 'main'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Safety Tips',
    //         type: 'primary',
    //         is_active: true,
    //         items: JSON.stringify([]),
    //         menu_order: 4,
    //         route: '/safety-tips',
    //         icon: 'shield',
    //         label: 'Safety',
    //         menu_for: 'mobile',
    //         is_visible: true,
    //         category: 'info'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Child Care',
    //         type: 'primary',
    //         is_active: true,
    //         items: JSON.stringify([]),
    //         menu_order: 5,
    //         route: '/childcare',
    //         icon: 'baby',
    //         label: 'Child Care',
    //         menu_for: 'mobile',
    //         is_visible: true,
    //         category: 'main'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Home Automation',
    //         type: 'primary',
    //         is_active: true,
    //         items: JSON.stringify([]),
    //         menu_order: 6,
    //         route: '/home-automation',
    //         icon: 'home',
    //         label: 'Smart Home',
    //         menu_for: 'mobile',
    //         is_visible: true,
    //         category: 'automation'
    //     },
    //     {
    //         id: generateId(),
    //         name: 'Profile',
    //         type: 'primary',
    //         is_active: true,
    //         items: JSON.stringify([]),
    //         menu_order: 7,
    //         route: '/profile',
    //         icon: 'user',
    //         label: 'Profile',
    //         menu_for: 'mobile',
    //         is_visible: true,
    //         category: 'main'
    //     }
    // ],

    // Role Permissions
    // rolePermissions: [
    //     {
    //         id: generateId(),
    //         role: 'admin',
    //         flags: JSON.stringify({
    //             canManageUsers: true,
    //             canViewAnalytics: true,
    //             canManageSettings: true,
    //             canAccessAllData: true
    //         }),
    //         base_permissions: JSON.stringify({
    //             users: ['create', 'read', 'update', 'delete'],
    //             families: ['create', 'read', 'update', 'delete'],
    //             emergency_contacts: ['create', 'read', 'update', 'delete'],
    //             themes: ['create', 'read', 'update', 'delete'],
    //             menus: ['create', 'read', 'update', 'delete'],
    //             permissions: ['create', 'read', 'update', 'delete']
    //         }),
    //         ui_restrictions: JSON.stringify({
    //             showAdminPanel: true,
    //             showAnalytics: true,
    //             showUserManagement: true
    //         })
    //     },
    //     {
    //         id: generateId(),
    //         role: 'woman',
    //         flags: JSON.stringify({
    //             canManageProfile: true,
    //             canManageFamily: true,
    //             canAccessEmergency: true
    //         }),
    //         base_permissions: JSON.stringify({
    //             profile: ['read', 'update'],
    //             family: ['create', 'read', 'update'],
    //             emergency_contacts: ['create', 'read', 'update', 'delete'],
    //             location: ['read', 'update']
    //         }),
    //         ui_restrictions: JSON.stringify({
    //             showAdminPanel: false,
    //             showAnalytics: false,
    //             showUserManagement: false
    //         })
    //     },
    //     {
    //         id: generateId(),
    //         role: 'parent',
    //         flags: JSON.stringify({
    //             canManageChildren: true,
    //             canViewLocation: true,
    //             canManageFamily: true
    //         }),
    //         base_permissions: JSON.stringify({
    //             profile: ['read', 'update'],
    //             family: ['create', 'read', 'update'],
    //             children: ['create', 'read', 'update'],
    //             location: ['read']
    //         }),
    //         ui_restrictions: JSON.stringify({
    //             showAdminPanel: false,
    //             showAnalytics: true,
    //             showUserManagement: false
    //         })
    //     },
    //     {
    //         id: generateId(),
    //         role: 'guardian',
    //         flags: JSON.stringify({
    //             canViewWard: true,
    //             canReceiveAlerts: true
    //         }),
    //         base_permissions: JSON.stringify({
    //             profile: ['read'],
    //             ward: ['read'],
    //             alerts: ['read']
    //         }),
    //         ui_restrictions: JSON.stringify({
    //             showAdminPanel: false,
    //             showAnalytics: false,
    //             showUserManagement: false
    //         })
    //     }
    // ],

    // App Settings
    appSettings: [
        {
            id: generateId(),
            setting_key: 'app_name',
            setting_value: 'Women Safety App',
            description: 'Application name',
            is_encrypted: false
        },
        {
            id: generateId(),
            setting_key: 'version',
            setting_value: '1.0.0',
            description: 'App version',
            is_encrypted: false
        },
        {
            id: generateId(),
            setting_key: 'sos_timer',
            setting_value: '30',
            description: 'SOS activation timer in seconds',
            is_encrypted: false
        },
        {
            id: generateId(),
            setting_key: 'location_update_interval',
            setting_value: '60',
            description: 'Location update interval in seconds',
            is_encrypted: false
        }
    ],

    // Safety Tips
    safetyTips: [
        {
            id: generateId(),
            title: 'Stay Aware of Your Surroundings',
            content: 'Always be conscious of your environment. Avoid distractions like excessive phone use when walking alone.',
            category: 'general',
            is_active: true,
            order_index: 1
        },
        {
            id: generateId(),
            title: 'Share Your Location',
            content: 'Keep location sharing enabled with trusted family members or friends.',
            category: 'general',
            is_active: true,
            order_index: 2
        },
        {
            id: generateId(),
            title: 'Trust Your Instincts',
            content: 'If something feels wrong, remove yourself from the situation immediately.',
            category: 'general',
            is_active: true,
            order_index: 3
        },
        {
            id: generateId(),
            title: 'Know Emergency Numbers',
            content: 'Keep emergency contact numbers saved and easily accessible.',
            category: 'emergency',
            is_active: true,
            order_index: 4
        },
        {
            id: generateId(),
            title: 'Use Well-Lit Routes',
            content: 'Prefer well-lit, populated areas when walking alone, especially at night.',
            category: 'travel',
            is_active: true,
            order_index: 5
        }
    ],

    // Safety Laws
    safetyLaws: [
        {
            id: generateId(),
            title: 'Sexual Harassment of Women at Workplace Act',
            description: 'Protection against sexual harassment at workplace',
            content: 'Every woman has the right to a safe workplace. Employers must provide a safe environment and have mechanisms in place for addressing complaints.',
            category: 'workplace',
            is_active: true,
            order_index: 1
        },
        {
            id: generateId(),
            title: 'Domestic Violence Act',
            description: 'Protection for women against domestic violence',
            content: 'The Protection of Women from Domestic Violence Act provides protection to women who are victims of domestic violence.',
            category: 'domestic',
            is_active: true,
            order_index: 2
        },
        {
            id: generateId(),
            title: 'India Penal Code Section 354',
            description: 'Punishment for assault on women',
            content: 'Whoever assaults or uses criminal force to any woman, intending to outrage her modesty, shall be punished.',
            category: 'criminal',
            is_active: true,
            order_index: 3
        }
    ],

    // Session History (login/logout/force_logout tracking)
    sessionHistory: [
        // Admin user sessions
        {
            user_id: 'admin-user-id-001',
            action: 'login',
            app_version: '1.0.0',
            device_info: 'Samsung Galaxy S21',
            device_id: 'device-001',
            os_version: 'Android 13',
            ip_address: '192.168.1.101',
            latitude: 28.6139,
            longitude: 77.2090,
            location_name: 'New Delhi, India',
            user_agent: 'Mozilla/5.0 (Linux; Android 13)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
            user_id: 'admin-user-id-001',
            action: 'logout',
            app_version: '1.0.0',
            device_info: 'Samsung Galaxy S21',
            device_id: 'device-001',
            os_version: 'Android 13',
            ip_address: '192.168.1.101',
            latitude: 28.6139,
            longitude: 77.2090,
            location_name: 'New Delhi, India',
            user_agent: 'Mozilla/5.0 (Linux; Android 13)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000) // 30 mins after login
        },
        // Priya (woman user) sessions
        {
            user_id: 'priya-user-id-001',
            action: 'login',
            app_version: '1.0.0',
            device_info: 'iPhone 14 Pro',
            device_id: 'device-002',
            os_version: 'iOS 17.2',
            ip_address: '192.168.1.102',
            latitude: 19.0760,
            longitude: 72.8777,
            location_name: 'Mumbai, Maharashtra',
            user_agent: 'Mozilla/5.0 (iPhone; CPU iOS 17.2)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        {
            user_id: 'priya-user-id-001',
            action: 'logout',
            app_version: '1.0.0',
            device_info: 'iPhone 14 Pro',
            device_id: 'device-002',
            os_version: 'iOS 17.2',
            ip_address: '192.168.1.102',
            latitude: 19.0760,
            longitude: 72.8777,
            location_name: 'Mumbai, Maharashtra',
            user_agent: 'Mozilla/5.0 (iPhone; CPU iOS 17.2)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
        },
        {
            user_id: 'priya-user-id-001',
            action: 'login',
            app_version: '1.0.0',
            device_info: 'iPhone 14 Pro',
            device_id: 'device-002',
            os_version: 'iOS 17.2',
            ip_address: '192.168.1.105',
            latitude: 19.0760,
            longitude: 72.8777,
            location_name: 'Mumbai, Maharashtra',
            user_agent: 'Mozilla/5.0 (iPhone; CPU iOS 17.2)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
            user_id: 'priya-user-id-001',
            action: 'force_logout',
            app_version: '1.0.0',
            device_info: 'iPhone 14 Pro',
            device_id: 'device-002',
            os_version: 'iOS 17.2',
            ip_address: '192.168.1.105',
            latitude: 19.0760,
            longitude: 72.8777,
            location_name: 'Mumbai, Maharashtra',
            user_agent: 'Mozilla/5.0 (iPhone; CPU iOS 17.2)',
            success: true,
            reason: 'Admin initiated force logout',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        // Rajesh (parent user) sessions
        {
            user_id: 'rajesh-user-id-001',
            action: 'login',
            app_version: '1.0.0',
            device_info: 'OnePlus 11',
            device_id: 'device-003',
            os_version: 'Android 14',
            ip_address: '192.168.1.103',
            latitude: 12.9716,
            longitude: 77.5946,
            location_name: 'Bangalore, Karnataka',
            user_agent: 'Mozilla/5.0 (Linux; Android 14)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
            user_id: 'rajesh-user-id-001',
            action: 'logout',
            app_version: '1.0.0',
            device_info: 'OnePlus 11',
            device_id: 'device-003',
            os_version: 'Android 14',
            ip_address: '192.168.1.103',
            latitude: 12.9716,
            longitude: 77.5946,
            location_name: 'Bangalore, Karnataka',
            user_agent: 'Mozilla/5.0 (Linux; Android 14)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
        },
        // Anita (guardian user) sessions
        {
            user_id: 'anita-user-id-001',
            action: 'login',
            app_version: '1.0.0',
            device_info: 'Google Pixel 8',
            device_id: 'device-004',
            os_version: 'Android 14',
            ip_address: '192.168.1.104',
            latitude: 22.5726,
            longitude: 88.3639,
            location_name: 'Kolkata, West Bengal',
            user_agent: 'Mozilla/5.0 (Linux; Android 14)',
            success: true,
            reason: null,
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        },
        // Failed login attempt
        {
            user_id: 'unknown-user',
            action: 'login',
            app_version: '1.0.0',
            device_info: 'Unknown Device',
            device_id: 'device-999',
            os_version: 'Android 12',
            ip_address: '192.168.1.200',
            latitude: 13.0827,
            longitude: 80.2707,
            location_name: 'Chennai, Tamil Nadu',
            user_agent: 'Mozilla/5.0 (Linux; Android 12)',
            success: false,
            reason: 'Invalid credentials',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        }
    ]
};

// Seed database function
async function seedDatabase() {
    let pool;
    try {
        console.log('Starting database seeding...');

        // Create connection pool
        pool = mysql.createPool(dbConfig);

        // // Seed Users
        // console.log('Seeding users...');
        // for (const user of sampleData.users) {
        //     const hashedPassword = await hashPassword(user.password);
        //     await pool.query(
        //         `INSERT INTO users (id, first_name, last_name, email, phone, password, role, is_verified, is_active, created_at, updated_at)
        //          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        //         [user.id, user.first_name, user.last_name, user.email, user.phone, hashedPassword, user.role, user.is_verified, user.is_active]
        //     );
        // }
        // console.log(`✓ Seeded ${sampleData.users.length} users`);

        // // Seed Themes
        // console.log('Seeding themes...');
        // for (const theme of sampleData.themes) {
        //     await pool.query(
        //         `INSERT INTO themes (id, name, description, is_default, is_active, config, created_at, updated_at)
        //          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        //         [theme.id, theme.name, theme.description, theme.is_default, theme.is_active, theme.config]
        //     );
        // }
        // console.log(`✓ Seeded ${sampleData.themes.length} themes`);

        // // Seed Emergency Contacts
        // console.log('Seeding emergency contacts...');
        // for (const contact of sampleData.emergencyContacts) {
        //     await pool.query(
        //         `INSERT INTO default_emergency_contacts (id, name, phone, description, country, service_type, is_active, display_order, icon, created_at, updated_at)
        //          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        //         [contact.id, contact.name, contact.phone, contact.description, contact.country, contact.service_type, contact.is_active, contact.display_order, contact.icon]
        //     );
        // }
        // console.log(`✓ Seeded ${sampleData.emergencyContacts.length} emergency contacts`);

        // // Seed Menus
        // console.log('Seeding menus...');
        // for (const menu of sampleData.menus) {
        //     await pool.query(
        //         `INSERT INTO menus (id, name, type, is_active, items, menu_order, route, icon, label, menu_for, is_visible, category, created_at, updated_at)
        //          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        //         [menu.id, menu.name, menu.type, menu.is_active, menu.items, menu.menu_order, menu.route, menu.icon, menu.label, menu.menu_for, menu.is_visible, menu.category]
        //     );
        // }
        // console.log(`✓ Seeded ${sampleData.menus.length} menus`);

        // // Seed Role Permissions
        // console.log('Seeding role permissions...');
        // for (const perm of sampleData.rolePermissions) {
        //     await pool.query(
        //         `INSERT INTO role_permissions (id, role, flags, base_permissions, ui_restrictions, created_at, updated_at)
        //          VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        //         [perm.id, perm.role, perm.flags, perm.base_permissions, perm.ui_restrictions]
        //     );
        // }
        // console.log(`✓ Seeded ${sampleData.rolePermissions.length} role permissions`);

        // Seed App Settings
        // console.log('Seeding app settings...');
        // for (const setting of sampleData.appSettings) {
        //     await pool.query(
        //         `INSERT INTO app_settings (id, setting_key, setting_value, description, is_encrypted, created_at, updated_at)
        //          VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        //         [setting.id, setting.setting_key, setting.setting_value, setting.description, setting.is_encrypted]
        //     );
        // }
        // console.log(`✓ Seeded ${sampleData.appSettings.length} app settings`);

        // Seed User-specific data (using first user as example)
        // const firstUser = sampleData.users[0];

        // // Add user emergency preferences
        // await pool.query(
        //     `INSERT INTO user_emergency_preferences (id, user_id, enable_sos, auto_share_location, notify_emergency_contacts, sos_sound_enabled, sos_vibration_enabled, emergency_message)
        //      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        //     [generateId(), firstUser.id, true, true, true, true, true, 'I need help! Please assist me.']
        // );

        // // Add user settings
        // await pool.query(
        //     `INSERT INTO user_settings (id, user_id, notification_enabled, location_sharing, auto_sos, shake_to_sos, sos_timer, shake_sensitivity)
        //      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        //     [generateId(), firstUser.id, true, true, false, false, 30, 3]
        // );

        // console.log('✓ Seeded user-specific data');

        // console.log('\n========================================');
        // console.log('Database seeding completed successfully!');
        // console.log('========================================');
        // console.log('\nTest Accounts:');
        // console.log('  Admin: admin@safetyapp.com / admin123');
        // console.log('  User: priya@example.com / user123');
        // console.log('  Parent: rajesh@example.com / parent123');
        // console.log('  Guardian: anita@example.com / guardian123');
        // console.log('========================================\n');

    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase, sampleData };

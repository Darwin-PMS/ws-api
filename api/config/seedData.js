const { getPool } = require('./db');

/**
 * Check if data has already been seeded
 * Uses app_settings table to track seeding status
 */
async function isSeedingRequired() {
    const pool = getPool();
    try {
        const [rows] = await pool.query(
            "SELECT setting_value FROM app_settings WHERE setting_key = 'db_seeded'",
        );
        return rows.length === 0 || rows[0].setting_value !== 'true';
    } catch (error) {
        // If table doesn't exist or error, seeding is required
        return true;
    }
}

/**
 * Mark database as seeded
 */
async function markAsSeeded() {
    const pool = getPool();
    try {
        await pool.query(`
            INSERT INTO app_settings (id, setting_key, setting_value, description)
            VALUES (UUID(), 'db_seeded', 'true', 'Database seeding status')
            ON DUPLICATE KEY UPDATE setting_value = 'true'
        `);
    } catch (error) {
        console.error('Error marking as seeded:', error);
    }
}

/**
 * Seed default data into the database
 * This function should only run once when the database is first set up
 */
async function seedDefaultData() {
    const pool = getPool();

    try {
        // Check if seeding is required
        if (!(await isSeedingRequired())) {
            console.log('Database already seeded, skipping...');
            return false;
        }

        console.log('Seeding default data...');

        // Seed default emergency contacts
        await seedDefaultEmergencyContacts(pool);

        // Mark as seeded
        await markAsSeeded();

        console.log('Default data seeded successfully');
        return true;
    } catch (error) {
        console.error('Error seeding data:', error);
        throw error;
    }
}

/**
 * Seed default emergency contacts
 */
async function seedDefaultEmergencyContacts(pool) {
    const defaultContacts = [
        {
            name: 'National Emergency Number',
            phone: '112',
            description: 'All India Emergency Response',
            service_type: 'police',
            country: 'India',
            icon: 'police',
            display_order: 1
        },
        {
            name: 'Women Helpline',
            phone: '1091',
            description: 'Women Safety Helpline',
            service_type: 'emergency',
            country: 'India',
            icon: 'heart',
            display_order: 2
        },
        {
            name: 'Police',
            phone: '100',
            description: 'Police Emergency',
            service_type: 'police',
            country: 'India',
            icon: 'shield',
            display_order: 3
        },
        {
            name: 'Ambulance',
            phone: '102',
            description: 'Medical Emergency',
            service_type: 'medical',
            country: 'India',
            icon: 'medical',
            display_order: 4
        },
        {
            name: 'Fire Brigade',
            phone: '101',
            description: 'Fire Emergency',
            service_type: 'fire',
            country: 'India',
            icon: 'flame',
            display_order: 5
        }
    ];

    for (const contact of defaultContacts) {
        await pool.query(`
            INSERT IGNORE INTO default_emergency_contacts 
            (id, name, phone, description, service_type, country, icon, display_order)
            VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
        `, [contact.name, contact.phone, contact.description, contact.service_type, contact.country, contact.icon, contact.display_order]);
    }
}

/**
 * Initialize all default data including themes, menus, permissions
 * This combines the controller initialization functions
 */
async function initializeAllDefaultData() {
    const pool = getPool();

    try {
        // Import controllers for initialization
        const themeController = require('../controllers/themeController');
        const menuController = require('../controllers/menuController');
        const permissionController = require('../controllers/permissionController');
        const sessionHistoryController = require('../controllers/sessionHistoryController');

        console.log('Initializing default themes...');
        await themeController.initializeDefaultThemes();
        console.log('Default themes initialized');

        console.log('Initializing default menus...');
        await menuController.initializeDefaultMenus();
        console.log('Default menus initialized');

        console.log('Initializing default role permissions...');
        await permissionController.initializeRolePermissions();
        console.log('Default role permissions initialized');

        console.log('Initializing session history table...');
        await sessionHistoryController.initializeTable();
        console.log('Session history table initialized successfully');

        console.log('Default data initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing default data:', error);
        throw error;
    }
}

/**
 * Run full database setup - creates tables and seeds data
 * Use this for initial setup or when you need to reset
 */
async function fullDatabaseSetup() {
    const { createTables } = require('./createTables');

    try {
        // Create tables if they don't exist
        console.log('Setting up database tables...');
        await createTables();
        console.log('Tables setup complete');

        // Seed default data
        console.log('Seeding default data...');
        await seedDefaultData();
        console.log('Default data seeding complete');

        // Initialize application default data
        console.log('Initializing application default data...');
        await initializeAllDefaultData();
        console.log('Application default data initialized');

        return true;
    } catch (error) {
        console.error('Error in full database setup:', error);
        throw error;
    }
}

/**
 * Re-run only seeding (without recreating tables)
 */
async function reseedData() {
    try {
        // Reset seeding status
        const pool = getPool();
        await pool.query(`
            UPDATE app_settings SET setting_value = 'false' WHERE setting_key = 'db_seeded'
        `);

        // Run seeding
        await seedDefaultData();
        await initializeAllDefaultData();

        console.log('Data re-seeding completed');
        return true;
    } catch (error) {
        console.error('Error re-seeding data:', error);
        throw error;
    }
}

module.exports = {
    seedDefaultData,
    initializeAllDefaultData,
    fullDatabaseSetup,
    reseedData,
    isSeedingRequired
};

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'safety_app',
    multipleStatements: true
};

async function runMigration() {
    let connection;

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', '001_add_themes_menus_permissions.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Running migration: 001_add_themes_menus_permissions.sql');
        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('\nTables created:');
        console.log('  - themes');
        console.log('  - user_themes');
        console.log('  - menus');
        console.log('  - permissions');
        console.log('  - role_permissions');
        console.log('\nDefault data inserted:');
        console.log('  - Dark default theme');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();

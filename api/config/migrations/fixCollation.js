// Fix database collation issues
const { getPool } = require('../config/db');

async function fixCollation() {
    const pool = getPool();
    
    try {
        console.log('Fixing database collation issues...');
        
        // Fix session_history table collation
        try {
            await pool.query(`
                ALTER TABLE session_history 
                CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log('Fixed session_history table');
        } catch (e) {
            console.log('session_history already fixed or error:', e.message);
        }
        
        // Fix users table collation
        try {
            await pool.query(`
                ALTER TABLE users 
                CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log('Fixed users table');
        } catch (e) {
            console.log('users already fixed or error:', e.message);
        }
        
        // Fix geographic_areas table collation
        try {
            await pool.query(`
                ALTER TABLE geographic_areas 
                CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log('Fixed geographic_areas table');
        } catch (e) {
            console.log('geographic_areas already fixed or error:', e.message);
        }
        
        // Fix user_area_assignments table collation
        try {
            await pool.query(`
                ALTER TABLE user_area_assignments 
                CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log('Fixed user_area_assignments table');
        } catch (e) {
            console.log('user_area_assignments already fixed or error:', e.message);
        }
        
        // Fix sos_cases table collation
        try {
            await pool.query(`
                ALTER TABLE sos_cases 
                CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log('Fixed sos_cases table');
        } catch (e) {
            console.log('sos_cases already fixed or error:', e.message);
        }
        
        // Fix grievances table collation
        try {
            await pool.query(`
                ALTER TABLE grievances 
                CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log('Fixed grievances table');
        } catch (e) {
            console.log('grievances already fixed or error:', e.message);
        }
        
        // Fix families table collation
        try {
            await pool.query(`
                ALTER TABLE families 
                CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log('Fixed families table');
        } catch (e) {
            console.log('families already fixed or error:', e.message);
        }
        
        console.log('Collation fix completed!');
    } catch (error) {
        console.error('Error fixing collation:', error);
    }
    
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    fixCollation();
}

module.exports = { fixCollation };

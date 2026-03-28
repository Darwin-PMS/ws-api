// Database migration script for zone functionality
// Run this to add missing columns to existing databases

const { getPool } = require('../config/db');

async function runMigration() {
    const pool = getPool();
    
    try {
        console.log('Running zone migration...');
        
        // Check if lat column exists in geographic_areas
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'geographic_areas'
        `);
        
        const columnNames = columns.map(c => c.COLUMN_NAME);
        
        // Add lat column if not exists
        if (!columnNames.includes('lat')) {
            console.log('Adding lat column...');
            await pool.query(`
                ALTER TABLE geographic_areas 
                ADD COLUMN lat DECIMAL(10, 8) AFTER code
            `);
        }
        
        // Add lng column if not exists
        if (!columnNames.includes('lng')) {
            console.log('Adding lng column...');
            await pool.query(`
                ALTER TABLE geographic_areas 
                ADD COLUMN lng DECIMAL(11, 8) AFTER lat
            `);
        }
        
        // Add radius_km column if not exists
        if (!columnNames.includes('radius_km')) {
            console.log('Adding radius_km column...');
            await pool.query(`
                ALTER TABLE geographic_areas 
                ADD COLUMN radius_km DECIMAL(10, 2) AFTER lng
            `);
        }
        
        // Add parent_area_id column if not exists
        if (!columnNames.includes('parent_area_id')) {
            console.log('Adding parent_area_id column...');
            await pool.query(`
                ALTER TABLE geographic_areas 
                ADD COLUMN parent_area_id VARCHAR(36) AFTER radius_km
            `);
        }
        
        // Add description column if not exists
        if (!columnNames.includes('description')) {
            console.log('Adding description column...');
            await pool.query(`
                ALTER TABLE geographic_areas 
                ADD COLUMN description TEXT AFTER boundaries
            `);
        }
        
        // Add created_by column if not exists
        if (!columnNames.includes('created_by')) {
            console.log('Adding created_by column...');
            await pool.query(`
                ALTER TABLE geographic_areas 
                ADD COLUMN created_by VARCHAR(36) AFTER is_active
            `);
        }
        
        // Check if zone_head role exists in user_area_assignments
        try {
            await pool.query(`
                ALTER TABLE user_area_assignments 
                MODIFY COLUMN role_in_area ENUM('admin', 'police', 'supervisor', 'zone_head', 'village_head', 'guardian', 'member') DEFAULT 'member'
            `);
            console.log('Updated role_in_area enum to include zone_head');
        } catch (e) {
            // Column might already have zone_head
            console.log('Role enum already updated or error:', e.message);
        }
        
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error);
    }
    
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };

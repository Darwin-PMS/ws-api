// Seed script to create sample zones and user assignments
const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function seedZones() {
    const pool = getPool();
    
    try {
        console.log('Seeding zones...');
        
        // Check if geographic_areas table exists and has data
        const [existingZones] = await pool.query('SELECT COUNT(*) as count FROM geographic_areas');
        
        if (existingZones[0].count > 0) {
            console.log('Zones already exist, skipping seed');
            return;
        }
        
        // Create sample zones
        const zones = [
            { id: uuidv4(), name: 'North District', type: 'district', code: 'ND-001', lat: 28.6139, lng: 77.2090, radius_km: 15, description: 'North Delhi District' },
            { id: uuidv4(), name: 'South Zone', type: 'zone', code: 'SZ-001', lat: 28.5744, lng: 77.2656, radius_km: 8, description: 'South Delhi Zone' },
            { id: uuidv4(), name: 'East Village', type: 'village', code: 'EV-001', lat: 28.6548, lng: 77.2885, radius_km: 3, description: 'East Village Area' },
            { id: uuidv4(), name: 'West Ward', type: 'ward', code: 'WW-001', lat: 28.5355, lng: 77.2100, radius_km: 2, description: 'West Ward' },
            { id: uuidv4(), name: 'Central City', type: 'city', code: 'CC-001', lat: 28.6304, lng: 77.2177, radius_km: 10, description: 'Central City Area' },
        ];
        
        for (const zone of zones) {
            await pool.query(
                `INSERT INTO geographic_areas (id, name, type, code, lat, lng, radius_km, description, is_active, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
                [zone.id, zone.name, zone.type, zone.code, zone.lat, zone.lng, zone.radius_km, zone.description]
            );
            console.log(`Created zone: ${zone.name}`);
        }
        
        // Get some users to assign to zones
        const [users] = await pool.query('SELECT id FROM users LIMIT 10');
        
        if (users.length > 0) {
            // Assign first user as zone head of North District
            await pool.query(
                `INSERT INTO user_area_assignments (id, user_id, area_id, role_in_area, is_primary, assigned_by, assigned_at)
                 VALUES (?, ?, ?, 'zone_head', TRUE, ?, NOW())`,
                [uuidv4(), users[0].id, zones[0].id, users[0].id]
            );
            console.log(`Assigned ${users[0].id} as Zone Head of ${zones[0].name}`);
            
            // Assign a few more users as members
            for (let i = 1; i < Math.min(users.length, 4); i++) {
                await pool.query(
                    `INSERT INTO user_area_assignments (id, user_id, area_id, role_in_area, is_primary, assigned_by, assigned_at)
                     VALUES (?, ?, ?, 'member', FALSE, ?, NOW())`,
                    [uuidv4(), users[i].id, zones[0].id, users[0].id]
                );
                console.log(`Assigned ${users[i].id} as member of ${zones[0].name}`);
            }
        }
        
        console.log('Seeding completed!');
    } catch (error) {
        console.error('Seed error:', error);
    }
    
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    seedZones();
}

module.exports = { seedZones };

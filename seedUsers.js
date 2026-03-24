/**
 * User Seed Script
 * Run this script to insert test users with properly hashed passwords
 * Usage: node server/seedUsers.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'safety_app_new'
};

const PASSWORD = 'Password@123';

const users = [
    { firstName: 'Anshuman', lastName: 'Test', email: 'anshuman@test.com', phone: '+911234567890', role: 'woman' },
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya@test.com', phone: '+911234567891', role: 'woman' },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@test.com', phone: '+911234567892', role: 'woman' },
    { firstName: 'Emily', lastName: 'Davis', email: 'emily@test.com', phone: '+911234567893', role: 'woman' },
    { firstName: 'Maria', lastName: 'Garcia', email: 'maria@test.com', phone: '+911234567894', role: 'woman' },
    { firstName: 'John', lastName: 'Parent', email: 'john.parent@test.com', phone: '+911234567895', role: 'parent' },
    { firstName: 'Jane', lastName: 'Guardian', email: 'jane.guardian@test.com', phone: '+911234567896', role: 'guardian' },
    { firstName: 'Mike', lastName: 'Friend', email: 'mike.friend@test.com', phone: '+911234567897', role: 'friend' },
    { firstName: 'Admin', lastName: 'User', email: 'admin@test.com', phone: '+911234567898', role: 'admin' },
    { firstName: 'Aisha', lastName: 'Khan', email: 'aisha@test.com', phone: '+911234567899', role: 'woman' },
    { firstName: 'Lisa', lastName: 'Brown', email: 'lisa@test.com', phone: '+911234567801', role: 'woman' },
    { firstName: 'Neha', lastName: 'Patel', email: 'neha@test.com', phone: '+911234567802', role: 'woman' },
    { firstName: 'Ravi', lastName: 'Parent', email: 'ravi.parent@test.com', phone: '+911234567803', role: 'parent' },
    { firstName: 'Sonia', lastName: 'Guardian', email: 'sonia.guardian@test.com', phone: '+911234567804', role: 'guardian' },
    { firstName: 'Amit', lastName: 'Friend', email: 'amit.friend@test.com', phone: '+911234567805', role: 'friend' },
    { firstName: 'Fatima', lastName: 'Ahmed', email: 'fatima@test.com', phone: '+911234567806', role: 'woman' },
    { firstName: 'Jennifer', lastName: 'Wilson', email: 'jennifer@test.com', phone: '+911234567807', role: 'woman' },
    { firstName: 'Samantha', lastName: 'Lee', email: 'samantha@test.com', phone: '+911234567808', role: 'woman' },
    { firstName: 'David', lastName: 'Parent', email: 'david.parent@test.com', phone: '+911234567809', role: 'parent' },
    { firstName: 'Rachel', lastName: 'Guardian', email: 'rachel.guardian@test.com', phone: '+911234567810', role: 'guardian' },
    { firstName: 'Kiran', lastName: 'Friend', email: 'kiran.friend@test.com', phone: '+911234567811', role: 'friend' },
    { firstName: 'Anjali', lastName: 'Mehta', email: 'anjali@test.com', phone: '+911234567812', role: 'woman' },
    { firstName: 'Amanda', lastName: 'Taylor', email: 'amanda@test.com', phone: '+911234567813', role: 'woman' },
    { firstName: 'Sophia', lastName: 'Martinez', email: 'sophia@test.com', phone: '+911234567814', role: 'woman' },
    { firstName: 'Robert', lastName: 'Parent', email: 'robert.parent@test.com', phone: '+911234567815', role: 'parent' },
    { firstName: 'Karen', lastName: 'Guardian', email: 'karen.guardian@test.com', phone: '+911234567816', role: 'guardian' },
    { firstName: 'Vikram', lastName: 'Friend', email: 'vikram.friend@test.com', phone: '+911234567817', role: 'friend' },
    { firstName: 'Pooja', lastName: 'Shah', email: 'pooja@test.com', phone: '+911234567818', role: 'woman' },
    { firstName: 'Olivia', lastName: 'Anderson', email: 'olivia@test.com', phone: '+911234567819', role: 'woman' },
    { firstName: 'Isabella', lastName: 'Thomas', email: 'isabella@test.com', phone: '+911234567820', role: 'woman' }
];

async function seedUsers() {
    let pool;

    try {
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        console.log('✅ Password hashed successfully');

        console.log('📦 Connecting to database...');
        pool = mysql.createPool(DB_CONFIG);

        console.log('🗑️ Clearing existing test users...');
        await pool.query('DELETE FROM users WHERE email LIKE "%test.com"');

        console.log('👥 Inserting test users...');
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const userId = uuidv4();
            const verificationCode = `VFY${String(i + 1).padStart(3, '0')}`;

            await pool.query(
                `INSERT INTO users (id, first_name, last_name, email, phone, password, role, is_verified, is_active, verification_code, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, NOW(), NOW())`,
                [userId, user.firstName, user.lastName, user.email, user.phone, hashedPassword, user.role, verificationCode]
            );

            console.log(`  ✅ Inserted: ${user.email} (${user.role})`);
        }

        console.log('✅ All test users inserted successfully!');
        console.log(`📧 Total users: ${users.length}`);
        console.log(`🔑 Password for all users: ${PASSWORD}`);

        // Verify insertion
        const [rows] = await pool.query('SELECT email, role FROM users WHERE email LIKE "%test.com"');
        console.log(`📊 Verified ${rows.length} users in database`);

    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
    } finally {
        if (pool) {
            await pool.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run if executed directly
seedUsers();

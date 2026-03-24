const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // database: process.env.DB_NAME || 'safety_app',
    database: process.env.DB_NAME || 'safety_app_new',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci'
};

let pool;

// Initialize Database Connection Only
async function initDatabase() {
    try {
        // First connect without database to create it if needed
        const tempConfig = { ...dbConfig, database: undefined };
        const tempPool = mysql.createPool(tempConfig);

        // Create database if it doesn't exist
        await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('Database connected successfully');

        await tempPool.end();

        // Now connect to the database
        pool = mysql.createPool(dbConfig);
        console.log('Database pool created');

        return pool;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

function getPool() {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool;
}

// Get a connection from pool for transactions
async function getConnection() {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool.getConnection();
}

module.exports = {
    initDatabase,
    getPool,
    getConnection,
    dbConfig
};

/**
 * Sugar Shield - Seed Food Products Database
 * 
 * Usage:
 *   node seed-sugar-shield-products.js
 * 
 * This script seeds the Indian food products database for the Sugar Shield feature.
 * It can be run independently to populate or update the food products table.
 */

const { seedFoodProducts } = require('./api/config/seed/sugarShieldProducts');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
    try {
        console.log('🚀 Starting Sugar Shield food products seeding...\n');
        
        const result = await seedFoodProducts();
        
        console.log('\n✅ Seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Inserted: ${result.inserted} products`);
        console.log(`   - Skipped: ${result.skipped} products`);
        console.log(`   - Total in seed file: ${result.total} products`);
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();

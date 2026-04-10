const { getPool } = require('../config/db');

// Seed data for Sugar Shield - Indian Food Products Database
const indianFoodProducts = [
    // ==================== BISCUITS & COOKIES ====================
    {
        barcode: '8901725181013',
        productName: 'Parle-G Original',
        brandName: 'Parle Products',
        category: 'biscuits',
        subcategory: 'glucose',
        sugarPerServing: 9.5,
        sugarPerPack: 19.0,
        servingSize: '4 biscuits (20g)',
        servingWeightGrams: 20,
        totalWeightGrams: 800,
        ingredients: 'Wheat Flour, Sugar, Edible Vegetable Oil, Invert Sugar, Leavening Agents, Salt, Emulsifiers',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['invert sugar'],
        preservatives: ['E282'],
        healthScore: 3,
        calories: 90,
        fatGrams: 2.5,
        proteinGrams: 1.8,
        fiberGrams: 0.5
    },
    {
        barcode: '8901063016345',
        productName: 'Good Day Butter Cookies',
        brandName: 'Britannia',
        category: 'biscuits',
        subcategory: 'cookies',
        sugarPerServing: 8.0,
        sugarPerPack: 16.0,
        servingSize: '4 cookies (25g)',
        servingWeightGrams: 25,
        totalWeightGrams: 600,
        ingredients: 'Enriched Wheat Flour, Sugar, Butter, Edible Vegetable Oil, Invert Syrup, Leavening Agents, Salt, Milk Solids',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['invert syrup'],
        preservatives: [],
        healthScore: 4,
        calories: 120,
        fatGrams: 5.0,
        proteinGrams: 1.5,
        fiberGrams: 0.4
    },
    {
        barcode: '8901063025453',
        productName: 'Bourbon Biscuit',
        brandName: 'Britannia',
        category: 'biscuits',
        subcategory: 'cream',
        sugarPerServing: 11.0,
        sugarPerPack: 22.0,
        servingSize: '4 biscuits (22g)',
        servingWeightGrams: 22,
        totalWeightGrams: 300,
        ingredients: 'Wheat Flour, Sugar, Edible Vegetable Oil, Cocoa Solids, Dextrose, Leavening Agents, Salt, Emulsifiers, Artificial Flavors',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['dextrose'],
        preservatives: [],
        healthScore: 2,
        calories: 105,
        fatGrams: 4.5,
        proteinGrams: 1.6,
        fiberGrams: 0.8
    },
    {
        barcode: '8906007990019',
        productName: 'Dark Fantasy Chocolate Cookies',
        brandName: 'ITC',
        category: 'biscuits',
        subcategory: 'cookies',
        sugarPerServing: 10.5,
        sugarPerPack: 21.0,
        servingSize: '3 cookies (25g)',
        servingWeightGrams: 25,
        totalWeightGrams: 300,
        ingredients: 'Wheat Flour, Sugar, Edible Vegetable Oil, Cocoa Solids, Dextrose Syrup, Milk Solids, Leavening Agents, Salt',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['dextrose syrup'],
        preservatives: [],
        healthScore: 3,
        calories: 115,
        fatGrams: 5.5,
        proteinGrams: 1.8,
        fiberGrams: 1.0
    },

    // ==================== SNACKS & NAMKEEN ====================
    {
        barcode: '8901725182010',
        productName: 'Kurkure Masala Munch',
        brandName: 'PepsiCo',
        category: 'snacks',
        subcategory: 'namkeen',
        sugarPerServing: 2.5,
        sugarPerPack: 6.25,
        servingSize: '1 pack (25g)',
        servingWeightGrams: 25,
        totalWeightGrams: 75,
        ingredients: 'Rice Meal, Corn Meal, Gram Meal, Edible Vegetable Oil, Sugar, Salt, Spices & Condiments, Food Flavors',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['sugar'],
        preservatives: [],
        healthScore: 4,
        calories: 130,
        fatGrams: 7.0,
        proteinGrams: 1.5,
        fiberGrams: 0.8
    },
    {
        barcode: '8906017690024',
        productName: 'Haldiram Aloo Bhujia',
        brandName: 'Haldiram',
        category: 'snacks',
        subcategory: 'namkeen',
        sugarPerServing: 1.5,
        sugarPerPack: 3.75,
        servingSize: '1 serving (25g)',
        servingWeightGrams: 25,
        totalWeightGrams: 400,
        ingredients: 'Gram Flour, Edible Vegetable Oil, Aloo (Potato), Salt, Spices & Condiments, Sugar, Citric Acid',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['sugar'],
        preservatives: ['E330'],
        healthScore: 5,
        calories: 140,
        fatGrams: 8.0,
        proteinGrams: 3.5,
        fiberGrams: 2.0
    },
    {
        barcode: '8906017690109',
        productName: 'Haldiram Moong Dal',
        brandName: 'Haldiram',
        category: 'snacks',
        subcategory: 'namkeen',
        sugarPerServing: 1.0,
        sugarPerPack: 2.5,
        servingSize: '1 serving (25g)',
        servingWeightGrams: 25,
        totalWeightGrams: 400,
        ingredients: 'Moong Dal, Edible Vegetable Oil, Salt, Spices, Sugar, Citric Acid',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: ['E330'],
        healthScore: 6,
        calories: 130,
        fatGrams: 7.5,
        proteinGrams: 5.0,
        fiberGrams: 3.0
    },

    // ==================== INSTANT NOODLES ====================
    {
        barcode: '8901725181112',
        productName: 'Maggi 2-Minute Noodles',
        brandName: 'Nestle',
        category: 'instant',
        subcategory: 'noodles',
        sugarPerServing: 2.7,
        sugarPerPack: 2.7,
        servingSize: '1 pack (70g)',
        servingWeightGrams: 70,
        totalWeightGrams: 70,
        ingredients: 'Wheat Flour, Palm Oil, Salt, Sugar, Spices, Flavour Enhancers, Acidity Regulators',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['sugar'],
        preservatives: [],
        healthScore: 4,
        sodiumMg: 850,
        calories: 310,
        fatGrams: 12.0,
        proteinGrams: 8.0,
        fiberGrams: 2.5
    },

    // ==================== BEVERAGES ====================
    {
        barcode: '8901725181211',
        productName: 'Coca-Cola',
        brandName: 'Coca-Cola',
        category: 'beverages',
        subcategory: 'soft_drinks',
        sugarPerServing: 10.6,
        sugarPerPack: 26.5,
        servingSize: '250ml',
        servingWeightGrams: 250,
        totalWeightGrams: 250,
        ingredients: 'Carbonated Water, Sugar, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: ['E211'],
        healthScore: 1,
        caffeineMg: 32,
        calories: 106,
        fatGrams: 0,
        proteinGrams: 0,
        fiberGrams: 0
    },
    {
        barcode: '8901725181310',
        productName: 'Thums Up',
        brandName: 'Coca-Cola',
        category: 'beverages',
        subcategory: 'soft_drinks',
        sugarPerServing: 10.8,
        sugarPerPack: 27.0,
        servingSize: '250ml',
        servingWeightGrams: 250,
        totalWeightGrams: 250,
        ingredients: 'Carbonated Water, Sugar, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: ['E211'],
        healthScore: 1,
        caffeineMg: 38,
        calories: 108,
        fatGrams: 0,
        proteinGrams: 0,
        fiberGrams: 0
    },
    {
        barcode: '8901725181419',
        productName: 'Maaza Mango Drink',
        brandName: 'Coca-Cola',
        category: 'beverages',
        subcategory: 'juice',
        sugarPerServing: 12.0,
        sugarPerPack: 24.0,
        servingSize: '200ml',
        servingWeightGrams: 200,
        totalWeightGrams: 500,
        ingredients: 'Water, Sugar, Mango Pulp (20%), Acidity Regulators, Stabilizers, Artificial Flavors, Colors',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: ['E202'],
        healthScore: 3,
        caffeineMg: 0,
        calories: 96,
        fatGrams: 0,
        proteinGrams: 0.2,
        fiberGrams: 0.3
    },
    {
        barcode: '8901725181518',
        productName: 'Red Bull Energy Drink',
        brandName: 'Red Bull',
        category: 'beverages',
        subcategory: 'energy',
        sugarPerServing: 11.0,
        sugarPerPack: 27.5,
        servingSize: '250ml',
        servingWeightGrams: 250,
        totalWeightGrams: 250,
        ingredients: 'Water, Sucrose, Glucose, Citric Acid, Taurine, Sodium Bicarbonate, Magnesium Carbonate, Caffeine, Niacinamide, Calcium Pantothenate, Pyridoxine HCl, Cyanocobalamin, Artificial Flavors, Colors',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['sucrose', 'glucose'],
        preservatives: [],
        healthScore: 1,
        caffeineMg: 80,
        calories: 110,
        fatGrams: 0,
        proteinGrams: 0,
        fiberGrams: 0
    },

    // ==================== DAIRY PRODUCTS ====================
    {
        barcode: '8901725181617',
        productName: 'Amul Masti Dahi',
        brandName: 'Amul',
        category: 'dairy',
        subcategory: 'yogurt',
        sugarPerServing: 5.5,
        sugarPerPack: 11.0,
        servingSize: '200g',
        servingWeightGrams: 200,
        totalWeightGrams: 200,
        ingredients: 'Pasteurized Milk, Sugar, Lactic Culture, Stabilizers',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 6,
        caffeineMg: 0,
        calories: 75,
        fatGrams: 3.0,
        proteinGrams: 3.5,
        fiberGrams: 0
    },
    {
        barcode: '8901725181716',
        productName: 'Epigamia Greek Yogurt',
        brandName: 'Epigamia',
        category: 'dairy',
        subcategory: 'yogurt',
        sugarPerServing: 8.0,
        sugarPerPack: 10.0,
        servingSize: '125g',
        servingWeightGrams: 125,
        totalWeightGrams: 125,
        ingredients: 'Pasteurized Milk, Sugar, Live Yogurt Cultures, Stabilizers, Natural Flavors',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 5,
        caffeineMg: 0,
        calories: 90,
        fatGrams: 4.0,
        proteinGrams: 5.0,
        fiberGrams: 0.5
    },

    // ==================== BREAKFAST CEREALS ====================
    {
        barcode: '8901725181815',
        productName: 'Kellogg\'s Corn Flakes',
        brandName: 'Kellogg\'s',
        category: 'breakfast',
        subcategory: 'cereal',
        sugarPerServing: 8.0,
        sugarPerPack: 24.0,
        servingSize: '30g',
        servingWeightGrams: 30,
        totalWeightGrams: 300,
        ingredients: 'Corn, Sugar, Salt, Malt Extract, Vitamins & Minerals, BHT Preservative',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['malt extract'],
        preservatives: ['E321'],
        healthScore: 4,
        caffeineMg: 0,
        calories: 110,
        fatGrams: 0.5,
        proteinGrams: 2.0,
        fiberGrams: 1.0
    },
    {
        barcode: '8901725181914',
        productName: 'Nestle Koko Krunch',
        brandName: 'Nestle',
        category: 'breakfast',
        subcategory: 'cereal',
        sugarPerServing: 10.5,
        sugarPerPack: 31.5,
        servingSize: '30g',
        servingWeightGrams: 30,
        totalWeightGrams: 300,
        ingredients: 'Whole Grain Wheat, Sugar, Rice Flour, Cocoa Solids, Salt, Vitamins & Minerals, Natural Flavor',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 3,
        caffeineMg: 5,
        calories: 120,
        fatGrams: 1.0,
        proteinGrams: 2.5,
        fiberGrams: 2.0
    },

    // ==================== BREAD & BAKERY ====================
    {
        barcode: '8901725182010',
        productName: 'Britannia White Bread',
        brandName: 'Britannia',
        category: 'bakery',
        subcategory: 'bread',
        sugarPerServing: 2.5,
        sugarPerPack: 10.0,
        servingSize: '1 slice (40g)',
        servingWeightGrams: 40,
        totalWeightGrams: 400,
        ingredients: 'Wheat Flour, Water, Sugar, Yeast, Salt, Dough Conditioners, Preservatives, Emulsifiers',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: ['E282'],
        healthScore: 5,
        caffeineMg: 0,
        calories: 100,
        fatGrams: 1.5,
        proteinGrams: 3.5,
        fiberGrams: 1.0
    },

    // ==================== SAUCES & CONDIMENTS ====================
    {
        barcode: '8901725182119',
        productName: 'Kissan Mixed Fruit Jam',
        brandName: 'Kissan',
        category: 'condiments',
        subcategory: 'jam',
        sugarPerServing: 12.0,
        sugarPerPack: 18.0,
        servingSize: '15g',
        servingWeightGrams: 15,
        totalWeightGrams: 225,
        ingredients: 'Sugar, Fruit Pulp (Apple, Pineapple, Orange, Mango, Grapes), Acidity Regulators, Pectin, Preservatives, Colors',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: ['E202', 'E211'],
        healthScore: 2,
        caffeineMg: 0,
        calories: 45,
        fatGrams: 0,
        proteinGrams: 0,
        fiberGrams: 0.3
    },
    {
        barcode: '8901725182218',
        productName: 'Maggi Tomato Ketchup',
        brandName: 'Nestle',
        category: 'condiments',
        subcategory: 'ketchup',
        sugarPerServing: 4.0,
        sugarPerPack: 8.0,
        servingSize: '20g',
        servingWeightGrams: 20,
        totalWeightGrams: 400,
        ingredients: 'Tomato Puree, Sugar, Vinegar, Salt, Spices, Stabilizers, Preservatives',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: ['E211'],
        healthScore: 3,
        sodiumMg: 180,
        caffeineMg: 0,
        calories: 30,
        fatGrams: 0,
        proteinGrams: 0.5,
        fiberGrams: 0.5
    },

    // ==================== HEALTHY ALTERNATIVES ====================
    {
        barcode: '8901725182317',
        productName: 'Roasted Makhana',
        brandName: 'Healthy Alternatives',
        category: 'snacks',
        subcategory: 'healthy',
        sugarPerServing: 0.5,
        sugarPerPack: 1.5,
        servingSize: '30g',
        servingWeightGrams: 30,
        totalWeightGrams: 100,
        ingredients: 'Fox Nuts (Makhana), Edible Vegetable Oil, Salt, Spices',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 9,
        caffeineMg: 0,
        calories: 105,
        fatGrams: 2.0,
        proteinGrams: 4.5,
        fiberGrams: 3.0
    },
    {
        barcode: '8901725182416',
        productName: 'Roasted Chana',
        brandName: 'Protein Snack',
        category: 'snacks',
        subcategory: 'healthy',
        sugarPerServing: 0.3,
        sugarPerPack: 0.9,
        servingSize: '30g',
        servingWeightGrams: 30,
        totalWeightGrams: 150,
        ingredients: 'Roasted Bengal Gram (Chana), Salt, Spices',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 9,
        caffeineMg: 0,
        calories: 110,
        fatGrams: 2.5,
        proteinGrams: 7.0,
        fiberGrams: 5.0
    },
    {
        barcode: '8901725182515',
        productName: 'Mixed Nuts & Seeds',
        brandName: 'Natural',
        category: 'snacks',
        subcategory: 'healthy',
        sugarPerServing: 1.0,
        sugarPerPack: 2.5,
        servingSize: '25g',
        servingWeightGrams: 25,
        totalWeightGrams: 100,
        ingredients: 'Almonds, Cashews, Pumpkin Seeds, Sunflower Seeds, Raisins (2%)',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 8,
        caffeineMg: 0,
        calories: 145,
        fatGrams: 11.0,
        proteinGrams: 5.0,
        fiberGrams: 2.5
    },
    {
        barcode: '8901725182614',
        productName: 'Millet Cookies',
        brandName: 'Slurrp Farm',
        category: 'biscuits',
        subcategory: 'healthy',
        sugarPerServing: 4.0,
        sugarPerPack: 8.0,
        servingSize: '20g',
        servingWeightGrams: 20,
        totalWeightGrams: 200,
        ingredients: 'Whole Grain Millet Flour, Jaggery, Edible Vegetable Oil, Cocoa Solids, Leavening Agents, Salt',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 7,
        caffeineMg: 0,
        calories: 90,
        fatGrams: 3.5,
        proteinGrams: 2.0,
        fiberGrams: 2.0
    },

    // ==================== CHOCOLATES ====================
    {
        barcode: '8901725182713',
        productName: 'Dairy Milk Chocolate',
        brandName: 'Cadbury',
        category: 'confectionery',
        subcategory: 'chocolate',
        sugarPerServing: 14.0,
        sugarPerPack: 28.0,
        servingSize: '20g',
        servingWeightGrams: 20,
        totalWeightGrams: 40,
        ingredients: 'Sugar, Milk Solids, Cocoa Butter, Cocoa Mass, Vegetable Fats, Emulsifiers, Artificial Flavors',
        hiddenSugarFlag: false,
        hiddenSugarIngredients: [],
        preservatives: [],
        healthScore: 2,
        caffeineMg: 5,
        calories: 105,
        fatGrams: 6.0,
        proteinGrams: 1.5,
        fiberGrams: 0.5
    },
    {
        barcode: '8901725182812',
        productName: '5 Star Chocolate',
        brandName: 'Cadbury',
        category: 'confectionery',
        subcategory: 'chocolate',
        sugarPerServing: 15.5,
        sugarPerPack: 31.0,
        servingSize: '20g',
        servingWeightGrams: 20,
        totalWeightGrams: 40,
        ingredients: 'Sugar, Glucose Syrup, Milk Solids, Cocoa Butter, Cocoa Mass, Vegetable Fats, Emulsifiers, Artificial Flavors',
        hiddenSugarFlag: true,
        hiddenSugarIngredients: ['glucose syrup'],
        preservatives: [],
        healthScore: 1,
        caffeineMg: 5,
        calories: 110,
        fatGrams: 6.5,
        proteinGrams: 1.0,
        fiberGrams: 0.3
    }
];

// Function to seed food products
async function seedFoodProducts() {
    const pool = getPool();

    try {
        console.log('🍪 Seeding Sugar Shield food products database...');

        let inserted = 0;
        let skipped = 0;

        for (const product of indianFoodProducts) {
            try {
                // Check if product already exists
                const [existing] = await pool.query(
                    'SELECT id FROM food_products WHERE barcode = ?',
                    [product.barcode]
                );

                if (existing.length > 0) {
                    console.log(`⏭️  Skipped: ${product.productName} (already exists)`);
                    skipped++;
                    continue;
                }

                // Insert product
                await pool.query(
                    `INSERT INTO food_products (
                        barcode, product_name, brand_name, category, subcategory,
                        sugar_per_serving, sugar_per_pack, serving_size, serving_weight_grams,
                        total_weight_grams, ingredients, hidden_sugar_flag, hidden_sugar_ingredients,
                        preservatives, health_score, caffeine_mg, sodium_mg, fat_grams,
                        protein_grams, fiber_grams, calories, image_url, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        product.barcode, product.productName, product.brandName,
                        product.category, product.subcategory,
                        product.sugarPerServing, product.sugarPerPack,
                        product.servingSize, product.servingWeightGrams, product.totalWeightGrams,
                        product.ingredients, product.hiddenSugarFlag,
                        product.hiddenSugarIngredients ? JSON.stringify(product.hiddenSugarIngredients) : null,
                        product.preservatives ? JSON.stringify(product.preservatives) : null,
                        product.healthScore, product.caffeineMg || null, product.sodiumMg || null,
                        product.fatGrams || null, product.proteinGrams || null,
                        product.fiberGrams || null, product.calories || null,
                        product.imageUrl || null, true
                    ]
                );

                console.log(`✅ Inserted: ${product.productName} (${product.brandName})`);
                inserted++;
            } catch (error) {
                console.error(`❌ Error inserting ${product.productName}:`, error.message);
            }
        }

        console.log(`\n🎉 Seeding complete!`);
        console.log(`✅ Inserted: ${inserted} products`);
        console.log(`⏭️  Skipped: ${skipped} products`);
        console.log(`📊 Total products in seed: ${indianFoodProducts.length}`);

        return { inserted, skipped, total: indianFoodProducts.length };
    } catch (error) {
        console.error('❌ Error seeding food products:', error);
        throw error;
    }
}

module.exports = {
    seedFoodProducts,
    indianFoodProducts
};

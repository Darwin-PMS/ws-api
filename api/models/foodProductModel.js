const { getPool } = require('../config/db');

// Food Product Model - handles all food product database operations
const foodProductModel = {
    // Find product by barcode
    async findByBarcode(barcode) {
        const pool = getPool();
        const [products] = await pool.query(
            'SELECT * FROM food_products WHERE barcode = ? AND is_active = TRUE',
            [barcode]
        );
        return products[0] || null;
    },

    // Find product by ID
    async findById(id) {
        const pool = getPool();
        const [products] = await pool.query(
            'SELECT * FROM food_products WHERE id = ? AND is_active = TRUE',
            [id]
        );
        return products[0] || null;
    },

    // Search products by name or brand
    async search(query, options = {}) {
        const pool = getPool();
        const { limit = 20, offset = 0, category, brand } = options;
        
        let sql = 'SELECT * FROM food_products WHERE is_active = TRUE';
        const params = [];
        
        if (query) {
            sql += ' AND (product_name LIKE ? OR brand_name LIKE ? OR ingredients LIKE ?)';
            const searchParam = `%${query}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        
        if (brand) {
            sql += ' AND brand_name = ?';
            params.push(brand);
        }
        
        sql += ' ORDER BY health_score ASC, product_name ASC LIMIT ? OFFSET ?';
        
        const [products] = await pool.query(sql, [...params, parseInt(limit), parseInt(offset)]);
        return products;
    },

    // Get products by category
    async getByCategory(category, options = {}) {
        const pool = getPool();
        const { limit = 20, offset = 0, sortBy = 'health_score' } = options;
        
        let sql = 'SELECT * FROM food_products WHERE category = ? AND is_active = TRUE';
        const params = [category];
        
        const allowedSorts = ['health_score', 'sugar_per_pack', 'product_name', 'brand_name'];
        const orderBy = allowedSorts.includes(sortBy) ? sortBy : 'health_score';
        
        sql += ` ORDER BY ${orderBy} ASC LIMIT ? OFFSET ?`;
        
        const [products] = await pool.query(sql, [...params, parseInt(limit), parseInt(offset)]);
        return products;
    },

    // Get products by brand
    async getByBrand(brandName, options = {}) {
        const pool = getPool();
        const { limit = 20, offset = 0 } = options;
        
        const [products] = await pool.query(
            'SELECT * FROM food_products WHERE brand_name = ? AND is_active = TRUE ORDER BY health_score ASC, product_name ASC LIMIT ? OFFSET ?',
            [brandName, parseInt(limit), parseInt(offset)]
        );
        return products;
    },

    // Get high sugar products (above threshold)
    async getHighSugarProducts(threshold = 15, options = {}) {
        const pool = getPool();
        const { limit = 50, offset = 0 } = options;
        
        const [products] = await pool.query(
            'SELECT * FROM food_products WHERE sugar_per_pack > ? AND is_active = TRUE ORDER BY sugar_per_pack DESC LIMIT ? OFFSET ?',
            [threshold, parseInt(limit), parseInt(offset)]
        );
        return products;
    },

    // Get products with hidden Sugar
    async getHiddenSugarProducts(options = {}) {
        const pool = getPool();
        const { limit = 50, offset = 0, category } = options;
        
        let sql = 'SELECT * FROM food_products WHERE hidden_sugar_flag = TRUE AND is_active = TRUE';
        const params = [];
        
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        
        sql += ' ORDER BY sugar_per_pack DESC LIMIT ? OFFSET ?';
        
        const [products] = await pool.query(sql, [...params, parseInt(limit), parseInt(offset)]);
        return products;
    },

    // Create new product
    async create(productData) {
        const pool = getPool();
        const {
            barcode, productName, brandName, category, subcategory,
            sugarPerServing, sugarPerPack, servingSize, servingWeightGrams,
            totalWeightGrams, ingredients, hiddenSugarFlag, hiddenSugarIngredients,
            preservatives, healthScore, caffeineMg, sodiumMg, fatGrams,
            proteinGrams, fiberGrams, calories, imageUrl
        } = productData;

        const [result] = await pool.query(
            `INSERT INTO food_products (
                barcode, product_name, brand_name, category, subcategory,
                sugar_per_serving, sugar_per_pack, serving_size, serving_weight_grams,
                total_weight_grams, ingredients, hidden_sugar_flag, hidden_sugar_ingredients,
                preservatives, health_score, caffeine_mg, sodium_mg, fat_grams,
                protein_grams, fiber_grams, calories, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                barcode, productName, brandName, category, subcategory,
                sugarPerServing, sugarPerPack, servingSize, servingWeightGrams,
                totalWeightGrams, ingredients, hiddenSugarFlag || false, 
                hiddenSugarIngredients ? JSON.stringify(hiddenSugarIngredients) : null,
                preservatives ? JSON.stringify(preservatives) : null,
                healthScore || 5, caffeineMg, sodiumMg, fatGrams,
                proteinGrams, fiberGrams, calories, imageUrl
            ]
        );

        return result.insertId;
    },

    // Update product
    async update(id, productData) {
        const pool = getPool();
        const {
            productName, brandName, category, subcategory,
            sugarPerServing, sugarPerPack, servingSize, servingWeightGrams,
            totalWeightGrams, ingredients, hiddenSugarFlag, hiddenSugarIngredients,
            preservatives, healthScore, caffeineMg, sodiumMg, fatGrams,
            proteinGrams, fiberGrams, calories, imageUrl, isActive
        } = productData;

        const updates = [];
        const params = [];

        if (productName !== undefined) {
            updates.push('product_name = ?');
            params.push(productName);
        }
        if (brandName !== undefined) {
            updates.push('brand_name = ?');
            params.push(brandName);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category);
        }
        if (subcategory !== undefined) {
            updates.push('subcategory = ?');
            params.push(subcategory);
        }
        if (sugarPerServing !== undefined) {
            updates.push('sugar_per_serving = ?');
            params.push(sugarPerServing);
        }
        if (sugarPerPack !== undefined) {
            updates.push('sugar_per_pack = ?');
            params.push(sugarPerPack);
        }
        if (servingSize !== undefined) {
            updates.push('serving_size = ?');
            params.push(servingSize);
        }
        if (servingWeightGrams !== undefined) {
            updates.push('serving_weight_grams = ?');
            params.push(servingWeightGrams);
        }
        if (totalWeightGrams !== undefined) {
            updates.push('total_weight_grams = ?');
            params.push(totalWeightGrams);
        }
        if (ingredients !== undefined) {
            updates.push('ingredients = ?');
            params.push(ingredients);
        }
        if (hiddenSugarFlag !== undefined) {
            updates.push('hidden_sugar_flag = ?');
            params.push(hiddenSugarFlag);
        }
        if (hiddenSugarIngredients !== undefined) {
            updates.push('hidden_sugar_ingredients = ?');
            params.push(JSON.stringify(hiddenSugarIngredients));
        }
        if (preservatives !== undefined) {
            updates.push('preservatives = ?');
            params.push(JSON.stringify(preservatives));
        }
        if (healthScore !== undefined) {
            updates.push('health_score = ?');
            params.push(healthScore);
        }
        if (caffeineMg !== undefined) {
            updates.push('caffeine_mg = ?');
            params.push(caffeineMg);
        }
        if (sodiumMg !== undefined) {
            updates.push('sodium_mg = ?');
            params.push(sodiumMg);
        }
        if (fatGrams !== undefined) {
            updates.push('fat_grams = ?');
            params.push(fatGrams);
        }
        if (proteinGrams !== undefined) {
            updates.push('protein_grams = ?');
            params.push(proteinGrams);
        }
        if (fiberGrams !== undefined) {
            updates.push('fiber_grams = ?');
            params.push(fiberGrams);
        }
        if (calories !== undefined) {
            updates.push('calories = ?');
            params.push(calories);
        }
        if (imageUrl !== undefined) {
            updates.push('image_url = ?');
            params.push(imageUrl);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(isActive);
        }

        if (updates.length === 0) return false;

        params.push(id);
        await pool.query(
            `UPDATE food_products SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        return true;
    },

    // Delete product (soft delete)
    async softDelete(id) {
        const pool = getPool();
        await pool.query(
            'UPDATE food_products SET is_active = FALSE WHERE id = ?',
            [id]
        );
        return true;
    },

    // Get all categories
    async getCategories() {
        const pool = getPool();
        const [categories] = await pool.query(
            'SELECT DISTINCT category FROM food_products WHERE is_active = TRUE AND category IS NOT NULL ORDER BY category'
        );
        return categories.map(c => c.category);
    },

    // Get all brands
    async getBrands() {
        const pool = getPool();
        const [brands] = await pool.query(
            'SELECT DISTINCT brand_name FROM food_products WHERE is_active = TRUE AND brand_name IS NOT NULL ORDER BY brand_name'
        );
        return brands.map(b => b.brand_name);
    },

    // Get product statistics
    async getStatistics() {
        const pool = getPool();
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN hidden_sugar_flag = TRUE THEN 1 END) as hidden_sugar_products,
                AVG(sugar_per_pack) as avg_sugar_per_pack,
                AVG(health_score) as avg_health_score,
                COUNT(DISTINCT category) as total_categories,
                COUNT(DISTINCT brand_name) as total_brands
            FROM food_products 
            WHERE is_active = TRUE
        `);
        return stats[0];
    }
};

module.exports = foodProductModel;

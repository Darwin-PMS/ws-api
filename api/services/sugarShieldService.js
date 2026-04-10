const foodProductModel = require('../models/foodProductModel');
const userHealthProfileModel = require('../models/userHealthProfileModel');
const sugarScanLogModel = require('../models/sugarScanLogModel');
const dailySugarTrackerModel = require('../models/dailySugarTrackerModel');

// Hidden sugar ingredients list (Indian food industry)
const HIDDEN_SUGAR_INGREDIENTS = [
    'maltodextrin',
    'glucose syrup',
    'fructose',
    'dextrose',
    'corn syrup',
    'invert sugar',
    'jaggery solids',
    'liquid glucose',
    'high fructose corn syrup',
    'golden syrup',
    'agave nectar',
    'cane juice',
    'evaporated cane juice',
    'rice syrup',
    'brown rice syrup',
    'malt syrup',
    'barley malt',
    'fruit juice concentrate',
    'sucrose',
    'crystalline fructose',
    'sucrose phosphate',
    'treacle',
    'molasses',
    'raw sugar',
    'turbinado sugar',
    'muscovado',
    'panela',
    'piloncillo',
    'kokuto',
    'washing soda'
];

// Sugar Shield Service - Business logic for sugar analysis and recommendations
const sugarShieldService = {
    /**
     * Analyze product for sugar content and hidden sugars
     */
    analyzeProduct(product, userHealthProfile = null) {
        const analysis = {
            product: {
                id: product.id,
                name: product.product_name,
                brand: product.brand_name,
                category: product.category,
                barcode: product.barcode
            },
            sugar: {
                perServing: product.sugar_per_serving,
                perPack: product.sugar_per_pack,
                teaspoonsPerServing: this.gramsToTeaspoons(product.sugar_per_serving),
                teaspoonsPerPack: this.gramsToTeaspoons(product.sugar_per_pack),
                servingSize: product.serving_size,
                servingWeightGrams: product.serving_weight_grams
            },
            healthScore: product.health_score,
            hiddenSugar: {
                detected: product.hidden_sugar_flag,
                ingredients: product.hidden_sugar_ingredients ? JSON.parse(product.hidden_sugar_ingredients) : [],
                warning: null
            },
            alerts: [],
            recommendations: []
        };

        // Check for hidden sugars in ingredients
        if (product.ingredients) {
            const detectedHiddenSugars = this.detectHiddenSugars(product.ingredients);
            if (detectedHiddenSugars.length > 0 && !product.hidden_sugar_flag) {
                analysis.hiddenSugar.detected = true;
                analysis.hiddenSugar.ingredients = detectedHiddenSugars;
            }
        }

        // Generate warnings based on sugar content
        if (product.sugar_per_pack > 20) {
            analysis.alerts.push({
                type: 'high_sugar',
                severity: 'high',
                message: `🚨 Very High Sugar: ${analysis.sugar.teaspoonsPerPack.toFixed(1)} teaspoons per pack`
            });
        } else if (product.sugar_per_pack > 10) {
            analysis.alerts.push({
                type: 'moderate_sugar',
                severity: 'medium',
                message: `⚠️ Moderate Sugar: ${analysis.sugar.teaspoonsPerPack.toFixed(1)} teaspoons per pack`
            });
        }

        if (analysis.hiddenSugar.detected) {
            analysis.hiddenSugar.warning = `⚠️ Hidden sugar found in savory product: ${analysis.hiddenSugar.ingredients.join(', ')}`;
            analysis.alerts.push({
                type: 'hidden_sugar',
                severity: 'high',
                message: analysis.hiddenSugar.warning
            });
        }

        // Check caffeine content
        if (product.caffeine_mg && product.caffeine_mg > 100) {
            analysis.alerts.push({
                type: 'high_caffeine',
                severity: 'medium',
                message: `☕ High Caffeine: ${product.caffeine_mg}mg`
            });
        }

        // Add health profile specific alerts
        if (userHealthProfile) {
            const healthAlerts = this.generateHealthAlerts(userHealthProfile, analysis);
            analysis.alerts.push(...healthAlerts);
        }

        return analysis;
    },

    /**
     * Convert grams to teaspoons (1 teaspoon = 4 grams)
     */
    gramsToTeaspoons(grams) {
        if (!grams || grams === null) return 0;
        return parseFloat(grams) / 4;
    },

    /**
     * Convert teaspoons to grams
     */
    teaspoonsToGrams(teaspoons) {
        if (!teaspoons || teaspoons === null) return 0;
        return parseFloat(teaspoons) * 4;
    },

    /**
     * Detect hidden sugars in ingredients list
     */
    detectHiddenSugars(ingredients) {
        if (!ingredients) return [];

        const ingredientsLower = ingredients.toLowerCase();
        const detectedSugars = [];

        for (const sugarIngredient of HIDDEN_SUGAR_INGREDIENTS) {
            if (ingredientsLower.includes(sugarIngredient.toLowerCase())) {
                detectedSugars.push(sugarIngredient);
            }
        }

        return detectedSugars;
    },

    /**
     * Generate health-specific alerts based on user profile
     */
    generateHealthAlerts(userProfile, productAnalysis) {
        const alerts = [];

        if (userProfile.has_diabetes) {
            if (productAnalysis.sugar.perPack > 15) {
                alerts.push({
                    type: 'diabetes_warning',
                    severity: 'critical',
                    message: userProfile.diabetes_type === 'gestational'
                        ? '🚨 High sugar not recommended during gestational diabetes'
                        : '🚨 High sugar - Dangerous for diabetes management'
                });
            }
        }

        if (userProfile.has_pcos) {
            if (productAnalysis.sugar.perPack > 10) {
                alerts.push({
                    type: 'pcos_warning',
                    severity: 'high',
                    message: '⚠️ High sugar can worsen PCOS symptoms. Avoid frequent consumption.'
                });
            }
        }

        if (userProfile.pregnancy_mode) {
            if (productAnalysis.sugar.perPack > 10) {
                alerts.push({
                    type: 'pregnancy_warning',
                    severity: 'high',
                    message: '🤰 Not recommended during pregnancy - High sugar content'
                });
            }
            if (productAnalysis.product && productAnalysis.product.caffeine_mg > 50) {
                alerts.push({
                    type: 'pregnancy_caffeine',
                    severity: 'high',
                    message: '🤰 High caffeine not recommended during pregnancy'
                });
            }
        }

        if (userProfile.thyroid) {
            if (productAnalysis.sugar.perPack > 10) {
                alerts.push({
                    type: 'thyroid_warning',
                    severity: 'medium',
                    message: '⚠️ Monitor sugar intake - Thyroid condition detected'
                });
            }
        }

        if (userProfile.breastfeeding) {
            if (productAnalysis.product && productAnalysis.product.caffeine_mg > 100) {
                alerts.push({
                    type: 'breastfeeding_caffeine',
                    severity: 'medium',
                    message: '🍼 High caffeine can affect baby during breastfeeding'
                });
            }
        }

        // Check for child safety
        if (userProfile.child_age_range) {
            if (productAnalysis.sugar.perPack > 15) {
                alerts.push({
                    type: 'child_warning',
                    severity: 'high',
                    message: '⚠️ Excess sugar for kids. Not recommended for children.'
                });
            }
        }

        return alerts;
    },

    /**
     * Get healthy alternatives for a product
     */
    async getAlternatives(productId, category, healthScore) {
        const alternatives = [];

        // Find products in same category with better health score
        const betterProducts = await foodProductModel.search(null, {
            category: category,
            limit: 10
        });

        for (const product of betterProducts) {
            if (product.id !== productId && product.health_score < healthScore) {
                alternatives.push({
                    id: product.id,
                    name: product.product_name,
                    brand: product.brand_name,
                    healthScore: product.health_score,
                    sugarPerPack: product.sugar_per_pack,
                    teaspoonsPerPack: this.gramsToTeaspoons(product.sugar_per_pack),
                    reason: this.getAlternativeReason(product, healthScore)
                });
            }
        }

        // If not enough alternatives, suggest generic healthy options
        if (alternatives.length < 3) {
            const healthySuggestions = this.getHealthySuggestions(category);
            for (const suggestion of healthySuggestions) {
                if (alternatives.length >= 5) break;
                alternatives.push(suggestion);
            }
        }

        return alternatives.slice(0, 5);
    },

    /**
     * Get reason for alternative recommendation
     */
    getAlternativeReason(alternativeProduct, originalHealthScore) {
        const reasons = [];

        if (alternativeProduct.health_score < originalHealthScore) {
            reasons.push(`Better health score (${alternativeProduct.health_score}/10)`);
        }

        if (alternativeProduct.sugar_per_pack < 10) {
            reasons.push('Low sugar content');
        }

        if (!alternativeProduct.hidden_sugar_flag) {
            reasons.push('No hidden sugars detected');
        }

        return reasons.length > 0 ? reasons.join(', ') : 'Healthier option';
    },

    /**
     * Get healthy suggestions based on category
     */
    getHealthySuggestions(category) {
        const suggestions = {
            'biscuits': [
                { name: 'Millet Cookies', brand: 'Healthy Alternatives', healthScore: 8, reason: 'Low sugar, high fiber' },
                { name: 'Roasted Makhana', brand: 'Fox Nuts', healthScore: 9, reason: 'Protein-rich, low sugar snack' },
                { name: 'Oats Cookies', brand: 'Healthy Choice', healthScore: 7, reason: 'Whole grain, moderate sugar' }
            ],
            'snacks': [
                { name: 'Roasted Chana', brand: 'Protein Snack', healthScore: 9, reason: 'High protein, no added sugar' },
                { name: 'Mixed Nuts', brand: 'Natural', healthScore: 8, reason: 'Healthy fats, no sugar' },
                { name: 'Murmura Mix', brand: 'Light Snack', healthScore: 7, reason: 'Low calorie, light snack' }
            ],
            'beverages': [
                { name: 'Fresh Fruit Juice', brand: 'Natural', healthScore: 7, reason: 'Natural sugars only' },
                { name: 'Coconut Water', brand: 'Natural Hydration', healthScore: 9, reason: 'Electrolytes, no added sugar' },
                { name: 'Herbal Tea', brand: 'Caffeine Free', healthScore: 9, reason: 'No sugar, no caffeine' }
            ],
            'breakfast': [
                { name: 'Oats Porridge', brand: 'Healthy Start', healthScore: 8, reason: 'High fiber, low sugar' },
                { name: 'Whole Wheat Bread', brand: 'Whole Grain', healthScore: 7, reason: 'Complex carbs, minimal sugar' },
                { name: 'Sprouts', brand: 'Natural Protein', healthScore: 9, reason: 'High protein, zero sugar' }
            ],
            'dairy': [
                { name: 'Plain Yogurt', brand: 'Natural Dairy', healthScore: 8, reason: 'Probiotics, no added sugar' },
                { name: 'Buttermilk', brand: 'Traditional', healthScore: 9, reason: 'Low calorie, no sugar' },
                { name: 'Paneer', brand: 'Fresh Dairy', healthScore: 8, reason: 'High protein, zero sugar' }
            ]
        };

        return suggestions[category] || [
            { name: 'Fresh Fruits', brand: 'Natural', healthScore: 9, reason: 'Natural sugars, fiber-rich' },
            { name: 'Nuts & Seeds', brand: 'Natural', healthScore: 9, reason: 'Healthy fats, no added sugar' },
            { name: 'Roasted Snacks', brand: 'Traditional', healthScore: 8, reason: 'Low sugar, high protein' }
        ];
    },

    /**
     * Process a complete sugar scan
     */
    async processSugarScan(userId, barcode, scanData = {}) {
        try {
            // Find product by barcode
            const product = await foodProductModel.findByBarcode(barcode);

            if (!product) {
                return {
                    success: false,
                    message: 'Product not found in database',
                    barcode: barcode,
                    suggestion: 'Product data will be added soon. Try scanning another product.'
                };
            }

            // Get user health profile
            const healthProfile = await userHealthProfileModel.findByUserId(userId);

            // Analyze product
            const analysis = this.analyzeProduct(product, healthProfile);

            // Get alternatives
            const alternatives = await this.getAlternatives(
                product.id,
                product.category,
                product.health_score
            );

            // Log the scan
            const sugarConsumed = scanData.servingSizeConsumed
                ? (product.sugar_per_serving * scanData.servingSizeConsumed) / product.serving_weight_grams
                : product.sugar_per_pack;

            const teaspoons = this.gramsToTeaspoons(sugarConsumed);

            const alertTypes = analysis.alerts.map(a => a.type).join(', ');

            const logId = await sugarScanLogModel.create({
                userId,
                productId: product.id,
                productName: product.product_name,
                barcode,
                sugarConsumed,
                teaspoons,
                servingSizeConsumed: scanData.servingSizeConsumed || product.serving_weight_grams,
                alertType: alertTypes,
                healthProfileAlerts: analysis.alerts,
                notes: scanData.notes,
                locationLatitude: scanData.latitude,
                locationLongitude: scanData.longitude
            });

            // Update daily tracker
            const dailyUpdate = await dailySugarTrackerModel.updateAfterScan(
                userId,
                sugarConsumed,
                teaspoons
            );

            // Get user's daily limit
            const dailyLimit = healthProfile ? healthProfile.daily_sugar_limit_grams : 25;
            const todayProgress = {
                totalSugar: dailyUpdate.totalSugarGrams,
                totalTeaspoons: dailyUpdate.totalTeaspoons,
                dailyLimit: dailyLimit,
                percentageConsumed: dailyUpdate.percentageConsumed,
                remaining: Math.max(0, dailyLimit - dailyUpdate.totalSugarGrams)
            };

            return {
                success: true,
                analysis: {
                    ...analysis,
                    scanId: logId
                },
                alternatives,
                todayProgress,
                message: 'Product scanned successfully'
            };
        } catch (error) {
            console.error('Error processing sugar scan:', error);
            return {
                success: false,
                message: 'Failed to process sugar scan',
                error: error.message
            };
        }
    },

    /**
     * Get dashboard data for user
     */
    async getDashboardData(userId) {
        try {
            // Get today's scans
            const todayScans = await sugarScanLogModel.getTodayScans(userId);

            // Get today's progress
            const todayProgress = await dailySugarTrackerModel.getOrCreateToday(userId);

            // Get weekly summary
            const weeklySummary = await dailySugarTrackerModel.getWeeklySummary(userId);

            // Get health profile
            const healthProfile = await userHealthProfileModel.findByUserId(userId);

            // Get scan statistics
            const weeklyStats = await sugarScanLogModel.getUserStats(userId, 'week');

            return {
                success: true,
                today: {
                    scans: todayScans,
                    progress: todayProgress
                },
                weekly: {
                    summary: weeklySummary,
                    stats: weeklyStats
                },
                healthProfile: healthProfile || null
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            return {
                success: false,
                message: 'Failed to get dashboard data',
                error: error.message
            };
        }
    }
};

module.exports = sugarShieldService;

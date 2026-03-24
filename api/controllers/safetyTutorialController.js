const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const safetyTutorialController = {
    // Get all tutorials with optional filtering
    async getAllTutorials(req, res) {
        try {
            const pool = getPool();
            const { category, difficulty, page = 1, limit = 20 } = req.query;

            let query = 'SELECT * FROM safety_tutorials WHERE is_active = TRUE';
            const params = [];

            // Filter by category
            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            // Filter by difficulty
            if (difficulty) {
                query += ' AND difficulty = ?';
                params.push(difficulty);
            }

            // Add ordering
            query += ' ORDER BY created_at DESC';

            // Add pagination
            const offset = (page - 1) * limit;
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [tutorials] = await pool.query(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM safety_tutorials WHERE is_active = TRUE';
            const countParams = [];
            if (category) {
                countQuery += ' AND category = ?';
                countParams.push(category);
            }
            if (difficulty) {
                countQuery += ' AND difficulty = ?';
                countParams.push(difficulty);
            }

            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;

            // Format the response
            const formattedTutorials = tutorials.map(tutorial => ({
                id: tutorial.id,
                title: tutorial.title,
                description: tutorial.description,
                content: tutorial.content,
                category: tutorial.category,
                imageUrl: tutorial.image_url,
                videoUrl: tutorial.video_url,
                duration: tutorial.duration,
                difficulty: tutorial.difficulty,
                isPremium: tutorial.is_premium,
                isActive: tutorial.is_active,
                createdAt: tutorial.created_at,
                updatedAt: tutorial.updated_at,
            }));

            res.json({
                success: true,
                count: formattedTutorials.length,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                data: formattedTutorials,
            });
        } catch (error) {
            console.error('Get all tutorials error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get tutorials',
            });
        }
    },

    // Get single tutorial by ID
    async getTutorialById(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            const [tutorials] = await pool.query(
                'SELECT * FROM safety_tutorials WHERE id = ? AND is_active = TRUE',
                [id]
            );

            if (tutorials.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tutorial not found',
                });
            }

            const tutorial = tutorials[0];

            res.json({
                success: true,
                data: {
                    id: tutorial.id,
                    title: tutorial.title,
                    description: tutorial.description,
                    content: tutorial.content,
                    category: tutorial.category,
                    imageUrl: tutorial.image_url,
                    videoUrl: tutorial.video_url,
                    duration: tutorial.duration,
                    difficulty: tutorial.difficulty,
                    isPremium: tutorial.is_premium,
                    isActive: tutorial.is_active,
                    createdAt: tutorial.created_at,
                    updatedAt: tutorial.updated_at,
                },
            });
        } catch (error) {
            console.error('Get tutorial by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get tutorial',
            });
        }
    },

    // Create new tutorial
    async createTutorial(req, res) {
        try {
            const pool = getPool();
            const {
                title,
                description,
                content,
                category,
                imageUrl,
                videoUrl,
                duration,
                difficulty,
                isPremium,
            } = req.body;

            // Validation
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required',
                });
            }

            const tutorialId = uuidv4();

            await pool.query(
                `INSERT INTO safety_tutorials 
                 (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [
                    tutorialId,
                    title,
                    description || null,
                    content || null,
                    category || null,
                    imageUrl || null,
                    videoUrl || null,
                    duration || 0,
                    difficulty || 'beginner',
                    isPremium || false,
                ]
            );

            res.status(201).json({
                success: true,
                message: 'Tutorial created successfully',
                data: {
                    id: tutorialId,
                    title,
                    description,
                    content,
                    category,
                    imageUrl,
                    videoUrl,
                    duration,
                    difficulty,
                    isPremium,
                    isActive: true,
                },
            });
        } catch (error) {
            console.error('Create tutorial error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create tutorial',
            });
        }
    },

    // Update tutorial
    async updateTutorial(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;
            const {
                title,
                description,
                content,
                category,
                imageUrl,
                videoUrl,
                duration,
                difficulty,
                isPremium,
                isActive,
            } = req.body;

            // Check if tutorial exists
            const [existing] = await pool.query(
                'SELECT * FROM safety_tutorials WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tutorial not found',
                });
            }

            // Build dynamic update query
            const updates = [];
            const params = [];

            if (title !== undefined) {
                updates.push('title = ?');
                params.push(title);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            if (content !== undefined) {
                updates.push('content = ?');
                params.push(content);
            }
            if (category !== undefined) {
                updates.push('category = ?');
                params.push(category);
            }
            if (imageUrl !== undefined) {
                updates.push('image_url = ?');
                params.push(imageUrl);
            }
            if (videoUrl !== undefined) {
                updates.push('video_url = ?');
                params.push(videoUrl);
            }
            if (duration !== undefined) {
                updates.push('duration = ?');
                params.push(duration);
            }
            if (difficulty !== undefined) {
                updates.push('difficulty = ?');
                params.push(difficulty);
            }
            if (isPremium !== undefined) {
                updates.push('is_premium = ?');
                params.push(isPremium);
            }
            if (isActive !== undefined) {
                updates.push('is_active = ?');
                params.push(isActive);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update',
                });
            }

            params.push(id);

            await pool.query(
                `UPDATE safety_tutorials SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            res.json({
                success: true,
                message: 'Tutorial updated successfully',
            });
        } catch (error) {
            console.error('Update tutorial error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update tutorial',
            });
        }
    },

    // Delete tutorial (soft delete)
    async deleteTutorial(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            // Check if tutorial exists
            const [existing] = await pool.query(
                'SELECT * FROM safety_tutorials WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tutorial not found',
                });
            }

            // Soft delete - set is_active to false
            await pool.query(
                'UPDATE safety_tutorials SET is_active = FALSE WHERE id = ?',
                [id]
            );

            res.json({
                success: true,
                message: 'Tutorial deleted successfully',
            });
        } catch (error) {
            console.error('Delete tutorial error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete tutorial',
            });
        }
    },

    // Get all unique categories
    async getCategories(req, res) {
        try {
            const pool = getPool();

            const [categories] = await pool.query(
                'SELECT DISTINCT category FROM safety_tutorials WHERE category IS NOT NULL AND category != "" AND is_active = TRUE ORDER BY category'
            );

            res.json({
                success: true,
                count: categories.length,
                data: categories.map(c => c.category),
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get categories',
            });
        }
    },
};

module.exports = safetyTutorialController;

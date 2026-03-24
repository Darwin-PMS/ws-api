const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const safetyLawController = {
    // Get all laws with optional filtering
    async getAllLaws(req, res) {
        try {
            const pool = getPool();
            const { category, jurisdiction, page = 1, limit = 20 } = req.query;

            let query = 'SELECT * FROM safety_laws WHERE is_active = TRUE';
            const params = [];

            // Filter by category
            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            // Filter by jurisdiction
            if (jurisdiction) {
                query += ' AND jurisdiction = ?';
                params.push(jurisdiction);
            }

            // Add ordering
            query += ' ORDER BY effective_date DESC';

            // Add pagination
            const offset = (page - 1) * limit;
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [laws] = await pool.query(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM safety_laws WHERE is_active = TRUE';
            const countParams = [];
            if (category) {
                countQuery += ' AND category = ?';
                countParams.push(category);
            }
            if (jurisdiction) {
                countQuery += ' AND jurisdiction = ?';
                countParams.push(jurisdiction);
            }

            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;

            // Format the response
            const formattedLaws = laws.map(law => ({
                id: law.id,
                title: law.title,
                description: law.description,
                content: law.content,
                category: law.category,
                jurisdiction: law.jurisdiction,
                effectiveDate: law.effective_date,
                penalty: law.penalty,
                isActive: law.is_active,
                createdAt: law.created_at,
                updatedAt: law.updated_at,
            }));

            res.json({
                success: true,
                count: formattedLaws.length,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                data: formattedLaws,
            });
        } catch (error) {
            console.error('Get all laws error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get laws',
            });
        }
    },

    // Get single law by ID
    async getLawById(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            const [laws] = await pool.query(
                'SELECT * FROM safety_laws WHERE id = ? AND is_active = TRUE',
                [id]
            );

            if (laws.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Law not found',
                });
            }

            const law = laws[0];

            res.json({
                success: true,
                data: {
                    id: law.id,
                    title: law.title,
                    description: law.description,
                    content: law.content,
                    category: law.category,
                    jurisdiction: law.jurisdiction,
                    effectiveDate: law.effective_date,
                    penalty: law.penalty,
                    isActive: law.is_active,
                    createdAt: law.created_at,
                    updatedAt: law.updated_at,
                },
            });
        } catch (error) {
            console.error('Get law by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get law',
            });
        }
    },

    // Create new law
    async createLaw(req, res) {
        try {
            const pool = getPool();
            const {
                title,
                description,
                content,
                category,
                jurisdiction,
                effectiveDate,
                penalty,
            } = req.body;

            // Validation
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required',
                });
            }

            const lawId = uuidv4();

            await pool.query(
                `INSERT INTO safety_laws 
                 (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [
                    lawId,
                    title,
                    description || null,
                    content || null,
                    category || null,
                    jurisdiction || null,
                    effectiveDate || null,
                    penalty || null,
                ]
            );

            res.status(201).json({
                success: true,
                message: 'Law created successfully',
                data: {
                    id: lawId,
                    title,
                    description,
                    content,
                    category,
                    jurisdiction,
                    effectiveDate,
                    penalty,
                    isActive: true,
                },
            });
        } catch (error) {
            console.error('Create law error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create law',
            });
        }
    },

    // Update law
    async updateLaw(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;
            const {
                title,
                description,
                content,
                category,
                jurisdiction,
                effectiveDate,
                penalty,
                isActive,
            } = req.body;

            // Check if law exists
            const [existing] = await pool.query(
                'SELECT * FROM safety_laws WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Law not found',
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
            if (jurisdiction !== undefined) {
                updates.push('jurisdiction = ?');
                params.push(jurisdiction);
            }
            if (effectiveDate !== undefined) {
                updates.push('effective_date = ?');
                params.push(effectiveDate);
            }
            if (penalty !== undefined) {
                updates.push('penalty = ?');
                params.push(penalty);
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
                `UPDATE safety_laws SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            res.json({
                success: true,
                message: 'Law updated successfully',
            });
        } catch (error) {
            console.error('Update law error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update law',
            });
        }
    },

    // Delete law (soft delete)
    async deleteLaw(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            // Check if law exists
            const [existing] = await pool.query(
                'SELECT * FROM safety_laws WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Law not found',
                });
            }

            // Soft delete - set is_active to false
            await pool.query(
                'UPDATE safety_laws SET is_active = FALSE WHERE id = ?',
                [id]
            );

            res.json({
                success: true,
                message: 'Law deleted successfully',
            });
        } catch (error) {
            console.error('Delete law error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete law',
            });
        }
    },

    // Get all unique categories
    async getCategories(req, res) {
        try {
            const pool = getPool();

            const [categories] = await pool.query(
                'SELECT DISTINCT category FROM safety_laws WHERE category IS NOT NULL AND category != "" AND is_active = TRUE ORDER BY category'
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

    // Get all unique jurisdictions
    async getJurisdictions(req, res) {
        try {
            const pool = getPool();

            const [jurisdictions] = await pool.query(
                'SELECT DISTINCT jurisdiction FROM safety_laws WHERE jurisdiction IS NOT NULL AND jurisdiction != "" AND is_active = TRUE ORDER BY jurisdiction'
            );

            res.json({
                success: true,
                count: jurisdictions.length,
                data: jurisdictions.map(j => j.jurisdiction),
            });
        } catch (error) {
            console.error('Get jurisdictions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get jurisdictions',
            });
        }
    },
};

module.exports = safetyLawController;

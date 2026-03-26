const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const safetyNewsController = {
    // Get all news with optional filtering
    async getAllNews(req, res) {
        try {
            const pool = getPool();
            const { category, is_featured, page = 1, limit = 20 } = req.query;

            let query = 'SELECT * FROM safety_news WHERE is_active = TRUE';
            const params = [];

            // Filter by category
            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            // Filter by featured status
            if (is_featured !== undefined) {
                query += ' AND is_featured = ?';
                params.push(is_featured === 'true');
            }

            // Add ordering - featured first, then by published date
            query += ' ORDER BY is_featured DESC, published_at DESC';

            // Add pagination
            const offset = (page - 1) * limit;
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [news] = await pool.query(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM safety_news WHERE is_active = TRUE';
            const countParams = [];
            if (category) {
                countQuery += ' AND category = ?';
                countParams.push(category);
            }
            if (is_featured !== undefined) {
                countQuery += ' AND is_featured = ?';
                countParams.push(is_featured === 'true');
            }

            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;

            // Format the response
            const formattedNews = news.map(item => ({
                id: item.id,
                title: item.title,
                summary: item.summary,
                content: item.content,
                category: item.category,
                imageUrl: item.image_url,
                author: item.author,
                source: item.source,
                publishedAt: item.published_at,
                isFeatured: item.is_featured,
                isActive: item.is_active,
                viewsCount: item.views_count,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            }));

            res.json({
                success: true,
                count: formattedNews.length,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                data: formattedNews,
            });
        } catch (error) {
            console.error('Get all news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get news',
            });
        }
    },

    // Get single news by ID
    async getNewsById(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            const [news] = await pool.query(
                'SELECT * FROM safety_news WHERE id = ? AND is_active = TRUE',
                [id]
            );

            if (news.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'News not found',
                });
            }

            const item = news[0];

            res.json({
                success: true,
                data: {
                    id: item.id,
                    title: item.title,
                    summary: item.summary,
                    content: item.content,
                    category: item.category,
                    imageUrl: item.image_url,
                    author: item.author,
                    source: item.source,
                    publishedAt: item.published_at,
                    isFeatured: item.is_featured,
                    isActive: item.is_active,
                    viewsCount: item.views_count,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                },
            });
        } catch (error) {
            console.error('Get news by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get news',
            });
        }
    },

    // Create new news
    async createNews(req, res) {
        try {
            const pool = getPool();
            const {
                title,
                summary,
                content,
                category,
                imageUrl,
                author,
                source,
                publishedAt,
                isFeatured,
            } = req.body;

            // Validation
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Title is required',
                });
            }

            const newsId = uuidv4();

            await pool.query(
                `INSERT INTO safety_news 
                 (id, title, summary, content, category, image_url, author, source, published_at, is_featured, is_active, views_count)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 0)`,
                [
                    newsId,
                    title,
                    summary || null,
                    content || null,
                    category || null,
                    imageUrl || null,
                    author || null,
                    source || null,
                    publishedAt || new Date(),
                    isFeatured || false,
                ]
            );

            res.status(201).json({
                success: true,
                message: 'News created successfully',
                data: {
                    id: newsId,
                    title,
                    summary,
                    content,
                    category,
                    imageUrl,
                    author,
                    source,
                    publishedAt: publishedAt || new Date(),
                    isFeatured,
                    isActive: true,
                    viewsCount: 0,
                },
            });
        } catch (error) {
            console.error('Create news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create news',
            });
        }
    },

    // Update news
    async updateNews(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;
            const {
                title,
                summary,
                content,
                category,
                imageUrl,
                author,
                source,
                publishedAt,
                isFeatured,
                isActive,
            } = req.body;

            // Check if news exists
            const [existing] = await pool.query(
                'SELECT * FROM safety_news WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'News not found',
                });
            }

            // Build dynamic update query
            const updates = [];
            const params = [];

            if (title !== undefined) {
                updates.push('title = ?');
                params.push(title);
            }
            if (summary !== undefined) {
                updates.push('summary = ?');
                params.push(summary);
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
            if (author !== undefined) {
                updates.push('author = ?');
                params.push(author);
            }
            if (source !== undefined) {
                updates.push('source = ?');
                params.push(source);
            }
            if (publishedAt !== undefined) {
                updates.push('published_at = ?');
                params.push(publishedAt);
            }
            if (isFeatured !== undefined) {
                updates.push('is_featured = ?');
                params.push(isFeatured);
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
                `UPDATE safety_news SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            res.json({
                success: true,
                message: 'News updated successfully',
            });
        } catch (error) {
            console.error('Update news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update news',
            });
        }
    },

    // Delete news (soft delete)
    async deleteNews(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            // Check if news exists
            const [existing] = await pool.query(
                'SELECT * FROM safety_news WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'News not found',
                });
            }

            // Soft delete - set is_active to false
            await pool.query(
                'UPDATE safety_news SET is_active = FALSE WHERE id = ?',
                [id]
            );

            res.json({
                success: true,
                message: 'News deleted successfully',
            });
        } catch (error) {
            console.error('Delete news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete news',
            });
        }
    },

    // Increment view count
    async incrementViews(req, res) {
        try {
            const pool = getPool();
            const { id } = req.params;

            // Check if news exists
            const [existing] = await pool.query(
                'SELECT * FROM safety_news WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'News not found',
                });
            }

            // Increment views count
            await pool.query(
                'UPDATE safety_news SET views_count = views_count + 1 WHERE id = ?',
                [id]
            );

            // Get updated news
            const [updated] = await pool.query(
                'SELECT views_count FROM safety_news WHERE id = ?',
                [id]
            );

            res.json({
                success: true,
                message: 'View count incremented',
                data: {
                    viewsCount: updated[0].views_count,
                },
            });
        } catch (error) {
            console.error('Increment views error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to increment view count',
            });
        }
    },

    // Get all unique categories
    async getCategories(req, res) {
        try {
            const pool = getPool();

            const [categories] = await pool.query(
                'SELECT DISTINCT category FROM safety_news WHERE category IS NOT NULL AND category != "" AND is_active = TRUE ORDER BY category'
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

    // Get featured news
    async getFeaturedNews(req, res) {
        try {
            const pool = getPool();
            const { limit = 5 } = req.query;

            const [news] = await pool.query(
                `SELECT * FROM safety_news 
                 WHERE is_featured = TRUE AND is_active = TRUE 
                 ORDER BY published_at DESC 
                 LIMIT ?`,
                [parseInt(limit)]
            );

            const formattedNews = news.map(item => ({
                id: item.id,
                title: item.title,
                summary: item.summary,
                content: item.content,
                category: item.category,
                imageUrl: item.image_url,
                author: item.author,
                source: item.source,
                publishedAt: item.published_at,
                isFeatured: item.is_featured,
                isActive: item.is_active,
                viewsCount: item.views_count,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            }));

            res.json({
                success: true,
                count: formattedNews.length,
                data: formattedNews,
            });
        } catch (error) {
            console.error('Get featured news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get featured news',
            });
        }
    },

    // Search news
    async searchNews(req, res) {
        try {
            const pool = getPool();
            const { keyword } = req.query;

            if (!keyword) {
                return res.status(400).json({
                    success: false,
                    message: 'Keyword is required',
                });
            }

            const [news] = await pool.query(
                `SELECT * FROM safety_news 
                 WHERE is_active = TRUE 
                 AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)
                 ORDER BY published_at DESC
                 LIMIT 50`,
                [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
            );

            const formattedNews = news.map(item => ({
                id: item.id,
                title: item.title,
                summary: item.summary,
                content: item.content,
                category: item.category,
                imageUrl: item.image_url,
                author: item.author,
                source: item.source,
                publishedAt: item.published_at,
                isFeatured: item.is_featured,
                isActive: item.is_active,
                viewsCount: item.views_count,
            }));

            res.json({
                success: true,
                count: formattedNews.length,
                data: formattedNews,
            });
        } catch (error) {
            console.error('Search news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search news',
            });
        }
    },

    // Get latest news
    async getLatestNews(req, res) {
        try {
            const pool = getPool();
            const { limit = 10 } = req.query;

            const [news] = await pool.query(
                `SELECT * FROM safety_news 
                 WHERE is_active = TRUE 
                 ORDER BY published_at DESC 
                 LIMIT ?`,
                [parseInt(limit)]
            );

            const formattedNews = news.map(item => ({
                id: item.id,
                title: item.title,
                summary: item.summary,
                content: item.content,
                category: item.category,
                imageUrl: item.image_url,
                author: item.author,
                source: item.source,
                publishedAt: item.published_at,
                isFeatured: item.is_featured,
                isActive: item.is_active,
                viewsCount: item.views_count,
            }));

            res.json({
                success: true,
                count: formattedNews.length,
                data: formattedNews,
            });
        } catch (error) {
            console.error('Get latest news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get latest news',
            });
        }
    },

    // Get popular news
    async getPopularNews(req, res) {
        try {
            const pool = getPool();
            const { limit = 10 } = req.query;

            const [news] = await pool.query(
                `SELECT * FROM safety_news 
                 WHERE is_active = TRUE 
                 ORDER BY views_count DESC 
                 LIMIT ?`,
                [parseInt(limit)]
            );

            const formattedNews = news.map(item => ({
                id: item.id,
                title: item.title,
                summary: item.summary,
                content: item.content,
                category: item.category,
                imageUrl: item.image_url,
                author: item.author,
                source: item.source,
                publishedAt: item.published_at,
                isFeatured: item.is_featured,
                isActive: item.is_active,
                viewsCount: item.views_count,
            }));

            res.json({
                success: true,
                count: formattedNews.length,
                data: formattedNews,
            });
        } catch (error) {
            console.error('Get popular news error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get popular news',
            });
        }
    },

    // Get news by category
    async getNewsByCategory(req, res) {
        try {
            const pool = getPool();
            const { categoryId } = req.params;
            const { limit = 20 } = req.query;

            const [news] = await pool.query(
                `SELECT * FROM safety_news 
                 WHERE category = ? AND is_active = TRUE 
                 ORDER BY published_at DESC 
                 LIMIT ?`,
                [categoryId, parseInt(limit)]
            );

            const formattedNews = news.map(item => ({
                id: item.id,
                title: item.title,
                summary: item.summary,
                content: item.content,
                category: item.category,
                imageUrl: item.image_url,
                author: item.author,
                source: item.source,
                publishedAt: item.published_at,
                isFeatured: item.is_featured,
                isActive: item.is_active,
                viewsCount: item.views_count,
            }));

            res.json({
                success: true,
                count: formattedNews.length,
                data: formattedNews,
            });
        } catch (error) {
            console.error('Get news by category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get news by category',
            });
        }
    },
};

module.exports = safetyNewsController;

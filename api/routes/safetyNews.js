const express = require('express');
const router = express.Router();
const safetyNewsController = require('../controllers/safetyNewsController');

// Get all news
router.get('/', safetyNewsController.getAllNews);

// Get single news by ID
router.get('/:id', safetyNewsController.getNewsById);

// Create new news
router.post('/', safetyNewsController.createNews);

// Update news
router.put('/:id', safetyNewsController.updateNews);

// Delete news (soft delete)
router.delete('/:id', safetyNewsController.deleteNews);

// Increment view count
router.put('/:id/view', safetyNewsController.incrementViews);

// Get all unique categories
router.get('/categories', safetyNewsController.getCategories);

// Get featured news
router.get('/featured', safetyNewsController.getFeaturedNews);

module.exports = router;

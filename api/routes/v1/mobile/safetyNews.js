const express = require('express');
const safetyNewsController = require('../../../controllers/safetyNewsController');
const { optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/categories', optionalAuth, safetyNewsController.getCategories);
router.get('/featured', optionalAuth, safetyNewsController.getFeaturedNews);
router.get('/search', optionalAuth, safetyNewsController.searchNews);
router.get('/latest', optionalAuth, safetyNewsController.getLatestNews);
router.get('/popular', optionalAuth, safetyNewsController.getPopularNews);
router.get('/category/:categoryId', optionalAuth, safetyNewsController.getNewsByCategory);
router.get('/:id', optionalAuth, safetyNewsController.getNewsById);
router.get('/', optionalAuth, safetyNewsController.getAllNews);

module.exports = router;

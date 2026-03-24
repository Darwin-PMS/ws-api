const express = require('express');
const safetyNewsController = require('../../../controllers/safetyNewsController');
const { optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, safetyNewsController.getAllNews);
router.get('/:id', optionalAuth, safetyNewsController.getNewsById);
router.get('/featured', optionalAuth, safetyNewsController.getFeaturedNews);
router.get('/categories', optionalAuth, safetyNewsController.getCategories);

module.exports = router;

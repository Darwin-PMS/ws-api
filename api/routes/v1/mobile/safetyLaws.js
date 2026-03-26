const express = require('express');
const safetyLawController = require('../../../controllers/safetyLawController');
const { optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/categories', optionalAuth, safetyLawController.getCategories);
router.get('/jurisdictions', optionalAuth, safetyLawController.getJurisdictions);
router.get('/search', optionalAuth, safetyLawController.searchLaws);
router.get('/recent', optionalAuth, safetyLawController.getRecentLaws);
router.get('/category/:categoryId', optionalAuth, safetyLawController.getLawsByCategory);
router.get('/jurisdiction/:jurisdictionId', optionalAuth, safetyLawController.getLawsByJurisdiction);
router.get('/:id', optionalAuth, safetyLawController.getLawById);
router.get('/', optionalAuth, safetyLawController.getAllLaws);

module.exports = router;

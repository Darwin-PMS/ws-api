const express = require('express');
const safetyLawController = require('../../../controllers/safetyLawController');
const { optionalAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, safetyLawController.getAllLaws);
router.get('/:id', optionalAuth, safetyLawController.getLawById);
router.get('/categories', optionalAuth, safetyLawController.getCategories);
router.get('/jurisdictions', optionalAuth, safetyLawController.getJurisdictions);

module.exports = router;

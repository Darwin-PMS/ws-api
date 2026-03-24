const express = require('express');
const adminController = require('../../../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', adminController.getAllFamilies);
router.get('/:id', adminController.getFamilyById);
router.post('/', adminController.createFamily);
router.put('/:id', adminController.updateFamily);
router.delete('/:id', adminController.deleteFamily);
router.post('/:id/notify', adminController.notifyFamilyMembers);

module.exports = router;

const express = require('express');
const adminController = require('../../../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', adminController.getAllUsers);
router.get('/:id', adminController.getUserById);
router.put('/:id', adminController.updateUser);
router.delete('/:id', adminController.deleteUser);

module.exports = router;

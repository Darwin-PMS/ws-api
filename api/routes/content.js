const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const contentController = require('../controllers/contentController');

// Public routes (for mobile app - no auth required)
router.get('/tutorials', contentController.getAllTutorials);
router.get('/tutorials/:id', contentController.getTutorialById);
router.get('/news', contentController.getAllNews);
router.get('/news/:id', contentController.getNewsById);
router.get('/laws', contentController.getAllLaws);
router.get('/laws/:id', contentController.getLawById);
router.get('/helplines', contentController.getAllHelplines);
router.get('/helplines/:id', contentController.getHelplineById);
router.get('/quick-tips', contentController.getAllQuickTips);

// Admin routes (require authentication and admin role)
router.post('/tutorials', authenticateToken, authorizeRole(['admin']), contentController.createTutorial);
router.put('/tutorials/:id', authenticateToken, authorizeRole(['admin']), contentController.updateTutorial);
router.delete('/tutorials/:id', authenticateToken, authorizeRole(['admin']), contentController.deleteTutorial);

router.post('/news', authenticateToken, authorizeRole(['admin']), contentController.createNews);
router.put('/news/:id', authenticateToken, authorizeRole(['admin']), contentController.updateNews);
router.delete('/news/:id', authenticateToken, authorizeRole(['admin']), contentController.deleteNews);

router.post('/laws', authenticateToken, authorizeRole(['admin']), contentController.createLaw);
router.put('/laws/:id', authenticateToken, authorizeRole(['admin']), contentController.updateLaw);
router.delete('/laws/:id', authenticateToken, authorizeRole(['admin']), contentController.deleteLaw);

router.post('/helplines', authenticateToken, authorizeRole(['admin']), contentController.createHelpline);
router.put('/helplines/:id', authenticateToken, authorizeRole(['admin']), contentController.updateHelpline);
router.delete('/helplines/:id', authenticateToken, authorizeRole(['admin']), contentController.deleteHelpline);

module.exports = router;

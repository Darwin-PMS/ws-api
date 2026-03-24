const express = require('express');
const contentController = require('../../../controllers/contentController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/tutorials', contentController.getTutorials);
router.get('/tutorials/:id', contentController.getTutorial);
router.post('/tutorials', contentController.createTutorial);
router.put('/tutorials/:id', contentController.updateTutorial);
router.delete('/tutorials/:id', contentController.deleteTutorial);

router.get('/news', contentController.getNews);
router.get('/news/:id', contentController.getNew);
router.post('/news', contentController.createNews);
router.put('/news/:id', contentController.updateNews);
router.delete('/news/:id', contentController.deleteNews);

router.get('/laws', contentController.getLaws);
router.get('/laws/:id', contentController.getLaw);
router.post('/laws', contentController.createLaw);
router.put('/laws/:id', contentController.updateLaw);
router.delete('/laws/:id', contentController.deleteLaw);

router.get('/helplines', contentController.getHelplines);
router.get('/helplines/:id', contentController.getHelpline);
router.post('/helplines', contentController.createHelpline);
router.put('/helplines/:id', contentController.updateHelpline);
router.delete('/helplines/:id', contentController.deleteHelpline);

module.exports = router;

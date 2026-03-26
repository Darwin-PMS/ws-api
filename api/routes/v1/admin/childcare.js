const express = require('express');
const router = express.Router();
const childcareController = require('../../../controllers/childcareController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/children', childcareController.adminGetAllChildren);
router.get('/children/:childId', childcareController.getChildById);
router.post('/children', childcareController.adminCreateChild);
router.put('/children/:childId', childcareController.adminUpdateChild);
router.delete('/children/:childId', childcareController.deleteChild);

router.get('/schedules', childcareController.adminGetAllSchedules);
router.delete('/schedules/:scheduleId', childcareController.adminDeleteSchedule);

router.get('/alerts', childcareController.adminGetAllAlerts);

router.get('/school-zones', childcareController.adminGetSchoolZones);
router.post('/school-zones', childcareController.adminCreateSchoolZone);

module.exports = router;

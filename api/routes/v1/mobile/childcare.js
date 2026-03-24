const express = require('express');
const childcareController = require('../../../controllers/childcareController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

router.get('/tips', authenticateToken, childcareController.getTips);
router.get('/tips/:tipId', authenticateToken, childcareController.getTipById);

router.get('/children', authenticateToken, childcareController.getChildren);
router.get('/children/:childId', authenticateToken, childcareController.getChildById);
router.post('/children', authenticateToken, childcareController.createChild);
router.put('/children/:childId', authenticateToken, childcareController.updateChild);
router.delete('/children/:childId', authenticateToken, childcareController.deleteChild);

router.get('/schedules', authenticateToken, childcareController.getSchedules);
router.post('/schedules', authenticateToken, childcareController.addSchedule);
router.delete('/schedules/:scheduleId', authenticateToken, childcareController.deleteSchedule);

router.get('/alerts', authenticateToken, childcareController.getAlerts);
router.put('/alerts/:alertId/read', authenticateToken, childcareController.markAlertRead);

router.get('/locations', authenticateToken, childcareController.getChildLocations);
router.post('/locations', authenticateToken, childcareController.updateChildLocation);

router.get('/school-zones', authenticateToken, childcareController.getSchoolZones);
router.post('/school-zones', authenticateToken, childcareController.addSchoolZone);

router.get('/safety-checks', authenticateToken, childcareController.getSafetyChecks);
router.post('/safety-checks', authenticateToken, childcareController.createSafetyCheck);

module.exports = router;

const express = require('express');
const router = express.Router();

const authRoutes = require('./admin/auth');
const usersRoutes = require('./admin/users');
const sosRoutes = require('./admin/sos');
const familiesRoutes = require('./admin/families');
const devicesRoutes = require('./admin/devices');
const trackingRoutes = require('./admin/tracking');
const contentRoutes = require('./admin/content');
const settingsRoutes = require('./admin/settings');
const analyticsRoutes = require('./admin/analytics');
const activityRoutes = require('./admin/activity');
const grievanceRoutes = require('./admin/grievance');
const menusRoutes = require('./admin/menus');

router.use('/admin/auth', authRoutes);
router.use('/admin/users', usersRoutes);
router.use('/admin/sos-alerts', sosRoutes);
router.use('/admin/families', familiesRoutes);
router.use('/admin/devices', devicesRoutes);
router.use('/admin/tracking', trackingRoutes);
router.use('/admin/content', contentRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/analytics', analyticsRoutes);
router.use('/admin/activity', activityRoutes);
router.use('/admin/grievance', grievanceRoutes);
router.use('/admin/menus', menusRoutes);

router.get('/admin/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    client: 'admin',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

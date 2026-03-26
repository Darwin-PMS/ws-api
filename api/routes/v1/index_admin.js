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
const qrRoutes = require('./admin/qr');
const safeRouteRoutes = require('./admin/safeRoute');
const themeRoutes = require('./admin/theme');
const childcareRoutes = require('./admin/childcare');

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
router.use('/admin/qr', qrRoutes);
router.use('/admin/safe-route', safeRouteRoutes);
router.use('/admin/themes', themeRoutes);
router.use('/admin/childcare', childcareRoutes);

router.get('/admin/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    client: 'admin',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

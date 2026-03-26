const express = require('express');
const router = express.Router();

const authRoutes = require('./mobile/auth');
const usersRoutes = require('./mobile/users');
const sosRoutes = require('./mobile/sos');
const familiesRoutes = require('./mobile/families');
const familyPlacesRoutes = require('./mobile/familyPlaces');
const childcareRoutes = require('./mobile/childcare');
const eventsRoutes = require('./mobile/events');
const behaviorRoutes = require('./mobile/behavior');
const settingsRoutes = require('./mobile/settings');
const consentRoutes = require('./mobile/consent');
const themeRoutes = require('./mobile/theme');
const menuRoutes = require('./mobile/menu');
const permissionsRoutes = require('./mobile/permissions');
const safetyTutorialsRoutes = require('./mobile/safetyTutorials');
const safetyNewsRoutes = require('./mobile/safetyNews');
const safetyLawsRoutes = require('./mobile/safetyLaws');
const grievanceRoutes = require('./mobile/grievance');
const sessionsRoutes = require('./mobile/sessions');
const homeAutomationRoutes = require('./mobile/homeAutomation');
const qrRoutes = require('./mobile/qr');
const safeRouteRoutes = require('./mobile/safeRoute');
const liveStreamRoutes = require('./mobile/liveStream');
const bannersRoutes = require('./mobile/banners');

const adminAuthRoutes = require('./admin/auth');
const adminQrRoutes = require('./admin/qr');
const adminSafeRouteRoutes = require('./admin/safeRoute');
const adminUsersRoutes = require('./admin/users');
const adminSosRoutes = require('./admin/sos');
const adminFamiliesRoutes = require('./admin/families');
const adminDevicesRoutes = require('./admin/devices');
const adminTrackingRoutes = require('./admin/tracking');
const adminContentRoutes = require('./admin/content');
const adminSettingsRoutes = require('./admin/settings');
const adminAnalyticsRoutes = require('./admin/analytics');
const adminActivityRoutes = require('./admin/activity');
const adminGrievanceRoutes = require('./admin/grievance');
const adminMenusRoutes = require('./admin/menus');
const adminThemeRoutes = require('./admin/theme');
const adminChildcareRoutes = require('./admin/childcare');

router.use('/mobile/auth', authRoutes);
router.use('/mobile/users', usersRoutes);
router.use('/mobile/sos', sosRoutes);
router.use('/mobile/families', familiesRoutes);
router.use('/mobile/family-places', familyPlacesRoutes);
router.use('/mobile/childcare', childcareRoutes);
router.use('/mobile/events', eventsRoutes);
router.use('/mobile/behavior', behaviorRoutes);
router.use('/mobile/settings', settingsRoutes);
router.use('/mobile/consent', consentRoutes);
router.use('/mobile/themes', themeRoutes);
router.use('/mobile/menus', menuRoutes);
router.use('/mobile/permissions', permissionsRoutes);
router.use('/mobile/safety-tutorials', safetyTutorialsRoutes);
router.use('/mobile/safety-news', safetyNewsRoutes);
router.use('/mobile/safety-laws', safetyLawsRoutes);
router.use('/mobile/grievance', grievanceRoutes);
router.use('/mobile/sessions', sessionsRoutes);
router.use('/mobile/home-automation', homeAutomationRoutes);
router.use('/mobile/qr', qrRoutes);
router.use('/mobile/safe-route', safeRouteRoutes);
router.use('/mobile/live-stream', liveStreamRoutes);
router.use('/mobile/banners', bannersRoutes);

router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/qr', adminQrRoutes);
router.use('/admin/safe-route', adminSafeRouteRoutes);
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/sos-alerts', adminSosRoutes);
router.use('/admin/families', adminFamiliesRoutes);
router.use('/admin/devices', adminDevicesRoutes);
router.use('/admin/tracking', adminTrackingRoutes);
router.use('/admin/content', adminContentRoutes);
router.use('/admin/settings', adminSettingsRoutes);
router.use('/admin/analytics', adminAnalyticsRoutes);
router.use('/admin/activity', adminActivityRoutes);
router.use('/admin/grievance', adminGrievanceRoutes);
router.use('/admin/menus', adminMenusRoutes);
router.use('/admin/themes', adminThemeRoutes);
router.use('/admin/childcare', adminChildcareRoutes);

router.get('/mobile/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    client: 'mobile',
    timestamp: new Date().toISOString()
  });
});

router.get('/admin/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    client: 'admin',
    timestamp: new Date().toISOString()
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    timestamp: new Date().toISOString(),
    clients: ['mobile', 'admin']
  });
});

module.exports = router;

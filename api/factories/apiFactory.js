class ApiFactory {
  constructor() {
    this.endpoints = {
      mobile: {
        v1: {
          auth: {
            register: { method: 'POST', path: '/v1/mobile/auth/register' },
            login: { method: 'POST', path: '/v1/mobile/auth/login' },
            biometricLogin: { method: 'POST', path: '/v1/mobile/auth/biometric-login' },
            refreshToken: { method: 'POST', path: '/v1/mobile/auth/refresh-token' },
            logout: { method: 'POST', path: '/v1/mobile/auth/logout' },
            forceLogout: { method: 'POST', path: '/v1/mobile/auth/force-logout/:userId' },
            changePassword: { method: 'POST', path: '/v1/mobile/auth/change-password' },
            forgotPassword: { method: 'POST', path: '/v1/mobile/auth/forgot-password' },
            resetPassword: { method: 'POST', path: '/v1/mobile/auth/reset-password' },
          },
          users: {
            getProfile: { method: 'GET', path: '/v1/mobile/users/:id' },
            updateProfile: { method: 'PUT', path: '/v1/mobile/users/:id' },
            getRole: { method: 'GET', path: '/v1/mobile/users/:id/role' },
            getAllEmergencyContacts: { method: 'GET', path: '/v1/mobile/users/emergency-contacts/all' },
            getDefaultContacts: { method: 'GET', path: '/v1/mobile/users/emergency-contacts/default' },
            getPreferences: { method: 'GET', path: '/v1/mobile/users/emergency-contacts/preferences' },
            updatePreferences: { method: 'PUT', path: '/v1/mobile/users/emergency-contacts/preferences' },
            getEmergencyContacts: { method: 'GET', path: '/v1/mobile/users/:id/emergency-contacts' },
            addEmergencyContact: { method: 'POST', path: '/v1/mobile/users/:id/emergency-contacts' },
            updateEmergencyContact: { method: 'PUT', path: '/v1/mobile/users/:id/emergency-contacts/:contactId' },
            deleteEmergencyContact: { method: 'DELETE', path: '/v1/mobile/users/:id/emergency-contacts/:contactId' },
            saveLocation: { method: 'POST', path: '/v1/mobile/users/:id/locations' },
            getLocationHistory: { method: 'GET', path: '/v1/mobile/users/:id/locations' },
            getSOSAlerts: { method: 'GET', path: '/v1/mobile/users/:id/sos-alerts' },
            getNotifications: { method: 'GET', path: '/v1/mobile/users/:id/notifications' },
            markNotificationRead: { method: 'PUT', path: '/v1/mobile/users/:userId/notifications/:notificationId/read' },
            getChildren: { method: 'GET', path: '/v1/mobile/users/:id/children' },
            addChild: { method: 'POST', path: '/v1/mobile/users/:id/children' },
            getSettings: { method: 'GET', path: '/v1/mobile/users/:id/settings' },
            updateSettings: { method: 'PUT', path: '/v1/mobile/users/:id/settings' },
          },
          sos: {
            trigger: { method: 'POST', path: '/v1/mobile/sos/trigger' },
            active: { method: 'GET', path: '/v1/mobile/sos/active' },
            history: { method: 'GET', path: '/v1/mobile/sos/history' },
            resolve: { method: 'PUT', path: '/v1/mobile/sos/:alertId/resolve' },
            delete: { method: 'DELETE', path: '/v1/mobile/sos/:alertId' },
            locationUpdate: { method: 'POST', path: '/v1/mobile/sos/location-update' },
          },
          families: {
            list: { method: 'GET', path: '/v1/mobile/families' },
            create: { method: 'POST', path: '/v1/mobile/families' },
            getDetails: { method: 'GET', path: '/v1/mobile/families/:familyId' },
            update: { method: 'PUT', path: '/v1/mobile/families/:familyId' },
            delete: { method: 'DELETE', path: '/v1/mobile/families/:familyId' },
            getMembers: { method: 'GET', path: '/v1/mobile/families/:familyId/members' },
            addMember: { method: 'POST', path: '/v1/mobile/families/:familyId/members' },
            removeMember: { method: 'DELETE', path: '/v1/mobile/families/:familyId/members/:userId' },
            updateMemberRole: { method: 'PUT', path: '/v1/mobile/families/:familyId/members/:userId/role' },
            getRelationships: { method: 'GET', path: '/v1/mobile/families/:familyId/relationships' },
            addRelationship: { method: 'POST', path: '/v1/mobile/families/:familyId/relationships' },
            deleteRelationship: { method: 'DELETE', path: '/v1/mobile/families/:familyId/relationships/:id' },
            userLookup: { method: 'GET', path: '/v1/mobile/families/users/lookup/:email' },
            getFamilyLocations: { method: 'GET', path: '/v1/mobile/families/:familyId/locations' },
            getMemberLocation: { method: 'GET', path: '/v1/mobile/families/:familyId/members/:userId/location' },
          },
          familyPlaces: {
            createPlace: { method: 'POST', path: '/v1/mobile/family-places/:familyId/places' },
            getPlaces: { method: 'GET', path: '/v1/mobile/family-places/:familyId/places' },
            updatePlace: { method: 'PUT', path: '/v1/mobile/family-places/:familyId/places/:placeId' },
            deletePlace: { method: 'DELETE', path: '/v1/mobile/family-places/:familyId/places/:placeId' },
            checkPlace: { method: 'POST', path: '/v1/mobile/family-places/:familyId/places/check' },
            nearestPlace: { method: 'POST', path: '/v1/mobile/family-places/:familyId/places/nearest' },
          },
          childcare: {
            getTips: { method: 'GET', path: '/v1/mobile/childcare/tips' },
            getTipById: { method: 'GET', path: '/v1/mobile/childcare/tips/:tipId' },
            addFavorite: { method: 'POST', path: '/v1/mobile/childcare/tips/favorites' },
            removeFavorite: { method: 'DELETE', path: '/v1/mobile/childcare/tips/favorites/:tipId' },
            getCategories: { method: 'GET', path: '/v1/mobile/childcare/categories' },
            getChatMessages: { method: 'GET', path: '/v1/mobile/childcare/chat/messages' },
            sendChatMessage: { method: 'POST', path: '/v1/mobile/childcare/chat/messages' },
            getConversations: { method: 'GET', path: '/v1/mobile/childcare/chat/conversations' },
            deleteConversation: { method: 'DELETE', path: '/v1/mobile/childcare/chat/conversations/:id' },
            getChildren: { method: 'GET', path: '/v1/mobile/childcare/children' },
            addChild: { method: 'POST', path: '/v1/mobile/childcare/children' },
            updateChild: { method: 'PUT', path: '/v1/mobile/childcare/children/:childId' },
            deleteChild: { method: 'DELETE', path: '/v1/mobile/childcare/children/:childId' },
            addGrowthTracker: { method: 'POST', path: '/v1/mobile/childcare/trackers/growth/:childId' },
            getGrowthTracker: { method: 'GET', path: '/v1/mobile/childcare/trackers/growth/:childId' },
            addFeedingTracker: { method: 'POST', path: '/v1/mobile/childcare/trackers/feeding/:childId' },
            getFeedingTracker: { method: 'GET', path: '/v1/mobile/childcare/trackers/feeding/:childId' },
            addSleepTracker: { method: 'POST', path: '/v1/mobile/childcare/trackers/sleep/:childId' },
            getSleepTracker: { method: 'GET', path: '/v1/mobile/childcare/trackers/sleep/:childId' },
          },
          events: {
            addLocation: { method: 'POST', path: '/v1/mobile/events/families/:familyId/location' },
            addBatchLocations: { method: 'POST', path: '/v1/mobile/events/families/:familyId/locations/batch' },
            getSuggestions: { method: 'GET', path: '/v1/mobile/events/families/:familyId/suggestions' },
            respondSuggestion: { method: 'POST', path: '/v1/mobile/events/suggestions/:suggestionId/respond' },
            getActivityLogs: { method: 'GET', path: '/v1/mobile/events/families/:familyId/activity-logs' },
            addActivityLog: { method: 'POST', path: '/v1/mobile/events/families/:familyId/activity-logs' },
            getContext: { method: 'GET', path: '/v1/mobile/events/families/:familyId/context' },
          },
          behavior: {
            analyze: { method: 'POST', path: '/v1/mobile/behavior/analyze' },
            getAnomalies: { method: 'GET', path: '/v1/mobile/behavior/anomalies' },
            getSummary: { method: 'GET', path: '/v1/mobile/behavior/summary/:userId' },
            submitFeedback: { method: 'POST', path: '/v1/mobile/behavior/feedback' },
            getSettings: { method: 'GET', path: '/v1/mobile/behavior/settings/:userId' },
            updateSettings: { method: 'PUT', path: '/v1/mobile/behavior/settings/:userId' },
            getRoutines: { method: 'GET', path: '/v1/mobile/behavior/routines/:userId' },
            learnRoutine: { method: 'POST', path: '/v1/mobile/behavior/routines/learn' },
            getAlerts: { method: 'GET', path: '/v1/mobile/behavior/alerts/:userId' },
            resolveAlert: { method: 'PUT', path: '/v1/mobile/behavior/alerts/:alertId/resolve' },
          },
          settings: {
            getGroqKey: { method: 'GET', path: '/v1/mobile/settings/groq-key' },
          },
          consent: {
            getSettings: { method: 'GET', path: '/v1/mobile/consent/consent-settings' },
            updateSettings: { method: 'PUT', path: '/v1/mobile/consent/consent-settings' },
            updateCategories: { method: 'PUT', path: '/v1/mobile/consent/categories' },
            getAuditLogs: { method: 'GET', path: '/v1/mobile/consent/audit-logs' },
          },
          theme: {
            getCurrent: { method: 'GET', path: '/v1/mobile/themes/current' },
            getAll: { method: 'GET', path: '/v1/mobile/themes' },
            setUserTheme: { method: 'PUT', path: '/v1/mobile/themes/user' },
            getThemeConfig: { method: 'GET', path: '/v1/mobile/themes/:themeId/config' },
          },
          menu: {
            getUserMenu: { method: 'GET', path: '/v1/mobile/menus/user' },
            getAllMenus: { method: 'GET', path: '/v1/mobile/menus' },
            getMenuById: { method: 'GET', path: '/v1/mobile/menus/:menuId' },
          },
          permissions: {
            getCurrent: { method: 'GET', path: '/v1/mobile/permissions/current' },
            getByRole: { method: 'GET', path: '/v1/mobile/permissions/role/:role' },
            updateUserPermissions: { method: 'PUT', path: '/v1/mobile/permissions/user' },
          },
          safetyTutorials: {
            list: { method: 'GET', path: '/v1/mobile/safety-tutorials' },
            getById: { method: 'GET', path: '/v1/mobile/safety-tutorials/:id' },
            getCategories: { method: 'GET', path: '/v1/mobile/safety-tutorials/categories' },
            search: { method: 'GET', path: '/v1/mobile/safety-tutorials/search' },
            byCategory: { method: 'GET', path: '/v1/mobile/safety-tutorials/category/:categoryId' },
            byDifficulty: { method: 'GET', path: '/v1/mobile/safety-tutorials/difficulty/:difficulty' },
          },
          safetyNews: {
            list: { method: 'GET', path: '/v1/mobile/safety-news' },
            getById: { method: 'GET', path: '/v1/mobile/safety-news/:id' },
            featured: { method: 'GET', path: '/v1/mobile/safety-news/featured' },
            getCategories: { method: 'GET', path: '/v1/mobile/safety-news/categories' },
            search: { method: 'GET', path: '/v1/mobile/safety-news/search' },
            byCategory: { method: 'GET', path: '/v1/mobile/safety-news/category/:categoryId' },
            latest: { method: 'GET', path: '/v1/mobile/safety-news/latest' },
            popular: { method: 'GET', path: '/v1/mobile/safety-news/popular' },
          },
          safetyLaws: {
            list: { method: 'GET', path: '/v1/mobile/safety-laws' },
            getById: { method: 'GET', path: '/v1/mobile/safety-laws/:id' },
            getCategories: { method: 'GET', path: '/v1/mobile/safety-laws/categories' },
            getJurisdictions: { method: 'GET', path: '/v1/mobile/safety-laws/jurisdictions' },
            search: { method: 'GET', path: '/v1/mobile/safety-laws/search' },
            byCategory: { method: 'GET', path: '/v1/mobile/safety-laws/category/:categoryId' },
            byJurisdiction: { method: 'GET', path: '/v1/mobile/safety-laws/jurisdiction/:jurisdictionId' },
            recent: { method: 'GET', path: '/v1/mobile/safety-laws/recent' },
          },
          grievance: {
            submit: { method: 'POST', path: '/v1/mobile/grievance' },
            getMy: { method: 'GET', path: '/v1/mobile/grievance/my' },
          },
          sessions: {
            getHistory: { method: 'GET', path: '/v1/mobile/sessions/history' },
          },
          homeAutomation: {
            getDevices: { method: 'GET', path: '/v1/mobile/home-automation/devices' },
            getDevice: { method: 'GET', path: '/v1/mobile/home-automation/devices/:deviceId' },
            control: { method: 'POST', path: '/v1/mobile/home-automation/devices/:deviceId/control' },
            addDevice: { method: 'POST', path: '/v1/mobile/home-automation/devices' },
            updateDevice: { method: 'PUT', path: '/v1/mobile/home-automation/devices/:deviceId' },
            deleteDevice: { method: 'DELETE', path: '/v1/mobile/home-automation/devices/:deviceId' },
          },
        },
        v2: {},
      },
      admin: {
        v1: {
          auth: {
            login: { method: 'POST', path: '/v1/admin/auth/login' },
            logout: { method: 'POST', path: '/v1/admin/auth/logout' },
            refresh: { method: 'POST', path: '/v1/admin/auth/refresh' },
            register: { method: 'POST', path: '/v1/admin/auth/register' },
            forgotPassword: { method: 'POST', path: '/v1/admin/auth/forgot-password' },
            resetPassword: { method: 'POST', path: '/v1/admin/auth/reset-password' },
            profile: { method: 'GET', path: '/v1/admin/auth/profile' },
          },
          users: {
            list: { method: 'GET', path: '/v1/admin/users' },
            get: { method: 'GET', path: '/v1/admin/users/:id' },
            update: { method: 'PUT', path: '/v1/admin/users/:id' },
            delete: { method: 'DELETE', path: '/v1/admin/users/:id' },
          },
          sosAlerts: {
            list: { method: 'GET', path: '/v1/admin/sos-alerts' },
            get: { method: 'GET', path: '/v1/admin/sos-alerts/:id' },
            resolve: { method: 'PUT', path: '/v1/admin/sos-alerts/:id/resolve' },
            notify: { method: 'POST', path: '/v1/admin/sos-alerts/:id/notify' },
          },
          families: {
            list: { method: 'GET', path: '/v1/admin/families' },
            get: { method: 'GET', path: '/v1/admin/families/:id' },
            create: { method: 'POST', path: '/v1/admin/families' },
            update: { method: 'PUT', path: '/v1/admin/families/:id' },
            delete: { method: 'DELETE', path: '/v1/admin/families/:id' },
          },
          devices: {
            list: { method: 'GET', path: '/v1/admin/devices' },
            get: { method: 'GET', path: '/v1/admin/devices/:id' },
            create: { method: 'POST', path: '/v1/admin/devices' },
            update: { method: 'PUT', path: '/v1/admin/devices/:id' },
            toggle: { method: 'PUT', path: '/v1/admin/devices/:id/toggle' },
            delete: { method: 'DELETE', path: '/v1/admin/devices/:id' },
          },
          tracking: {
            locations: { method: 'GET', path: '/v1/admin/tracking/locations' },
            family: { method: 'GET', path: '/v1/admin/tracking/family/:familyId' },
            user: { method: 'GET', path: '/v1/admin/tracking/user/:userId' },
            userHistory: { method: 'GET', path: '/v1/admin/tracking/user/:userId/history' },
            updateLocation: { method: 'POST', path: '/v1/admin/tracking/user/:userId/location' },
            nearby: { method: 'GET', path: '/v1/admin/tracking/nearby' },
            geofences: { method: 'GET', path: '/v1/admin/tracking/geofences' },
            createGeofence: { method: 'POST', path: '/v1/admin/tracking/geofences' },
            updateGeofence: { method: 'PUT', path: '/v1/admin/tracking/geofences/:id' },
            deleteGeofence: { method: 'DELETE', path: '/v1/admin/tracking/geofences/:id' },
            heatmap: { method: 'GET', path: '/v1/admin/tracking/heatmap' },
          },
          content: {
            tips: { method: 'GET', path: '/v1/admin/content/tips' },
            tip: { method: 'GET', path: '/v1/admin/content/tips/:id' },
            addTip: { method: 'POST', path: '/v1/admin/content/tips' },
            updateTip: { method: 'PUT', path: '/v1/admin/content/tips/:id' },
            deleteTip: { method: 'DELETE', path: '/v1/admin/content/tips/:id' },
            articles: { method: 'GET', path: '/v1/admin/content/articles' },
            article: { method: 'GET', path: '/v1/admin/content/articles/:id' },
            addArticle: { method: 'POST', path: '/v1/admin/content/articles' },
            updateArticle: { method: 'PUT', path: '/v1/admin/content/articles/:id' },
            deleteArticle: { method: 'DELETE', path: '/v1/admin/content/articles/:id' },
            tutorials: { method: 'GET', path: '/v1/admin/content/tutorials' },
            createTutorial: { method: 'POST', path: '/v1/admin/content/tutorials' },
            updateTutorial: { method: 'PUT', path: '/v1/admin/content/tutorials/:id' },
            deleteTutorial: { method: 'DELETE', path: '/v1/admin/content/tutorials/:id' },
            news: { method: 'GET', path: '/v1/admin/content/news' },
            createNews: { method: 'POST', path: '/v1/admin/content/news' },
            updateNews: { method: 'PUT', path: '/v1/admin/content/news/:id' },
            deleteNews: { method: 'DELETE', path: '/v1/admin/content/news/:id' },
            laws: { method: 'GET', path: '/v1/admin/content/laws' },
            createLaw: { method: 'POST', path: '/v1/admin/content/laws' },
            updateLaw: { method: 'PUT', path: '/v1/admin/content/laws/:id' },
            deleteLaw: { method: 'DELETE', path: '/v1/admin/content/laws/:id' },
            helplines: { method: 'GET', path: '/v1/admin/content/helplines' },
            createHelpline: { method: 'POST', path: '/v1/admin/content/helplines' },
            updateHelpline: { method: 'PUT', path: '/v1/admin/content/helplines/:id' },
            deleteHelpline: { method: 'DELETE', path: '/v1/admin/content/helplines/:id' },
          },
          settings: {
            get: { method: 'GET', path: '/v1/admin/settings' },
            update: { method: 'PUT', path: '/v1/admin/settings' },
          },
          analytics: {
            stats: { method: 'GET', path: '/v1/admin/analytics/stats' },
            data: { method: 'GET', path: '/v1/admin/analytics' },
          },
          activity: {
            logs: { method: 'GET', path: '/v1/admin/activity' },
          },
          grievance: {
            list: { method: 'GET', path: '/v1/admin/grievance' },
            get: { method: 'GET', path: '/v1/admin/grievance/:id' },
            updateStatus: { method: 'PUT', path: '/v1/admin/grievance/:id/status' },
            assign: { method: 'PUT', path: '/v1/admin/grievance/:id/assign' },
            delete: { method: 'DELETE', path: '/v1/admin/grievance/:id' },
            stats: { method: 'GET', path: '/v1/admin/grievance/stats' },
          },
          menus: {
            list: { method: 'GET', path: '/v1/admin/menus' },
            get: { method: 'GET', path: '/v1/admin/menus/:id' },
            create: { method: 'POST', path: '/v1/admin/menus' },
            update: { method: 'PUT', path: '/v1/admin/menus/:id' },
            delete: { method: 'DELETE', path: '/v1/admin/menus/:id' },
          },
          qr: {
            list: { method: 'GET', path: '/v1/admin/qr/all' },
            revoke: { method: 'DELETE', path: '/v1/admin/qr/revoke/:id' },
            forceGrant: { method: 'POST', path: '/v1/admin/qr/force-grant' },
            accessLogs: { method: 'GET', path: '/v1/admin/qr/access-logs' },
          },
          safeRoute: {
            list: { method: 'GET', path: '/v1/admin/safe-route/all' },
            stats: { method: 'GET', path: '/v1/admin/safe-route/stats' },
            hotspots: { method: 'GET', path: '/v1/admin/safe-route/hotspots' },
          },
          themes: {
            list: { method: 'GET', path: '/v1/admin/themes' },
            stats: { method: 'GET', path: '/v1/admin/themes/stats' },
            userPreferences: { method: 'GET', path: '/v1/admin/themes/user-preferences' },
            setUserPreference: { method: 'POST', path: '/v1/admin/themes/user-preference' },
            get: { method: 'GET', path: '/v1/admin/themes/:id' },
            create: { method: 'POST', path: '/v1/admin/themes' },
            update: { method: 'PUT', path: '/v1/admin/themes/:id' },
            delete: { method: 'DELETE', path: '/v1/admin/themes/:id' },
            setDefault: { method: 'PUT', path: '/v1/admin/themes/:id/default' },
          },
          childcare: {
            children: { method: 'GET', path: '/v1/admin/childcare/children' },
            child: { method: 'GET', path: '/v1/admin/childcare/children/:id' },
            createChild: { method: 'POST', path: '/v1/admin/childcare/children' },
            updateChild: { method: 'PUT', path: '/v1/admin/childcare/children/:id' },
            deleteChild: { method: 'DELETE', path: '/v1/admin/childcare/children/:id' },
            schedules: { method: 'GET', path: '/v1/admin/childcare/schedules' },
            deleteSchedule: { method: 'DELETE', path: '/v1/admin/childcare/schedules/:id' },
            alerts: { method: 'GET', path: '/v1/admin/childcare/alerts' },
            schoolZones: { method: 'GET', path: '/v1/admin/childcare/school-zones' },
          },
        },
        v2: {},
      },
    };
  }

  getEndpoint(clientType, version, service, action) {
    return this.endpoints[clientType]?.[version]?.[service]?.[action];
  }

  getService(clientType, version, service) {
    return this.endpoints[clientType]?.[version]?.[service];
  }

  getAllServices(clientType, version) {
    return this.endpoints[clientType]?.[version] || {};
  }

  getBasePath(clientType, version) {
    return `/api/${version}/${clientType}`;
  }

  getAvailableVersions() {
    return Object.keys(this.endpoints.mobile);
  }

  getAvailableClients() {
    return Object.keys(this.endpoints);
  }
}

const apiFactory = new ApiFactory();

module.exports = apiFactory;

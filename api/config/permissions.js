// Role definitions
const ROLES = {
    SYSTEM_ADMIN: 'system_admin',
    AGENCY_ADMIN: 'agency_admin',
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    WOMAN: 'woman',
    PARENT: 'parent',
    GUARDIAN: 'guardian',
};

// Permission definitions
const PERMISSIONS = {
    // User Management
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',
    
    // SOS Alerts
    SOS_VIEW: 'sos.view',
    SOS_RESOLVE: 'sos.resolve',
    
    // Content Management
    CONTENT_VIEW: 'content.view',
    CONTENT_CREATE: 'content.create',
    CONTENT_EDIT: 'content.edit',
    CONTENT_DELETE: 'content.delete',
    
    // Grievances
    GRIEVANCES_VIEW: 'grievances.view',
    GRIEVANCES_RESOLVE: 'grievances.resolve',
    GRIEVANCES_DELETE: 'grievances.delete',
    
    // Analytics
    ANALYTICS_VIEW: 'analytics.view',
    
    // Families
    FAMILIES_VIEW: 'families.view',
    FAMILIES_CREATE: 'families.create',
    FAMILIES_EDIT: 'families.edit',
    FAMILIES_DELETE: 'families.delete',
    
    // Home Automation
    HOME_AUTO_VIEW: 'home_auto.view',
    HOME_AUTO_CONTROL: 'home_auto.control',
    
    // Activity Logs
    ACTIVITY_VIEW: 'activity.view',
    
    // Permissions
    PERMISSIONS_MANAGE: 'permissions.manage',
    
    // Settings
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_EDIT: 'settings.edit',
    
    // Users Management
    USER_MANAGEMENT_VIEW: 'user_management.view',
    USER_MANAGEMENT_CREATE: 'user_management.create',
    USER_MANAGEMENT_EDIT: 'user_management.edit',
    USER_MANAGEMENT_DELETE: 'user_management.delete',
    
    // Reports
    REPORTS_VIEW: 'reports.view',
    REPORTS_EXPORT: 'reports.export',
    
    // Backup
    BACKUP_VIEW: 'backup.view',
    BACKUP_CREATE: 'backup.create',
    BACKUP_RESTORE: 'backup.restore',
    
    // System
    SYSTEM_SETTINGS: 'system.settings',
};

// Default role-permission mappings
const ROLE_PERMISSIONS = {
    [ROLES.SYSTEM_ADMIN]: [
        // All permissions
        ...Object.values(PERMISSIONS),
    ],
    [ROLES.AGENCY_ADMIN]: [
        // Full access except system settings
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_EDIT,
        PERMISSIONS.USERS_DELETE,
        PERMISSIONS.SOS_VIEW,
        PERMISSIONS.SOS_RESOLVE,
        PERMISSIONS.CONTENT_VIEW,
        PERMISSIONS.CONTENT_CREATE,
        PERMISSIONS.CONTENT_EDIT,
        PERMISSIONS.CONTENT_DELETE,
        PERMISSIONS.GRIEVANCES_VIEW,
        PERMISSIONS.GRIEVANCES_RESOLVE,
        PERMISSIONS.GRIEVANCES_DELETE,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.FAMILIES_VIEW,
        PERMISSIONS.FAMILIES_CREATE,
        PERMISSIONS.FAMILIES_EDIT,
        PERMISSIONS.FAMILIES_DELETE,
        PERMISSIONS.HOME_AUTO_VIEW,
        PERMISSIONS.HOME_AUTO_CONTROL,
        PERMISSIONS.ACTIVITY_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_EDIT,
        PERMISSIONS.USER_MANAGEMENT_VIEW,
        PERMISSIONS.USER_MANAGEMENT_CREATE,
        PERMISSIONS.USER_MANAGEMENT_EDIT,
        PERMISSIONS.USER_MANAGEMENT_DELETE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.BACKUP_VIEW,
        PERMISSIONS.BACKUP_CREATE,
    ],
    [ROLES.ADMIN]: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_EDIT,
        PERMISSIONS.SOS_VIEW,
        PERMISSIONS.SOS_RESOLVE,
        PERMISSIONS.CONTENT_VIEW,
        PERMISSIONS.CONTENT_CREATE,
        PERMISSIONS.CONTENT_EDIT,
        PERMISSIONS.CONTENT_DELETE,
        PERMISSIONS.GRIEVANCES_VIEW,
        PERMISSIONS.GRIEVANCES_RESOLVE,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.FAMILIES_VIEW,
        PERMISSIONS.FAMILIES_CREATE,
        PERMISSIONS.FAMILIES_EDIT,
        PERMISSIONS.FAMILIES_DELETE,
        PERMISSIONS.HOME_AUTO_VIEW,
        PERMISSIONS.HOME_AUTO_CONTROL,
        PERMISSIONS.ACTIVITY_VIEW,
        PERMISSIONS.PERMISSIONS_MANAGE,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_EDIT,
        PERMISSIONS.USER_MANAGEMENT_VIEW,
        PERMISSIONS.USER_MANAGEMENT_CREATE,
        PERMISSIONS.USER_MANAGEMENT_EDIT,
        PERMISSIONS.USER_MANAGEMENT_DELETE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
    ],
    [ROLES.SUPERVISOR]: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.SOS_VIEW,
        PERMISSIONS.SOS_RESOLVE,
        PERMISSIONS.CONTENT_VIEW,
        PERMISSIONS.GRIEVANCES_VIEW,
        PERMISSIONS.GRIEVANCES_RESOLVE,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.FAMILIES_VIEW,
        PERMISSIONS.HOME_AUTO_VIEW,
        PERMISSIONS.ACTIVITY_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.REPORTS_VIEW,
    ],
    [ROLES.WOMAN]: [
        PERMISSIONS.SOS_VIEW,
        PERMISSIONS.CONTENT_VIEW,
        PERMISSIONS.FAMILIES_VIEW,
        PERMISSIONS.HOME_AUTO_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_EDIT,
    ],
    [ROLES.PARENT]: [
        PERMISSIONS.SOS_VIEW,
        PERMISSIONS.CONTENT_VIEW,
        PERMISSIONS.FAMILIES_VIEW,
        PERMISSIONS.FAMILIES_CREATE,
        PERMISSIONS.FAMILIES_EDIT,
        PERMISSIONS.HOME_AUTO_VIEW,
        PERMISSIONS.HOME_AUTO_CONTROL,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_EDIT,
    ],
    [ROLES.GUARDIAN]: [
        PERMISSIONS.SOS_VIEW,
        PERMISSIONS.CONTENT_VIEW,
        PERMISSIONS.FAMILIES_VIEW,
        PERMISSIONS.HOME_AUTO_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
    ],
};

// Helper functions
const hasPermission = (role, permission) => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    return rolePerms.includes(permission);
};

const hasAnyPermission = (role, permissions) => {
    return permissions.some(p => hasPermission(role, p));
};

const hasAllPermissions = (role, permissions) => {
    return permissions.every(p => hasPermission(role, p));
};

const getRolePermissions = (role) => {
    return ROLE_PERMISSIONS[role] || [];
};

// Role display names
const ROLE_DISPLAY_NAMES = {
    [ROLES.SYSTEM_ADMIN]: 'System Administrator',
    [ROLES.AGENCY_ADMIN]: 'Agency Administrator',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.SUPERVISOR]: 'Supervisor',
    [ROLES.WOMAN]: 'Women Safety User',
    [ROLES.PARENT]: 'Parent',
    [ROLES.GUARDIAN]: 'Guardian',
};

// Role hierarchy (higher number = more powerful)
const ROLE_HIERARCHY = {
    [ROLES.SYSTEM_ADMIN]: 7,
    [ROLES.AGENCY_ADMIN]: 6,
    [ROLES.ADMIN]: 5,
    [ROLES.SUPERVISOR]: 4,
    [ROLES.PARENT]: 3,
    [ROLES.GUARDIAN]: 2,
    [ROLES.WOMAN]: 1,
};

const isHigherRole = (role1, role2) => {
    return (ROLE_HIERARCHY[role1] || 0) > (ROLE_HIERARCHY[role2] || 0);
};

const canManageRole = (managerRole, targetRole) => {
    return isHigherRole(managerRole, targetRole);
};

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    ROLE_DISPLAY_NAMES,
    ROLE_HIERARCHY,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getRolePermissions,
    isHigherRole,
    canManageRole,
};

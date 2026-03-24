-- QR Code Permission System Tables

-- QR Tokens table
CREATE TABLE IF NOT EXISTS qr_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    token_type ENUM('profile', 'permission', 'emergency', 'temp_access') DEFAULT 'profile',
    permissions JSON,
    expires_at DATETIME,
    max_uses INT DEFAULT NULL,
    use_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    qr_data TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- QR Scan History
CREATE TABLE IF NOT EXISTS qr_scans (
    id VARCHAR(36) PRIMARY KEY,
    qr_token_id VARCHAR(36) NOT NULL,
    scanner_user_id VARCHAR(36),
    scanner_ip VARCHAR(45),
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_granted BOOLEAN DEFAULT FALSE,
    access_denied_reason VARCHAR(255),
    FOREIGN KEY (qr_token_id) REFERENCES qr_tokens(id) ON DELETE CASCADE,
    FOREIGN KEY (scanner_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Permission Grants (explicit user-to-user permissions)
CREATE TABLE IF NOT EXISTS permission_grants (
    id VARCHAR(36) PRIMARY KEY,
    grantor_id VARCHAR(36) NOT NULL,
    grantee_id VARCHAR(36) NOT NULL,
    permission_type ENUM('view_profile', 'view_location', 'emergency_access', 'track') NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at DATETIME,
    revoked_by VARCHAR(36),
    FOREIGN KEY (grantor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (grantee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Access Logs
CREATE TABLE IF NOT EXISTS access_logs (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    accessor_id VARCHAR(36),
    accessor_name VARCHAR(100),
    access_type ENUM('qr_scan', 'direct_request', 'admin_override') NOT NULL,
    resource_accessed VARCHAR(100),
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_result ENUM('granted', 'denied', 'expired', 'revoked') NOT NULL,
    metadata JSON,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin Actions on QR/Permissions
CREATE TABLE IF NOT EXISTS admin_actions (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    target_user_id VARCHAR(36),
    target_qr_id VARCHAR(36),
    action_type ENUM('create_qr', 'revoke_qr', 'modify_permissions', 'force_grant', 'force_revoke', 'view_user_qrs') NOT NULL,
    action_details JSON,
    performed_at DATESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_qr_tokens_user ON qr_tokens(user_id);
CREATE INDEX idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX idx_qr_tokens_expires ON qr_tokens(expires_at);
CREATE INDEX idx_permission_grants_grantor ON permission_grants(grantor_id);
CREATE INDEX idx_permission_grants_grantee ON permission_grants(grantee_id);
CREATE INDEX idx_access_logs_owner ON access_logs(owner_id);

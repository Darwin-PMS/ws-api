-- Quick Install Script for Tracking Module
-- Run this in phpMyAdmin or MySQL command line

USE safety_app_new;

-- 1. User Locations Table
CREATE TABLE IF NOT EXISTS user_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    `status` ENUM('safe', 'danger', 'sos') DEFAULT 'safe',
    address VARCHAR(255),
    speed DECIMAL(5, 2),
    accuracy DECIMAL(5, 2),
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status (`status`),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Emergency Services Table
CREATE TABLE IF NOT EXISTS emergency_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    `type` ENUM('police', 'hospital', 'safe_zone', 'fire_station') NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (`type`),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Geofences Table
CREATE TABLE IF NOT EXISTS geofences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    `type` ENUM('safe', 'unsafe', 'restricted', 'custom') NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (`type`),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Geofence Violations Table
CREATE TABLE IF NOT EXISTS geofence_violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    geofence_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    violation_type ENUM('entry', 'exit') NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timestamp DATETIME NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_geofence (geofence_id),
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SOS Alert Locations Table
-- Note: Foreign keys removed to avoid dependency on sos_alerts table
CREATE TABLE IF NOT EXISTS sos_alert_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sos_alert_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(5, 2),
    address VARCHAR(255),
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sos_alert (sos_alert_id),
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Emergency Services
INSERT INTO emergency_services (name, `type`, latitude, longitude, address, phone, is_active, verified) VALUES
('Delhi Police Headquarters', 'police', 28.6289, 77.2190, 'ITO, New Delhi, Delhi 110002', '100', TRUE, TRUE),
('Connaught Place Police Station', 'police', 28.6328, 77.2197, 'Connaught Place, New Delhi, Delhi 110001', '011-23412345', TRUE, TRUE),
('AIIMS Delhi', 'hospital', 28.5672, 77.2100, 'Ansari Nagar, New Delhi, Delhi 110029', '011-26588500', TRUE, TRUE),
('Safdarjung Hospital', 'hospital', 28.5729, 77.2072, 'Safdarjung Enclave, New Delhi, Delhi 110029', '011-26165060', TRUE, TRUE),
('Delhi Metro Station - CP', 'safe_zone', 28.6328, 77.2197, 'Connaught Place Metro Station', '155370', TRUE, TRUE);

-- Insert Sample Geofences
INSERT INTO geofences (name, `type`, latitude, longitude, radius, description, is_active) VALUES
('Home Safe Zone', 'safe', 28.6139, 77.2090, 500, 'Safe zone around home area', TRUE),
('Office Safe Zone', 'safe', 28.6289, 77.2190, 300, 'Safe zone around office', TRUE),
('High Risk Area', 'unsafe', 28.5672, 77.2100, 1000, 'Avoid this area at night', TRUE);

-- Create View for Latest Locations
CREATE OR REPLACE VIEW v_latest_user_locations AS
SELECT 
    ul.*,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.role
FROM user_locations ul
INNER JOIN users u ON ul.user_id = u.id
WHERE ul.timestamp = (
    SELECT MAX(timestamp)
    FROM user_locations
    WHERE user_id = ul.user_id
);

SELECT '✓ Tracking tables created successfully!' as status;

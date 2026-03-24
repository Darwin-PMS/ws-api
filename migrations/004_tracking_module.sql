-- Tracking Module Database Migration
-- This migration creates tables for real-time user tracking, geofencing, and emergency services

-- User Locations Table
-- Stores real-time location data for users
CREATE TABLE IF NOT EXISTS user_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status ENUM('safe', 'danger', 'sos') DEFAULT 'safe',
    address VARCHAR(255),
    speed DECIMAL(5, 2), -- Speed in km/h
    accuracy DECIMAL(5, 2), -- Accuracy in meters
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status (status),
    INDEX idx_user_timestamp (user_id, timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Emergency Services Table
-- Stores locations of police stations, hospitals, and safe zones
CREATE TABLE IF NOT EXISTS emergency_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('police', 'hospital', 'safe_zone', 'fire_station') NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_location (latitude, longitude),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Geofences Table
-- Stores geographic boundaries for safe/unsafe zones
CREATE TABLE IF NOT EXISTS geofences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('safe', 'unsafe', 'restricted', 'custom') NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INT NOT NULL, -- Radius in meters
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    alert_on_entry BOOLEAN DEFAULT TRUE,
    alert_on_exit BOOLEAN DEFAULT TRUE,
    notification_emails TEXT, -- Comma-separated list
    notification_phones TEXT, -- Comma-separated list
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_location (latitude, longitude),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Geofence Violations Table
-- Logs when users enter/exit geofenced areas
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
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SOS Alert Locations Table
-- Stores location data specifically for SOS alerts
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
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (sos_alert_id) REFERENCES sos_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample emergency services data
INSERT INTO emergency_services (name, type, latitude, longitude, address, phone, is_active, verified) VALUES
-- Police Stations in Delhi
('Delhi Police Headquarters', 'police', 28.6289, 77.2190, 'ITO, New Delhi, Delhi 110002', '100', TRUE, TRUE),
('Connaught Place Police Station', 'police', 28.6328, 77.2197, 'Connaught Place, New Delhi, Delhi 110001', '011-23412345', TRUE, TRUE),
('Karol Bagh Police Station', 'police', 28.6519, 77.1909, 'Karol Bagh, New Delhi, Delhi 110005', '011-25751234', TRUE, TRUE),

-- Hospitals in Delhi
('AIIMS Delhi', 'hospital', 28.5672, 77.2100, 'Ansari Nagar, New Delhi, Delhi 110029', '011-26588500', TRUE, TRUE),
('Safdarjung Hospital', 'hospital', 28.5729, 77.2072, 'Safdarjung Enclave, New Delhi, Delhi 110029', '011-26165060', TRUE, TRUE),
('Ram Manohar Lohia Hospital', 'hospital', 28.6219, 77.2073, 'Baba Kharak Singh Marg, New Delhi, Delhi 110001', '011-23365525', TRUE, TRUE),

-- Safe Zones in Delhi
('Delhi Metro Station - CP', 'safe_zone', 28.6328, 77.2197, 'Connaught Place Metro Station', '155370', TRUE, TRUE),
('Select Citywalk Mall', 'safe_zone', 28.5562, 77.2690, 'Saket, New Delhi, Delhi 110017', '011-40504050', TRUE, TRUE),
('DLF Promenade Mall', 'safe_zone', 28.5562, 77.2690, 'Vasant Kunj, New Delhi, Delhi 110070', '011-46064060', TRUE, TRUE);

-- Insert sample geofences
INSERT INTO geofences (name, type, latitude, longitude, radius, description, is_active) VALUES
('Home Safe Zone', 'safe', 28.6139, 77.2090, 500, 'Safe zone around home area', TRUE),
('Office Safe Zone', 'safe', 28.6289, 77.2190, 300, 'Safe zone around office', TRUE),
('School Safe Zone', 'safe', 28.6328, 77.2197, 400, 'Safe zone around school', TRUE),
('High Risk Area', 'unsafe', 28.5672, 77.2100, 1000, 'Avoid this area at night', TRUE);

-- Create view for latest user locations
CREATE OR REPLACE VIEW v_latest_user_locations AS
SELECT 
    ul.*,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.role,
    fm.family_id,
    f.name as family_name
FROM user_locations ul
INNER JOIN users u ON ul.user_id = u.id
LEFT JOIN family_members fm ON u.id = fm.user_id
LEFT JOIN families f ON fm.family_id = f.id
WHERE ul.timestamp = (
    SELECT MAX(timestamp)
    FROM user_locations
    WHERE user_id = ul.user_id
);

-- Create stored procedure to clean up old location data
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_cleanup_old_locations(IN days_to_keep INT)
BEGIN
    DELETE FROM user_locations
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    DELETE FROM geofence_violations
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    DELETE FROM sos_alert_locations
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
END //
DELIMITER ;

-- Create trigger to auto-create SOS alert location when SOS is triggered
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_sos_location_after_insert
AFTER INSERT ON sos_alerts
FOR EACH ROW
BEGIN
    INSERT INTO sos_alert_locations (sos_alert_id, user_id, latitude, longitude, address, timestamp)
    VALUES (NEW.id, NEW.user_id, NEW.latitude, NEW.longitude, NEW.location, NEW.created_at);
END //
DELIMITER ;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON user_locations TO 'your_user'@'localhost';
-- GRANT SELECT ON emergency_services TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON geofences TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT ON geofence_violations TO 'your_user'@'localhost';

-- Display created tables
SELECT 'Tracking tables created successfully!' as status;

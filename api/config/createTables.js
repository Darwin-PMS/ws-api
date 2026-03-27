const { getPool } = require('./db');

/**
 * Create all database tables
 * This function checks if tables exist before creating them
 * Should be run once when needed, not every time the server starts
 */
async function createTables() {
    const pool = getPool();

    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                role ENUM('woman', 'parent', 'guardian', 'friend', 'admin') DEFAULT 'woman',
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                verification_code VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_email (email),
                KEY idx_role (role),
                KEY idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Emergency contacts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS emergency_contacts (
                id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                relationship VARCHAR(50),
                is_primary BOOLEAN DEFAULT FALSE,
                notes TEXT,
                is_verified BOOLEAN DEFAULT FALSE,
                contact_type ENUM('personal', 'family', 'friend', 'work', 'emergency') DEFAULT 'personal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_emergency_contacts_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Default emergency contacts (system-wide)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS default_emergency_contacts (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                description VARCHAR(255),
                country VARCHAR(50) DEFAULT 'India',
                service_type VARCHAR(50) DEFAULT 'emergency',
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                icon VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // User emergency preferences
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_emergency_preferences (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                enable_sos BOOLEAN DEFAULT TRUE,
                auto_share_location BOOLEAN DEFAULT FALSE,
                notify_emergency_contacts BOOLEAN DEFAULT TRUE,
                sos_sound_enabled BOOLEAN DEFAULT TRUE,
                sos_vibration_enabled BOOLEAN DEFAULT TRUE,
                emergency_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_preferences (user_id)
            )
        `);

        // Guardians table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guardians (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                guardian_id VARCHAR(36) NOT NULL,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // SOS Alerts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sos_alerts (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
                message TEXT,
                resolved_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Location history table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS location_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                accuracy DECIMAL(6,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // User locations table (for tracking with status, speed, heading, address)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                status ENUM('safe', 'danger', 'sos') DEFAULT 'safe',
                address VARCHAR(255),
                speed DECIMAL(6,2) DEFAULT 0,
                heading DECIMAL(5,2) DEFAULT 0,
                accuracy DECIMAL(6,2),
                timestamp DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_locations_user (user_id),
                INDEX idx_user_locations_timestamp (timestamp),
                INDEX idx_user_locations_status (status)
            )
        `);

        // Current location table (stores latest location for each user)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_current_location (
                user_id VARCHAR(36) PRIMARY KEY,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                accuracy DECIMAL(6,2),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Children table (for parents)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS children (
                id VARCHAR(36) PRIMARY KEY,
                parent_id VARCHAR(36) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100),
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                blood_group VARCHAR(10),
                allergies TEXT,
                medications TEXT,
                emergency_contact VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Child schedules table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS child_schedules (
                id VARCHAR(36) PRIMARY KEY,
                child_id VARCHAR(36) NOT NULL,
                parent_id VARCHAR(36) NOT NULL,
                title VARCHAR(200) NOT NULL,
                schedule_time TIME NOT NULL,
                repeat_days TEXT,
                alert_type ENUM('notification', 'sms', 'both') DEFAULT 'notification',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Child alerts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS child_alerts (
                id VARCHAR(36) PRIMARY KEY,
                child_id VARCHAR(36) NOT NULL,
                parent_id VARCHAR(36) NOT NULL,
                alert_type ENUM('school_arrival', 'school_departure', 'safety_concern', 'emergency', 'schedule', 'location') NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Child locations table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS child_locations (
                id VARCHAR(36) PRIMARY KEY,
                child_id VARCHAR(36) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                location_type VARCHAR(50) DEFAULT 'current',
                address VARCHAR(255),
                timestamp DATETIME NOT NULL,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
            )
        `);

        // Child school zones (geofence)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS child_school_zones (
                id VARCHAR(36) PRIMARY KEY,
                child_id VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                radius INT DEFAULT 200,
                type ENUM('school', 'home', 'other') DEFAULT 'school',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
            )
        `);

        // Child safety checks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS child_safety_checks (
                id VARCHAR(36) PRIMARY KEY,
                child_id VARCHAR(36) NOT NULL,
                parent_id VARCHAR(36) NOT NULL,
                check_in_time DATETIME,
                check_out_time DATETIME,
                status ENUM('checked_in', 'checked_out', 'absent') DEFAULT 'checked_in',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Child activities table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS child_activities (
                id VARCHAR(36) PRIMARY KEY,
                child_id VARCHAR(36) NOT NULL,
                activity_type ENUM('feeding', 'sleep', 'medicine', 'diaper', 'other') NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
            )
        `);

        // Notifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT,
                type ENUM('sos', 'safety', 'system', 'child') DEFAULT 'system',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Geofences table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS geofences (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                radius INT DEFAULT 100,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) UNIQUE NOT NULL,
                notification_enabled BOOLEAN DEFAULT TRUE,
                location_sharing BOOLEAN DEFAULT TRUE,
                auto_sos BOOLEAN DEFAULT FALSE,
                shake_to_sos BOOLEAN DEFAULT FALSE,
                sos_timer INT DEFAULT 30,
                shake_sensitivity INT DEFAULT 3,
                volume_press_enabled BOOLEAN DEFAULT FALSE,
                power_press_enabled BOOLEAN DEFAULT FALSE,
                voice_enabled BOOLEAN DEFAULT FALSE,
                auto_sos_enabled BOOLEAN DEFAULT FALSE,
                family_agent_enabled BOOLEAN DEFAULT TRUE,
                location_enabled BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // App settings table (global application settings)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                id VARCHAR(36) PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                description TEXT,
                is_encrypted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Insert default Groq API key if not exists
        await pool.query(`
            INSERT INTO app_settings (id, setting_key, setting_value, description, is_encrypted)
            SELECT UUID(), 'groq_key', '', 'Groq API key for AI chat functionality', TRUE
            WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE setting_key = 'groq_key')
        `);

        // Refresh tokens table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(500) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Password reset tokens table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(500) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Activity logs table - for admin activity tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36),
                action VARCHAR(100) NOT NULL,
                description TEXT,
                ip_address VARCHAR(45),
                user_agent VARCHAR(500),
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Home automation devices table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS home_devices (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL,
                device_type ENUM('light', 'fan', 'ac', 'door', 'camera', 'thermostat', 'plug', 'sensor') NOT NULL,
                room VARCHAR(100) DEFAULT 'Living Room',
                status ENUM('on', 'off') DEFAULT 'off',
                brightness INT DEFAULT 100,
                speed INT DEFAULT 0,
                temperature INT DEFAULT 24,
                is_locked BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Families table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS families (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                created_by VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Family members table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS family_members (
                id VARCHAR(36) PRIMARY KEY,
                family_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                role ENUM('head', 'member') DEFAULT 'member',
                nickname VARCHAR(100),
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_family_user (family_id, user_id),
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Family relationships table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS family_relationships (
                id VARCHAR(36) PRIMARY KEY,
                family_id VARCHAR(36) NOT NULL,
                from_user_id VARCHAR(36) NOT NULL,
                to_user_id VARCHAR(36) NOT NULL,
                relationship_type ENUM('parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'other') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_relationship (family_id, from_user_id, to_user_id, relationship_type),
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Family places table - for family-specific locations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS family_places (
                id VARCHAR(36) PRIMARY KEY,
                family_id VARCHAR(36) NOT NULL,
                name VARCHAR(150) NOT NULL,
                place_type ENUM('home', 'school', 'daycare', 'park', 'clinic', 'hospital', 'relative_home', 'work', 'sports', 'other') NOT NULL,
                address TEXT,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                radius_meters INT DEFAULT 100,
                privacy_tag ENUM('do_not_log') DEFAULT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_by VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Context snapshots table - store detected contexts
        await pool.query(`
            CREATE TABLE IF NOT EXISTS context_snapshots (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                family_id VARCHAR(36) NOT NULL,
                place_id VARCHAR(36),
                place_type VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activity_type ENUM('arriving', 'leaving', 'dwell', 'transit') DEFAULT 'dwell',
                candidate_context_types JSON,
                confidence DECIMAL(3, 2) DEFAULT 0.50,
                raw_event_ids JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                FOREIGN KEY (place_id) REFERENCES family_places(id) ON DELETE SET NULL
            )
        `);

        // Suggestions table - AI-generated suggestions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suggestions (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                family_id VARCHAR(36) NOT NULL,
                context_id VARCHAR(36),
                type ENUM('log_activity', 'reminder', 'safety_prompt', 'photo_suggestion') NOT NULL,
                title VARCHAR(200) NOT NULL,
                body TEXT,
                status ENUM('pending', 'shown', 'accepted', 'dismissed', 'snoozed') DEFAULT 'pending',
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                shown_at TIMESTAMP NULL,
                resolved_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                FOREIGN KEY (context_id) REFERENCES context_snapshots(id) ON DELETE SET NULL
            )
        `);

        // Family activity logs table - stored activities
        await pool.query(`
            CREATE TABLE IF NOT EXISTS family_activity_logs (
                id VARCHAR(36) PRIMARY KEY,
                family_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                context_id VARCHAR(36),
                activity_type VARCHAR(100) NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                started_at TIMESTAMP NOT NULL,
                ended_at TIMESTAMP NULL,
                place_id VARCHAR(36),
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (context_id) REFERENCES context_snapshots(id) ON DELETE SET NULL,
                FOREIGN KEY (place_id) REFERENCES family_places(id) ON DELETE SET NULL
            )
        `);

        // Consent settings table - privacy controls
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consent_settings (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) UNIQUE NOT NULL,
                location_enabled BOOLEAN DEFAULT FALSE,
                activity_enabled BOOLEAN DEFAULT FALSE,
                calendar_enabled BOOLEAN DEFAULT FALSE,
                analytics_enabled BOOLEAN DEFAULT FALSE,
                family_agent_enabled BOOLEAN DEFAULT TRUE,
                quiet_hours_start TIME NULL,
                quiet_hours_end TIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Audit logs table - track all actions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36),
                family_id VARCHAR(36),
                action VARCHAR(100) NOT NULL,
                target_type VARCHAR(50) NOT NULL,
                target_id VARCHAR(36),
                metadata JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL
            )
        `);

        // Themes table - store dynamic themes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS themes (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                is_default BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                config JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Menus table - store dynamic menu configurations with parent support
        await pool.query(`
            CREATE TABLE IF NOT EXISTS menus (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                items JSON NOT NULL CHECK (json_valid(items)),
                parent_id VARCHAR(36) DEFAULT NULL,
                menu_order INT DEFAULT 0,
                bg_color VARCHAR(20) DEFAULT '#8B5CF6',
                text_color VARCHAR(20) DEFAULT '#FFFFFF',
                hover_bg_color VARCHAR(20) DEFAULT '#7C3AED',
                hover_text_color VARCHAR(20) DEFAULT '#FFFFFF',
                label VARCHAR(100),
                route VARCHAR(100),
                icon VARCHAR(50),
                subtitle VARCHAR(255),
                purpose ENUM('home', 'more', 'profile') DEFAULT 'more',
                menu_for ENUM('web', 'mobile') DEFAULT 'mobile',
                is_visible BOOLEAN DEFAULT TRUE,
                required_flags JSON CHECK (json_valid(required_flags) or required_flags is null),
                required_permissions JSON CHECK (json_valid(required_permissions) or required_permissions is null),
                required_roles JSON CHECK (json_valid(required_roles) or required_roles is null),
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Create indexes for menu performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_menus_type ON menus(type)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_menus_parent ON menus(parent_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_menus_order ON menus(menu_order)`);

        // Role permissions table - store role-based access control
        await pool.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                id VARCHAR(36) PRIMARY KEY,
                role VARCHAR(50) NOT NULL,
                flags JSON,
                base_permissions JSON,
                ui_restrictions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_role (role)
            )
        `);

        // Safety laws table - store safety laws and regulations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS safety_laws (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                content TEXT,
                category VARCHAR(100),
                jurisdiction VARCHAR(100),
                effective_date DATE,
                penalty TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_safety_laws_category (category),
                INDEX idx_safety_laws_jurisdiction (jurisdiction),
                INDEX idx_safety_laws_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Safety news table - store safety-related news articles
        await pool.query(`
            CREATE TABLE IF NOT EXISTS safety_news (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                content TEXT,
                category VARCHAR(100),
                image_url VARCHAR(500),
                author VARCHAR(100),
                source VARCHAR(100),
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_featured BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                views_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_safety_news_category (category),
                INDEX idx_safety_news_featured (is_featured),
                INDEX idx_safety_news_published (published_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Safety tutorials table - store safety tutorials and guides
        await pool.query(`
            CREATE TABLE IF NOT EXISTS safety_tutorials (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                content TEXT,
                category VARCHAR(100),
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                duration INT DEFAULT 0,
                difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
                is_premium BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_safety_tutorials_category (category),
                INDEX idx_safety_tutorials_difficulty (difficulty)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // User behavior settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_behavior_settings (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                monitoring_enabled BOOLEAN DEFAULT FALSE,
                detection_settings JSON,
                sensitivity_settings JSON,
                alert_settings JSON,
                notification_settings JSON,
                privacy_settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_behavior (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Banners table - for home screen carousel
        await pool.query(`
            CREATE TABLE IF NOT EXISTS banners (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                subtitle VARCHAR(255),
                background_color VARCHAR(20) DEFAULT '#667eea',
                image_url VARCHAR(500),
                cta_text VARCHAR(50),
                cta_action VARCHAR(100),
                display_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                start_date TIMESTAMP NULL,
                end_date TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_banners_order (display_order),
                INDEX idx_banners_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Behavior patterns table - store learned user patterns
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_patterns (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                pattern_type ENUM('route', 'commute', 'schedule', 'location', 'activity') NOT NULL,
                pattern_data JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_behavior_patterns_user (user_id),
                INDEX idx_behavior_patterns_type (pattern_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Anomaly events table - store detected anomalies
        await pool.query(`
            CREATE TABLE IF NOT EXISTS anomaly_events (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                anomaly_type VARCHAR(50) NOT NULL,
                severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                location_name VARCHAR(200),
                speed DECIMAL(6, 2),
                duration_minutes INT,
                context_data JSON,
                ai_analysis TEXT,
                is_confirmed BOOLEAN DEFAULT NULL,
                confirmed_at TIMESTAMP NULL,
                feedback_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_anomaly_events_user (user_id),
                INDEX idx_anomaly_events_type (anomaly_type),
                INDEX idx_anomaly_events_severity (severity),
                INDEX idx_anomaly_events_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Behavior trusted contacts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_trusted_contacts (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                contact_id VARCHAR(36) NOT NULL,
                notify_on_anomaly BOOLEAN DEFAULT TRUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES emergency_contacts(id) ON DELETE CASCADE,
                UNIQUE KEY unique_behavior_contact (user_id, contact_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Behavior alerts table - store alerts sent to contacts
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_alerts (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                anomaly_id VARCHAR(36) NOT NULL,
                alert_type VARCHAR(50) NOT NULL,
                recipient_type VARCHAR(50) NOT NULL,
                recipient_id VARCHAR(36),
                recipient_name VARCHAR(100),
                recipient_phone VARCHAR(20),
                message TEXT,
                status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
                severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
                metadata JSON,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_behavior_alerts_user (user_id),
                INDEX idx_behavior_alerts_anomaly (anomaly_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Live streaming sessions table - store live safety share sessions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS live_stream_sessions (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(50) NOT NULL UNIQUE,
                token VARCHAR(100) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                user_name VARCHAR(100),
                contact_ids JSON,
                status ENUM('active', 'stopped', 'expired') DEFAULT 'active',
                location JSON,
                streams JSON,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                stopped_at TIMESTAMP NULL,
                duration INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_live_sessions_user (user_id),
                INDEX idx_live_sessions_status (status),
                INDEX idx_live_sessions_session_id (session_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Live stream viewers table - store who is viewing each stream
        await pool.query(`
            CREATE TABLE IF NOT EXISTS live_stream_viewers (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(50) NOT NULL,
                viewer_id VARCHAR(36),
                viewer_name VARCHAR(100),
                viewer_phone VARCHAR(20),
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES live_stream_sessions(session_id) ON DELETE CASCADE,
                INDEX idx_live_viewers_session (session_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Behavior feedback table - store user feedback on anomalies
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_feedback (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                anomaly_id VARCHAR(36) NOT NULL,
                feedback_type ENUM('accurate', 'false_positive', 'partial') NOT NULL,
                user_notes TEXT,
                expected_behavior TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (anomaly_id) REFERENCES anomaly_events(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // User themes table - store user-specific theme selections
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_themes (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                theme_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_theme (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Permissions table - store user-specific permissions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS permissions (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                flags JSON,
                base_permissions JSON,
                ui_restrictions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_permissions (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Geographic areas table - store geographic regions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS geographic_areas (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                code VARCHAR(50),
                boundaries JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_geographic_areas_type (type),
                INDEX idx_geographic_areas_code (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // User area assignments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_area_assignments (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                area_id VARCHAR(36) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                role_in_area ENUM('admin', 'police', 'supervisor', 'village_head', 'guardian', 'member') DEFAULT 'member',
                is_primary BOOLEAN DEFAULT FALSE,
                assigned_by VARCHAR(36) NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (area_id) REFERENCES geographic_areas(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_area (user_id, area_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // SOS cases table - track SOS incidents
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sos_cases (
                id VARCHAR(36) PRIMARY KEY,
                victim_user_id VARCHAR(36) NOT NULL,
                area_id VARCHAR(36),
                status ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                FOREIGN KEY (victim_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (area_id) REFERENCES geographic_areas(id) ON DELETE SET NULL,
                INDEX idx_sos_cases_victim (victim_user_id),
                INDEX idx_sos_cases_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Cylinder verifications table - for gas cylinder safety verification
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cylinder_verifications (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                cylinder_number VARCHAR(50),
                verification_result ENUM('genuine', 'suspected', 'invalid', 'pending') DEFAULT 'pending',
                expiry_date DATE,
                confidence_score DECIMAL(5, 2),
                image_url TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_cylinder_verifications_user (user_id),
                INDEX idx_cylinder_verifications_result (verification_result)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Grievances table - for user complaints and feedback
        await pool.query(`
            CREATE TABLE IF NOT EXISTS grievances (
                id VARCHAR(36) PRIMARY KEY,
                case_id VARCHAR(20) UNIQUE,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(50),
                status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending',
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                assigned_to VARCHAR(36),
                resolution_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_grievances_user (user_id),
                INDEX idx_grievances_status (status),
                INDEX idx_grievances_priority (priority),
                INDEX idx_grievances_case_id (case_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Grievance messages table - for conversations/comments on grievances
        await pool.query(`
            CREATE TABLE IF NOT EXISTS grievance_messages (
                id VARCHAR(36) PRIMARY KEY,
                grievance_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                message TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_grievance_messages_grievance (grievance_id),
                INDEX idx_grievance_messages_user (user_id),
                INDEX idx_grievance_messages_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Thought records table - for AI-powered thought journaling
        await pool.query(`
            CREATE TABLE IF NOT EXISTS thought_records (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                category VARCHAR(50) NOT NULL,
                thought_text TEXT NOT NULL,
                ai_response TEXT,
                mood VARCHAR(50),
                is_favorite BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_thought_records_user (user_id),
                INDEX idx_thought_records_category (category),
                INDEX idx_thought_records_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Session history table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS session_history (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                session_id VARCHAR(36) NOT NULL,
                ip_address VARCHAR(45),
                user_agent VARCHAR(500),
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                logout_time TIMESTAMP NULL,
                duration INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_session_history_user (user_id),
                INDEX idx_session_history_session (session_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // QR Tokens table - for QR-based permission system
        await pool.query(`
            CREATE TABLE IF NOT EXISTS qr_tokens (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(255) NOT NULL,
                token_type ENUM('profile', 'permission', 'emergency', 'temp_access') DEFAULT 'profile',
                permissions JSON,
                expires_at DATETIME,
                max_uses INT,
                use_count INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                qr_data TEXT,
                created_by VARCHAR(36) NOT NULL,
                last_used_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_qr_tokens_user (user_id),
                INDEX idx_qr_tokens_token (token(64)),
                INDEX idx_qr_tokens_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // QR Scans table - log of QR code scans
        await pool.query(`
            CREATE TABLE IF NOT EXISTS qr_scans (
                id VARCHAR(36) PRIMARY KEY,
                token_id VARCHAR(36) NOT NULL,
                scanned_by VARCHAR(36),
                scan_result ENUM('success', 'expired', 'revoked', 'invalid') DEFAULT 'success',
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                FOREIGN KEY (token_id) REFERENCES qr_tokens(id) ON DELETE CASCADE,
                FOREIGN KEY (scanned_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_qr_scans_token (token_id),
                INDEX idx_qr_scans_scanner (scanned_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Permission Grants table - track user-to-user permission grants
        await pool.query(`
            CREATE TABLE IF NOT EXISTS permission_grants (
                id VARCHAR(36) PRIMARY KEY,
                grantor_id VARCHAR(36) NOT NULL,
                grantee_id VARCHAR(36) NOT NULL,
                permission_type VARCHAR(50) NOT NULL,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked_at DATETIME,
                revoked_by VARCHAR(36),
                FOREIGN KEY (grantor_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (grantee_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_permission_grant (grantor_id, grantee_id, permission_type),
                INDEX idx_permission_grants_grantor (grantor_id),
                INDEX idx_permission_grants_grantee (grantee_id),
                INDEX idx_permission_grants_type (permission_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Access Logs table - audit trail for all access attempts
        await pool.query(`
            CREATE TABLE IF NOT EXISTS access_logs (
                id VARCHAR(36) PRIMARY KEY,
                owner_id VARCHAR(36) NOT NULL,
                accessor_id VARCHAR(36),
                accessor_name VARCHAR(100),
                access_type VARCHAR(50) NOT NULL,
                resource_accessed VARCHAR(100),
                access_result ENUM('granted', 'denied', 'expired', 'revoked') NOT NULL,
                metadata JSON,
                accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (accessor_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_access_logs_owner (owner_id),
                INDEX idx_access_logs_accessor (accessor_id),
                INDEX idx_access_logs_type (access_type),
                INDEX idx_access_logs_result (access_result)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Admin Actions table - track admin actions for audit
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_actions (
                id VARCHAR(36) PRIMARY KEY,
                admin_id VARCHAR(36) NOT NULL,
                target_user_id VARCHAR(36),
                target_qr_id VARCHAR(36),
                action_type VARCHAR(50) NOT NULL,
                action_details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_admin_actions_admin (admin_id),
                INDEX idx_admin_actions_target (target_user_id),
                INDEX idx_admin_actions_type (action_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Route Analysis History table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS route_analysis_history (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                origin_lat DECIMAL(10, 8) NOT NULL,
                origin_lng DECIMAL(11, 8) NOT NULL,
                origin_name VARCHAR(255),
                dest_lat DECIMAL(10, 8) NOT NULL,
                dest_lng DECIMAL(11, 8) NOT NULL,
                dest_name VARCHAR(255),
                mode ENUM('walking', 'driving', 'transit') DEFAULT 'walking',
                safety_score DECIMAL(5, 2),
                recommendations JSON,
                distance DECIMAL(8, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_route_history_user (user_id),
                INDEX idx_route_history_score (safety_score),
                INDEX idx_route_history_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('All tables created successfully');
        return true;
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

/**
 * Check if tables already exist
 * Returns true if tables exist, false otherwise
 */
async function tablesExist() {
    const pool = getPool();
    try {
        const [rows] = await pool.query(`
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = ?
        `, [dbConfig.database]);

        return rows[0].table_count > 0;
    } catch (error) {
        console.error('Error checking tables:', error);
        return false;
    }
}

/**
 * Drop all tables (use with caution - for development only)
 */
async function dropAllTables() {
    const pool = getPool();
    try {
        // Get all tables
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.tables 
            WHERE table_schema = ?
        `, [dbConfig.database]);

        // Cylinder Verifications table - for saving cylinder verification history
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cylinder_verifications (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                region VARCHAR(10) DEFAULT 'IN',
                cylinder_number VARCHAR(100),
                status VARCHAR(50),
                verification_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_cylinder_user (user_id),
                INDEX idx_cylinder_number (cylinder_number),
                INDEX idx_cylinder_status (status),
                INDEX idx_cylinder_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Disable foreign key checks
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop each table
        for (const table of tables) {
            await pool.query(`DROP TABLE IF EXISTS ${table.TABLE_NAME}`);
        }

        // Enable foreign key checks
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('All tables dropped successfully');
        return true;
    } catch (error) {
        console.error('Error dropping tables:', error);
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        throw error;
    }
}

// Import dbConfig for table existence check
const { dbConfig } = require('./db');

module.exports = {
    createTables,
    tablesExist,
    dropAllTables
};

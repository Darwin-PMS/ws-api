const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Home Automation Device Model
const homeAutomationModel = {
    // Get all devices for a user
    async getDevices(userId) {
        const pool = getPool();
        const [devices] = await pool.query(
            'SELECT * FROM home_devices WHERE user_id = ? ORDER BY device_type, name',
            [userId]
        );
        return devices;
    },

    // Get device by ID
    async getDeviceById(deviceId, userId) {
        const pool = getPool();
        const [devices] = await pool.query(
            'SELECT * FROM home_devices WHERE id = ? AND user_id = ?',
            [deviceId, userId]
        );
        return devices[0] || null;
    },

    // Add a new device
    async addDevice(userId, deviceData) {
        const pool = getPool();
        const { name, deviceType, room, status, brightness, speed, temperature, isLocked } = deviceData;

        const deviceId = uuidv4();

        await pool.query(
            `INSERT INTO home_devices (id, user_id, name, device_type, room, status, brightness, speed, temperature, is_locked) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [deviceId, userId, name, deviceType, room || 'Living Room', status || 'off', brightness || 100, speed || 0, temperature || 24, isLocked !== undefined ? isLocked : true]
        );

        return { id: deviceId, userId, name, deviceType, room: room || 'Living Room', status: status || 'off' };
    },

    // Update device
    async updateDevice(deviceId, userId, deviceData) {
        const pool = getPool();
        const { name, room, status, brightness, speed, temperature, isLocked } = deviceData;

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (room !== undefined) {
            updates.push('room = ?');
            params.push(room);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }
        if (brightness !== undefined) {
            updates.push('brightness = ?');
            params.push(brightness);
        }
        if (speed !== undefined) {
            updates.push('speed = ?');
            params.push(speed);
        }
        if (temperature !== undefined) {
            updates.push('temperature = ?');
            params.push(temperature);
        }
        if (isLocked !== undefined) {
            updates.push('is_locked = ?');
            params.push(isLocked);
        }

        if (updates.length === 0) return true;

        params.push(deviceId, userId);
        await pool.query(
            `UPDATE home_devices SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            params
        );
        return true;
    },

    // Delete device
    async deleteDevice(deviceId, userId) {
        const pool = getPool();
        await pool.query(
            'DELETE FROM home_devices WHERE id = ? AND user_id = ?',
            [deviceId, userId]
        );
        return true;
    },

    // Get devices by room
    async getDevicesByRoom(userId, room) {
        const pool = getPool();
        const [devices] = await pool.query(
            'SELECT * FROM home_devices WHERE user_id = ? AND room = ? ORDER BY device_type, name',
            [userId, room]
        );
        return devices;
    },

    // Get devices by type
    async getDevicesByType(userId, deviceType) {
        const pool = getPool();
        const [devices] = await pool.query(
            'SELECT * FROM home_devices WHERE user_id = ? AND device_type = ? ORDER BY name',
            [userId, deviceType]
        );
        return devices;
    },

    // Control device (turn on/off, adjust settings)
    async controlDevice(deviceId, userId, command) {
        const pool = getPool();

        // Get current device
        const [devices] = await pool.query(
            'SELECT * FROM home_devices WHERE id = ? AND user_id = ?',
            [deviceId, userId]
        );

        if (!devices[0]) {
            throw new Error('Device not found');
        }

        const device = devices[0];
        let updates = [];
        let params = [];

        switch (command.action) {
            case 'toggle':
                updates.push('status = ?');
                params.push(device.status === 'on' ? 'off' : 'on');
                break;
            case 'turn_on':
                updates.push('status = ?');
                params.push('on');
                break;
            case 'turn_off':
                updates.push('status = ?');
                params.push('off');
                break;
            case 'set_brightness':
                if (command.brightness !== undefined) {
                    updates.push('brightness = ?');
                    params.push(Math.min(100, Math.max(0, command.brightness)));
                }
                break;
            case 'set_speed':
                if (command.speed !== undefined) {
                    updates.push('speed = ?');
                    params.push(Math.min(3, Math.max(0, command.speed)));
                }
                break;
            case 'set_temperature':
                if (command.temperature !== undefined) {
                    updates.push('temperature = ?');
                    params.push(Math.min(30, Math.max(16, command.temperature)));
                }
                break;
            case 'toggle_lock':
                updates.push('is_locked = ?');
                params.push(!device.is_locked);
                break;
            case 'lock':
                updates.push('is_locked = ?');
                params.push(true);
                break;
            case 'unlock':
                updates.push('is_locked = ?');
                params.push(false);
                break;
            default:
                throw new Error('Invalid command');
        }

        if (updates.length === 0) {
            throw new Error('No valid command provided');
        }

        params.push(deviceId, userId);
        await pool.query(
            `UPDATE home_devices SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            params
        );

        // Get updated device
        const [updatedDevices] = await pool.query(
            'SELECT * FROM home_devices WHERE id = ?',
            [deviceId]
        );

        return updatedDevices[0];
    },

    // Get all rooms for a user
    async getRooms(userId) {
        const pool = getPool();
        const [rooms] = await pool.query(
            'SELECT DISTINCT room FROM home_devices WHERE user_id = ? ORDER BY room',
            [userId]
        );
        return rooms.map(r => r.room);
    },

    // Get device statistics
    async getStatistics(userId) {
        const pool = getPool();

        const [totalDevices] = await pool.query(
            'SELECT COUNT(*) as count FROM home_devices WHERE user_id = ?',
            [userId]
        );

        const [activeDevices] = await pool.query(
            'SELECT COUNT(*) as count FROM home_devices WHERE user_id = ? AND status = ?',
            [userId, 'on']
        );

        const [byType] = await pool.query(
            'SELECT device_type, COUNT(*) as count FROM home_devices WHERE user_id = ? GROUP BY device_type',
            [userId]
        );

        return {
            total: totalDevices[0].count,
            active: activeDevices[0].count,
            byType: byType
        };
    }
};

module.exports = homeAutomationModel;

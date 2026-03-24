const homeAutomationModel = require('../models/homeAutomationModel');

// Home Automation Controller
const homeAutomationController = {
    // Get all devices
    async getDevices(req, res) {
        try {
            const userId = req.user.id;
            const devices = await homeAutomationModel.getDevices(userId);
            res.json({ success: true, devices });
        } catch (error) {
            console.error('Get devices error:', error);
            res.status(500).json({ success: false, message: 'Failed to get devices' });
        }
    },

    // Get device by ID
    async getDevice(req, res) {
        try {
            const userId = req.user.id;
            const { deviceId } = req.params;
            const device = await homeAutomationModel.getDeviceById(deviceId, userId);

            if (!device) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }

            res.json({ success: true, device });
        } catch (error) {
            console.error('Get device error:', error);
            res.status(500).json({ success: false, message: 'Failed to get device' });
        }
    },

    // Add new device
    async addDevice(req, res) {
        try {
            const userId = req.user.id;
            const { name, deviceType, room, status, brightness, speed, temperature, isLocked } = req.body;

            if (!name || !deviceType) {
                return res.status(400).json({ success: false, message: 'Name and device type are required' });
            }

            const validTypes = ['light', 'fan', 'ac', 'door', 'camera', 'thermostat', 'plug', 'sensor'];
            if (!validTypes.includes(deviceType)) {
                return res.status(400).json({ success: false, message: 'Invalid device type' });
            }

            const device = await homeAutomationModel.addDevice(userId, {
                name,
                deviceType,
                room,
                status,
                brightness,
                speed,
                temperature,
                isLocked
            });

            res.status(201).json({ success: true, device });
        } catch (error) {
            console.error('Add device error:', error);
            res.status(500).json({ success: false, message: 'Failed to add device' });
        }
    },

    // Update device
    async updateDevice(req, res) {
        try {
            const userId = req.user.id;
            const { deviceId } = req.params;

            const existingDevice = await homeAutomationModel.getDeviceById(deviceId, userId);
            if (!existingDevice) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }

            await homeAutomationModel.updateDevice(deviceId, userId, req.body);

            const updatedDevice = await homeAutomationModel.getDeviceById(deviceId, userId);
            res.json({ success: true, device: updatedDevice });
        } catch (error) {
            console.error('Update device error:', error);
            res.status(500).json({ success: false, message: 'Failed to update device' });
        }
    },

    // Delete device
    async deleteDevice(req, res) {
        try {
            const userId = req.user.id;
            const { deviceId } = req.params;

            const existingDevice = await homeAutomationModel.getDeviceById(deviceId, userId);
            if (!existingDevice) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }

            await homeAutomationModel.deleteDevice(deviceId, userId);
            res.json({ success: true, message: 'Device deleted successfully' });
        } catch (error) {
            console.error('Delete device error:', error);
            res.status(500).json({ success: false, message: 'Failed to delete device' });
        }
    },

    // Control device
    async controlDevice(req, res) {
        try {
            const userId = req.user.id;
            const { deviceId } = req.params;
            const command = req.body;

            const device = await homeAutomationModel.controlDevice(deviceId, userId, command);
            res.json({ success: true, device });
        } catch (error) {
            console.error('Control device error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to control device' });
        }
    },

    // Get rooms
    async getRooms(req, res) {
        try {
            const userId = req.user.id;
            const rooms = await homeAutomationModel.getRooms(userId);
            res.json({ success: true, rooms });
        } catch (error) {
            console.error('Get rooms error:', error);
            res.status(500).json({ success: false, message: 'Failed to get rooms' });
        }
    },

    // Get devices by room
    async getDevicesByRoom(req, res) {
        try {
            const userId = req.user.id;
            const { room } = req.params;
            const devices = await homeAutomationModel.getDevicesByRoom(userId, room);
            res.json({ success: true, devices });
        } catch (error) {
            console.error('Get devices by room error:', error);
            res.status(500).json({ success: false, message: 'Failed to get devices' });
        }
    },

    // Get devices by type
    async getDevicesByType(req, res) {
        try {
            const userId = req.user.id;
            const { deviceType } = req.params;
            const devices = await homeAutomationModel.getDevicesByType(userId, deviceType);
            res.json({ success: true, devices });
        } catch (error) {
            console.error('Get devices by type error:', error);
            res.status(500).json({ success: false, message: 'Failed to get devices' });
        }
    },

    // Get statistics
    async getStatistics(req, res) {
        try {
            const userId = req.user.id;
            const statistics = await homeAutomationModel.getStatistics(userId);
            res.json({ success: true, statistics });
        } catch (error) {
            console.error('Get statistics error:', error);
            res.status(500).json({ success: false, message: 'Failed to get statistics' });
        }
    }
};

module.exports = homeAutomationController;

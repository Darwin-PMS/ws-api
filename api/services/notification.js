const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
    constructor() {
        this.emailTransporter = null;
        this.twilioClient = null;
        this.smsEnabled = false;
        this.emailEnabled = false;
        this.initServices();
    }

    initServices() {
        this.initEmail();
        this.initTwilio();
    }

    initEmail() {
        try {
            if (process.env.SMTP_HOST) {
                this.emailTransporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
                this.emailEnabled = true;
                console.log('Email service initialized');
            } else {
                console.log('Email service: SMTP not configured');
            }
        } catch (error) {
            console.error('Email service initialization failed:', error.message);
        }
    }

    initTwilio() {
        try {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                this.twilioClient = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                this.smsEnabled = true;
                console.log('Twilio SMS service initialized');
            } else {
                console.log('Twilio SMS service: Credentials not configured');
            }
        } catch (error) {
            console.error('Twilio initialization failed:', error.message);
        }
    }

    async sendSMS(to, message) {
        if (!this.smsEnabled) {
            console.log(`SMS would be sent to ${to}: ${message}`);
            return { success: false, reason: 'SMS not configured' };
        }

        try {
            const from = process.env.TWILIO_PHONE_NUMBER;
            const result = await this.twilioClient.messages.create({
                body: message,
                from,
                to: this.formatPhoneNumber(to),
            });

            console.log(`SMS sent to ${to}: ${result.sid}`);
            return { success: true, sid: result.sid, status: result.status };
        } catch (error) {
            console.error(`SMS failed to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendEmail(to, subject, html) {
        if (!this.emailEnabled) {
            console.log(`Email would be sent to ${to}: ${subject}`);
            return { success: false, reason: 'Email not configured' };
        }

        try {
            const result = await this.emailTransporter.sendMail({
                from: process.env.EMAIL_FROM || '"Women Safety" <noreply@womensafety.app>',
                to,
                subject,
                html,
            });

            console.log(`Email sent to ${to}: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`Email failed to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    formatPhoneNumber(phone) {
        let formatted = phone.replace(/\D/g, '');
        if (formatted.length === 10) {
            formatted = '+91' + formatted;
        } else if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        return formatted;
    }

    async sendSOSFamilyNotification(familyMember, sosData) {
        const { userName, userPhone, location, mapUrl } = sosData;
        
        const message = `🚨 SOS ALERT! ${userName} (${userPhone}) has triggered an emergency alert! Location: ${location}${mapUrl ? ` Map: ${mapUrl}` : ''}. Please contact them immediately or alert authorities.`;

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">🚨 SOS ALERT</h1>
                </div>
                <div style="padding: 20px; background-color: #fef2f2;">
                    <h2 style="color: #dc2626;">Emergency Alert</h2>
                    <p><strong>${userName}</strong> has triggered an SOS emergency alert.</p>
                    <p><strong>Phone:</strong> ${userPhone}</p>
                    <p><strong>Location:</strong> ${location}</p>
                    ${mapUrl ? `<p><a href="${mapUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Location on Map</a></p>` : ''}
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated emergency notification from Women Safety Portal.</p>
                </div>
            </div>
        `;

        const results = {
            sms: null,
            email: null,
        };

        if (familyMember.phone) {
            results.sms = await this.sendSMS(familyMember.phone, message);
        }

        if (familyMember.email) {
            results.email = await this.sendEmail(
                familyMember.email,
                '🚨 SOS ALERT - Emergency Notification',
                emailHtml
            );
        }

        return results;
    }

    async sendSOSAuthoritiesNotification(authority, sosData) {
        const { userName, userPhone, location, message } = sosData;
        
        const smsMessage = `🚨 EMERGENCY SOS: ${userName} (${userPhone}) needs immediate help at ${location}. ${message || ''}`;

        return await this.sendSMS(authority.phone, smsMessage);
    }

    async sendSafeArrivalNotification(familyMember, userName) {
        const message = `✅ ${userName} has safely arrived at their destination.`;
        
        if (familyMember.phone) {
            return await this.sendSMS(familyMember.phone, message);
        }
        return { success: false, reason: 'No phone number' };
    }

    async sendGeofenceAlert(familyMember, alertData) {
        const { userName, zoneName, zoneType } = alertData;
        const zoneIcon = zoneType === 'danger' ? '⚠️' : '🛡️';
        
        const message = `${zoneIcon} GEOFENCE ALERT: ${userName} has ${zoneType === 'danger' ? 'entered' : 'left'} the ${zoneName} zone.`;

        if (familyMember.phone) {
            return await this.sendSMS(familyMember.phone, message);
        }
        return { success: false, reason: 'No phone number' };
    }
}

module.exports = new NotificationService();

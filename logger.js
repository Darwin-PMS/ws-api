const fs = require('fs');
const path = require('path');

class ServerLogger {
    constructor() {
        this.logDir = path.join(__dirname, 'logs');
        this.errorLogFile = path.join(this.logDir, 'errors.log');
        this.accessLogFile = path.join(this.logDir, 'access.log');
        this.appLogFile = path.join(this.logDir, 'app.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
            console.log('Created log directory:', this.logDir);
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatLog(level, source, message, data = null, error = null) {
        const entry = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: this.getTimestamp(),
            level: level,
            source: source,
            message: message,
        };

        if (data) {
            entry.data = this.sanitizeData(data);
        }

        if (error) {
            entry.error = {
                name: error.name || 'Error',
                message: error.message || String(error),
                stack: error.stack || null,
            };
        }

        return JSON.stringify(entry);
    }

    sanitizeData(data) {
        if (!data) return null;
        const sanitized = { ...data };
        const sensitiveFields = ['password', 'token', 'refreshToken', 'authorization', 'api_key', 'secret'];
        
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
            if (sanitized.headers && sanitized.headers[field]) {
                sanitized.headers[field] = '[REDACTED]';
            }
        }
        
        return sanitized;
    }

    writeToFile(filePath, message) {
        try {
            fs.appendFileSync(filePath, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    log(level, source, message, data = null, error = null) {
        const formattedLog = this.formatLog(level, source, message, data, error);
        
        // Console output
        const consoleMsg = `[${level.toUpperCase()}] [${source}] ${message}`;
        if (level === 'error') {
            console.error(consoleMsg, error || '');
        } else if (level === 'warning') {
            console.warn(consoleMsg, data || '');
        } else {
            console.log(consoleMsg, data || '');
        }

        // Write to app log
        this.writeToFile(this.appLogFile, formattedLog);

        // Write errors to error log
        if (level === 'error') {
            this.writeToFile(this.errorLogFile, formattedLog);
        }

        return formattedLog;
    }

    error(source, message, data = null, error = null) {
        return this.log('error', source, message, data, error);
    }

    warning(source, message, data = null) {
        return this.log('warning', source, message, data);
    }

    info(source, message, data = null) {
        return this.log('info', source, message, data);
    }

    debug(source, message, data = null) {
        return this.log('debug', source, message, data);
    }

    // API error logging
    logApiError(req, res, error) {
        return this.error('api', `API Error: ${res.statusCode || 500}`, {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            headers: req.headers,
            body: req.body,
        }, error);
    }

    // Auth error logging
    logAuthError(action, error, userId = null, req = null) {
        return this.error('auth', `Auth Error: ${action}`, {
            action,
            userId,
            url: req?.originalUrl || req?.url,
        }, error);
    }

    // Database error logging
    logDbError(operation, error, query = null) {
        return this.error('database', `Database Error: ${operation}`, {
            operation,
            query: query ? String(query) : null,
        }, error);
    }

    // Log HTTP access
    logAccess(req, res) {
        const entry = {
            timestamp: this.getTimestamp(),
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            responseTime: res.responseTime || 0,
        };
        
        const formatted = JSON.stringify(entry);
        this.writeToFile(this.accessLogFile, formatted);
    }

    // Get recent error logs
    getErrorLogs(lines = 100) {
        try {
            if (!fs.existsSync(this.errorLogFile)) {
                return [];
            }
            const content = fs.readFileSync(this.errorLogFile, 'utf-8');
            const allLogs = content.split('\n').filter(line => line.trim());
            return allLogs.slice(-lines).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
                }
            });
        } catch (error) {
            return [];
        }
    }

    // Get recent app logs
    getAppLogs(lines = 100) {
        try {
            if (!fs.existsSync(this.appLogFile)) {
                return [];
            }
            const content = fs.readFileSync(this.appLogFile, 'utf-8');
            const allLogs = content.split('\n').filter(line => line.trim());
            return allLogs.slice(-lines).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
                }
            });
        } catch (error) {
            return [];
        }
    }

    // Clear all logs
    clearLogs() {
        try {
            if (fs.existsSync(this.errorLogFile)) fs.unlinkSync(this.errorLogFile);
            if (fs.existsSync(this.accessLogFile)) fs.unlinkSync(this.accessLogFile);
            if (fs.existsSync(this.appLogFile)) fs.unlinkSync(this.appLogFile);
            console.log('All server logs cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear logs:', error);
            return false;
        }
    }

    // Export all logs as JSON
    exportLogs() {
        return {
            errors: this.getErrorLogs(1000),
            app: this.getAppLogs(1000),
            exportedAt: this.getTimestamp(),
        };
    }
}

module.exports = new ServerLogger();

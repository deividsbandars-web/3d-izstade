export const logger = {
    /**
     * Internal helper to format log messages
     */
    _formatMessage(level, module, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [${module}]: ${message}`;
    },
    /**
     * Log informational messages
     */
    info(module, message, data) {
        console.log(this._formatMessage('INFO', module, message), data ? data : '');
    },
    /**
     * Log warnings
     */
    warn(module, message, data) {
        console.warn(this._formatMessage('WARN', module, message), data ? data : '');
    },
    /**
     * Log critical errors
     */
    error(module, message, error) {
        console.error(this._formatMessage('ERROR', module, message), error ? error : '');
    }
};

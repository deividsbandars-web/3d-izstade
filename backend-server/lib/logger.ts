export const logger = {
  _formatMessage(level: string, module: string, message: string) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${module}]: ${message}`;
  },

  info(module: string, message: string, data?: any) {
    console.log(this._formatMessage('INFO', module, message), data ? data : '');
  },

  warn(module: string, message: string, data?: any) {
    console.warn(this._formatMessage('WARN', module, message), data ? data : '');
  },

  error(module: string, message: string, error?: any) {
    console.error(this._formatMessage('ERROR', module, message), error ? error : '');
  }
};

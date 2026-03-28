export const logger = {
  _formatMessage(level: string, module: string, message: string, data?: any) {
    return JSON.stringify({
      data: data ?? null,
      level,
      message,
      module,
      timestamp: new Date().toISOString(),
    });
  },

  info(module: string, message: string, data?: any) {
    console.log(this._formatMessage('INFO', module, message, data));
  },

  warn(module: string, message: string, data?: any) {
    console.warn(this._formatMessage('WARN', module, message, data));
  },

  error(module: string, message: string, error?: any) {
    console.error(this._formatMessage('ERROR', module, message, error));
  }
};

type ClientLogData = unknown;

function writeClientLog(
  level: 'debug' | 'error' | 'info' | 'warn',
  module: string,
  message: string,
  data?: ClientLogData,
) {
  if (!import.meta.env.DEV && (level === 'debug' || level === 'info')) {
    return;
  }

  const args = data === undefined
    ? [`[${module}] ${message}`]
    : [`[${module}] ${message}`, data];
  globalThis.console[level](...args);
}

export const clientLogger = {
  debug: (module: string, message: string, data?: ClientLogData) => writeClientLog('debug', module, message, data),
  error: (module: string, message: string, data?: ClientLogData) => writeClientLog('error', module, message, data),
  info: (module: string, message: string, data?: ClientLogData) => writeClientLog('info', module, message, data),
  warn: (module: string, message: string, data?: ClientLogData) => writeClientLog('warn', module, message, data),
};

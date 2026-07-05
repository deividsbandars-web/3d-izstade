import { logger } from './logger.js';

const MODULE = 'PlatformSecurity';

// Compatibility surface for the legacy platform security middleware.
export const prodLogger = {
  info(message: string, metadata?: unknown) {
    logger.info(MODULE, message, metadata);
  },
  warn(message: string, metadata?: unknown) {
    logger.warn(MODULE, message, metadata);
  },
  error(message: string, metadata?: unknown) {
    logger.error(MODULE, message, metadata);
  },
};

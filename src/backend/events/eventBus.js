import Redis from 'ioredis';
import { logger } from '../logging/logger.js';
// Get Redis URL from environment, or use default local instance
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// We need two instances for pub/sub (one to publish, one to subscribe)
export const pubClient = new Redis(redisUrl, redisUrl.startsWith('redis://') && redisUrl.includes('upstash') ? { tls: { rejectUnauthorized: false } } : {});
export const subClient = new Redis(redisUrl, redisUrl.startsWith('redis://') && redisUrl.includes('upstash') ? { tls: { rejectUnauthorized: false } } : {});
pubClient.on('error', (err) => logger.error('Redis PubClient', String(err)));
subClient.on('error', (err) => logger.error('Redis SubClient', String(err)));
pubClient.on('connect', () => logger.info('Redis PubClient', 'Connected'));
subClient.on('connect', () => logger.info('Redis SubClient', 'Connected'));

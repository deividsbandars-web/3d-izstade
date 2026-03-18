import './env.js';
import { taskQueue } from '../src/backend/queue/taskQueue.js';
import { logger } from '../src/backend/logging/logger.js';
import { contentScheduler } from '../src/backend/distribution/contentScheduler.js';
import { emailScheduler } from '../src/backend/sequences/emailScheduler.js';
import { registerSubscribers } from './events/subscribers.js';
import { registerRevenueSubscribers } from './events/revenueSubscribers.js';

console.log('👷 AI Agent Worker starting...');

// 0. Register Event Subscribers (Pub/Sub)
registerSubscribers();
registerRevenueSubscribers();

// 1. Start agent task listener (Realtime WebSocket)
taskQueue.startListening();

// 2. Start content distribution polling
setInterval(async () => {
  await contentScheduler.runScheduledPosts();
}, 60000); // Check for posts every minute

// 3. Start email automation sequence engine
emailScheduler.start(3600000); // Check for sequence follow-ups every hour

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Worker', 'SIGTERM received. Stopping worker...');
  taskQueue.stopListening();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Worker', 'SIGINT received. Stopping worker...');
  taskQueue.stopListening();
  process.exit(0);
});

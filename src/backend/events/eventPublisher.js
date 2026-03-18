import { pubClient } from './eventBus.js';
import { logger } from '../logging/logger.js';
export const eventPublisher = {
    /**
     * Publishes an event to the Redis event bus.
     */
    async publish(eventType, data, metadata) {
        try {
            const payload = {
                eventId: crypto.randomUUID(),
                eventType,
                timestamp: new Date().toISOString(),
                data,
                metadata
            };
            const message = JSON.stringify(payload);
            // Publish to a channel named after the event type
            await pubClient.publish(eventType, message);
            logger.info('EventPublisher', `Published event: ${eventType} (${payload.eventId})`);
            return { success: true, eventId: payload.eventId };
        }
        catch (error) {
            logger.error('EventPublisher', `Failed to publish event: ${eventType}`, error);
            return { success: false, error: String(error) };
        }
    }
};

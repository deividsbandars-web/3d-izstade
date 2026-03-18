import { subClient } from './eventBus.js';
import { logger } from '../logging/logger.js';
const handlers = new Map();
/**
 * Initializes the subscriber client to listen for registered events.
 */
subClient.on('message', async (channel, message) => {
    try {
        const eventType = channel;
        const payload = JSON.parse(message);
        const eventHandlers = handlers.get(eventType);
        if (eventHandlers && eventHandlers.length > 0) {
            logger.info('EventSubscriber', `Received event: ${eventType} (${payload.eventId})`);
            // Execute handlers asynchronously so they don't block each other
            eventHandlers.forEach(handler => {
                Promise.resolve(handler(payload)).catch(err => {
                    logger.error('EventSubscriber', `Handler failed for event ${eventType}`, err);
                });
            });
        }
    }
    catch (error) {
        logger.error('EventSubscriber', 'Failed to process message', error);
    }
});
export const eventSubscriber = {
    /**
     * Subscribes a handler function to a specific event type.
     */
    subscribe(eventType, handler) {
        let eventHandlers = handlers.get(eventType);
        if (!eventHandlers) {
            eventHandlers = [];
            handlers.set(eventType, eventHandlers);
            // Tell Redis to subscribe to this channel if it's the first handler
            subClient.subscribe(eventType, (err) => {
                if (err) {
                    logger.error('EventSubscriber', `Failed to subscribe to ${eventType}`, err);
                }
                else {
                    logger.info('EventSubscriber', `Subscribed to channel: ${eventType}`);
                }
            });
        }
        eventHandlers.push(handler);
    }
};

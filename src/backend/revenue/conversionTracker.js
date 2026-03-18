import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
import { eventPublisher } from '../events/eventPublisher.js';
import { PlatformEvent } from '../events/eventTypes.js';
export const conversionTracker = {
    /**
     * Tracks a specific revenue-related event.
     */
    async trackEvent(params) {
        try {
            logger.info('ConversionTracker', `Tracking ${params.eventType} for prospect ${params.prospectId}`);
            const { data, error } = await supabaseClient
                .from('revenue_conversions')
                .insert([{
                    prospect_id: params.prospectId,
                    offer_id: params.offerId,
                    event_type: params.eventType,
                    metadata: params.metadata || {}
                }])
                .select()
                .single();
            if (error)
                throw error;
            // If it's a purchase, trigger global platform events
            if (params.eventType === 'purchase_completed') {
                await eventPublisher.publish(PlatformEvent.PAYMENT_RECEIVED, {
                    prospectId: params.prospectId,
                    offerId: params.offerId,
                    ...params.metadata
                });
                // Update prospect status
                await supabaseClient.from('prospects').update({ status: 'converted' }).eq('id', params.prospectId);
            }
            return { data, error: null };
        }
        catch (error) {
            logger.error('ConversionTracker', 'Failed to track event', error);
            return { data: null, error: String(error) };
        }
    }
};

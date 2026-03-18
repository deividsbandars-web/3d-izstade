import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
import { eventPublisher } from '../events/eventPublisher.js';
import { PlatformEvent } from '../events/eventTypes.js';
/**
 * Tracks inbound traffic and conversions for marketing attribution.
 */
export const analyticsTracker = {
    /**
     * Logs a visit from a specific source to a landing page.
     */
    async trackVisit(params) {
        try {
            logger.info('AnalyticsTracker', `Logging visit from ${params.source} to ${params.landingPageId}`);
            const { data, error } = await supabaseClient
                .from('traffic_analytics')
                .insert([{
                    landing_page_id: params.landingPageId,
                    source: params.source,
                    campaign: params.campaign,
                    device_type: this._parseDevice(params.userAgent),
                    converted: false
                }])
                .select()
                .single();
            if (error)
                throw error;
            await eventPublisher.publish(PlatformEvent.TRAFFIC_GENERATED, {
                landingPageId: params.landingPageId,
                source: params.source
            });
            return { data, error: null };
        }
        catch (error) {
            logger.error('AnalyticsTracker', 'Failed to track visit', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Updates a visit record to mark it as converted.
     */
    async trackConversion(analyticsId) {
        try {
            logger.info('AnalyticsTracker', `Marking conversion for analytics entry ${analyticsId}`);
            const { error } = await supabaseClient
                .from('traffic_analytics')
                .update({ converted: true })
                .eq('id', analyticsId);
            if (error)
                throw error;
            return { success: true };
        }
        catch (error) {
            logger.error('AnalyticsTracker', 'Failed to track conversion', error);
            return { success: false, error: String(error) };
        }
    },
    /**
     * Internal helper to categorize devices.
     */
    _parseDevice(ua) {
        if (!ua)
            return 'unknown';
        if (/mobile/i.test(ua))
            return 'mobile';
        if (/tablet/i.test(ua))
            return 'tablet';
        return 'desktop';
    }
};

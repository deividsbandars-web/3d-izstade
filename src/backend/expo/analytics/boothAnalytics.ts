import { supabaseClient } from '../../../lib/supabaseClient.js';
import { logger } from '../../logging/logger.js';

type BoothAnalyticsCounterField = 'visits' | 'interactions' | 'leads_generated';

const EMPTY_BOOTH_ANALYTICS = {
  interactions: 0,
  leads_generated: 0,
  visits: 0,
};

function formatAnalyticsError(error: unknown) {
  if (error && typeof error === 'object') {
    const value = error as { code?: unknown; details?: unknown; hint?: unknown; message?: unknown };
    return [
      value.code ? `code=${String(value.code)}` : '',
      value.message ? String(value.message) : '',
      value.details ? `details=${String(value.details)}` : '',
      value.hint ? `hint=${String(value.hint)}` : '',
    ].filter(Boolean).join(' ');
  }

  return String(error);
}

function isAnalyticsCounterSchemaUnavailable(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const value = error as { code?: unknown; message?: unknown };
  const code = String(value.code || '');
  const message = String(value.message || '').toLowerCase();
  return code === '42703'
    || message.includes('booth_analytics.booth_id')
    || message.includes('visits')
    || message.includes('interactions')
    || message.includes('leads_generated');
}

export const boothAnalytics = {
  /**
   * Ensures an analytics record exists for the booth, then increments a specific field
   */
  async _incrementStat(boothId: string, field: BoothAnalyticsCounterField) {
    try {
      // First, try to get existing record
      const { data: existing, error: fetchError } = await supabaseClient
        .from('booth_analytics')
        .select('booth_id, visits, interactions, leads_generated')
        .eq('booth_id', boothId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found'
         throw fetchError;
      }

      if (!existing) {
        // Create new record
        const insertPayload = { booth_id: boothId, [field]: 1 };
        const { error: insertError } = await supabaseClient
          .from('booth_analytics')
          .insert([insertPayload]);
        if (insertError) throw insertError;
      } else {
        // Update existing record
        const { error: updateError } = await supabaseClient
          .from('booth_analytics')
          .update({ [field]: (existing[field] || 0) + 1, updated_at: new Date().toISOString() })
          .eq('booth_id', boothId);
        if (updateError) throw updateError;
      }
      
      return { success: true, error: null };
    } catch (error) {
      if (isAnalyticsCounterSchemaUnavailable(error)) {
        logger.warn('BoothAnalytics', `Counter analytics schema unavailable while incrementing ${field} for booth ${boothId}`);
        return { success: false, error: 'analytics counter schema unavailable' };
      }

      const errorText = formatAnalyticsError(error);
      logger.error('BoothAnalytics', `Failed to increment ${field} for booth ${boothId}`, error);
      return { success: false, error: errorText };
    }
  },

  /**
   * Tracks a visit/view to a specific booth
   */
  async trackVisit(boothId: string) {
    logger.info('BoothAnalytics', `Tracking visit for ${boothId}`);
    return this._incrementStat(boothId, 'visits');
  },

  /**
   * Tracks an interaction (button click, video view) inside the booth
   */
  async trackInteraction(boothId: string) {
    logger.info('BoothAnalytics', `Tracking interaction for ${boothId}`);
    return this._incrementStat(boothId, 'interactions');
  },

  /**
   * Tracks when a lead is captured inside the booth
   */
  async trackLeadGenerated(boothId: string) {
    logger.info('BoothAnalytics', `Tracking lead generated for ${boothId}`);
    return this._incrementStat(boothId, 'leads_generated');
  },

  /**
   * Gets analytics stats for a booth
   */
  async getBoothStats(boothId: string) {
    try {
      const { data, error } = await supabaseClient
        .from('booth_analytics')
        .select('booth_id, visits, interactions, leads_generated')
        .eq('booth_id', boothId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Return zeros if no data exists yet
      if (!data) {
        return { data: EMPTY_BOOTH_ANALYTICS, error: null };
      }

      return {
        data: {
          interactions: Number(data.interactions || 0),
          leads_generated: Number(data.leads_generated || 0),
          visits: Number(data.visits || 0),
        },
        error: null,
      };
    } catch (error) {
      if (isAnalyticsCounterSchemaUnavailable(error)) {
        logger.warn('BoothAnalytics', `Counter analytics schema unavailable while reading stats for booth ${boothId}`);
        return { data: EMPTY_BOOTH_ANALYTICS, error: null };
      }

      logger.error('BoothAnalytics', `Failed to get stats for ${boothId}`, error);
      return { data: null, error: formatAnalyticsError(error) };
    }
  }
};

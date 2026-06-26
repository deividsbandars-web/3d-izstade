import { supabase } from './supabase.js';

// A simple debounce mechanism to avoid spamming the database 
// with impressions if the user quickly looks back and forth.
const trackedImpressions = new Set<string>();

export const telemetry = {
  /**
   * Tracks when an ad campaign becomes visible in the user's viewport/camera.
   * Ensures we only count 1 impression per session/load per campaign to avoid DB spam.
   */
  async trackAdImpression(campaignId: string) {
    if (!campaignId || trackedImpressions.has(`imp_${campaignId}`)) return;
    trackedImpressions.add(`imp_${campaignId}`);
    
    try {
      await supabase.from('ad_impression').insert([
        { campaign_id: campaignId } // visitor_id is optional or can be added later if you add session cookies
      ]);
    } catch (err) {
      console.error('Failed to track impression', err);
    }
  },

  /**
   * Tracks when a user clicks on an ad/billboard.
   */
  async trackAdClick(campaignId: string) {
    if (!campaignId) return;
    
    try {
      await supabase.from('ad_click').insert([
        { campaign_id: campaignId }
      ]);
    } catch (err) {
      console.error('Failed to track click', err);
    }
  },

  /**
   * Tracks when a user interacts with an expo booth (e.g. opens the booth's panel).
   * For now, storing it in a generic analytics way, but can be added to a dedicated booth_views table later.
   */
  async trackBoothEnter(boothId: string) {
    if (!boothId || trackedImpressions.has(`booth_${boothId}`)) return;
    trackedImpressions.add(`booth_${boothId}`);
    
    // Can be implemented via a generic event table or specific booth_view table
    console.log(`[Telemetry] Booth entered: ${boothId}`);
  }
};

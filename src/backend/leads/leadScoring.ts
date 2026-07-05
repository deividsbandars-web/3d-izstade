import { logger } from '../logging/logger.js';

export const leadScoring = {
  /**
   * Scores a lead on a scale of 0-100 based on its profile
   */
  scoreLead(lead: any): number {
    try {
      logger.info('LeadScoring', `Scoring lead: ${lead.company_name}`);
      let score = 50; // Base score

      // 1. Website Quality (has website?)
      if (lead.website) {
        score += 15;
        // In reality, we might ping the website and score based on responsiveness, SSL, etc.
      } else {
        score -= 20;
      }

      // 2. Contact info presence
      if (lead.email) score += 10;
      if (lead.phone) score += 10;

      // 3. Size / Industry logic (Mocked for this example)
      if (lead.company_name?.toLowerCase().includes('enterprise')) {
        score += 15;
      }

      // Max out at 100, min at 0
      return Math.min(Math.max(score, 0), 100);
    } catch (error) {
      logger.error('LeadScoring', 'Error scoring lead', error);
      return 0; // Safe fallback
    }
  }
};

import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
export const leadCapture = {
    /**
     * Captures an email from a landing page form, scores it, and stores it in the CRM (leads table).
     */
    async captureLead(email, sourcePageId, metadata) {
        try {
            logger.info('LeadCapture', `Capturing new lead: ${email} from page ${sourcePageId}`);
            // Basic validation
            if (!email.includes('@'))
                throw new Error('Invalid email format');
            // Simple real-time scoring logic for inbound leads
            let score = 50;
            if (email.endsWith('.edu') || email.endsWith('.gov'))
                score += 10;
            // Penalize free email providers slightly in B2B context
            if (email.includes('@gmail.com') || email.includes('@yahoo.com')) {
                score -= 10;
            }
            else {
                score += 20; // Likely a business domain
            }
            const { data, error } = await supabaseClient
                .from('leads')
                .insert([{
                    source: `LandingPage: ${sourcePageId}`,
                    contact_info: { email, ...metadata },
                    status: 'new',
                    score: score,
                    contacted: false
                }])
                .select()
                .single();
            if (error)
                throw error;
            logger.info('LeadCapture', `Successfully captured and scored lead ${data.id}`);
            return { data, error: null };
        }
        catch (error) {
            logger.error('LeadCapture', 'Failed to capture lead', error);
            return { data: null, error: String(error) };
        }
    }
};

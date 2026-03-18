import { emailOutreach } from '../outreach/emailOutreach.js';
import { logger } from '../logging/logger.js';
import { supabaseClient } from '../../lib/supabaseClient.js';
export const salesSequence = {
    /**
     * Starts a 3-step automated sales sequence for a prospect.
     */
    async startOutreach(prospectId, offerId) {
        try {
            logger.info('SalesSequence', `Starting outreach sequence for prospect ${prospectId}`);
            // 1. Fetch prospect and offer
            const { data: prospect } = await supabaseClient.from('prospects').select('*').eq('id', prospectId).single();
            const { data: offer } = await supabaseClient.from('personalized_offers').select('*').eq('id', offerId).single();
            if (!prospect || !offer)
                throw new Error('Missing prospect or offer data');
            if (!prospect.email)
                throw new Error('Prospect has no email address');
            // Step 1: The Personalized Introduction (Day 0)
            const introResult = await emailOutreach.sendEmail({
                to: prospect.email,
                subject: `Strategic AI Partnership for ${prospect.company_name}`,
                body: `
          <h1>Hi ${prospect.company_name} Team,</h1>
          <p>${offer.personalized_copy}</p>
          <p>You can view the full details and get started here: <a href="${offer.stripe_checkout_url}">Activate AI Suite</a></p>
          <p>Best regards,<br/>Warpala Revenue Team</p>
        `,
                leadId: prospectId, // Reusing leadId field for prospects in outreach_logs
                from: 'Sales @ Warpala <sales@warpala.com>'
            });
            if (introResult.success) {
                await supabaseClient.from('prospects').update({ status: 'outreach_active' }).eq('id', prospectId);
                await supabaseClient.from('personalized_offers').update({ status: 'sent' }).eq('id', offerId);
            }
            return { success: introResult.success, error: introResult.error };
        }
        catch (error) {
            logger.error('SalesSequence', 'Failed to start outreach', error);
            return { success: false, error: String(error) };
        }
    },
    /**
     * Placeholder for follow-up steps (Phase 21 req: email 2 follow-up, email 3 special offer).
     * In a production cron-job environment, these would be triggered after X days.
     */
    async triggerFollowUp(prospectId, step) {
        try {
            const { data: prospect } = await supabaseClient.from('prospects').select('*').eq('id', prospectId).single();
            if (!prospect || prospect.status === 'converted')
                return;
            const subject = step === 2
                ? `Following up: AI scaling for ${prospect.company_name}`
                : `Final Call: Exclusive Special Offer for ${prospect.company_name}`;
            const body = step === 2
                ? `<p>Hi, just wanted to follow up on my previous email. I really believe our AI tools can help ${prospect.company_name} grow. Any thoughts?</p>`
                : `<p>We are closing this month's cohort. Since we'd love to have you on board, here is a 20% discount code for your first 3 months: <strong>GROW20</strong></p>`;
            return await emailOutreach.sendEmail({
                to: prospect.email,
                subject,
                body,
                from: 'Sales @ Warpala <sales@warpala.com>'
            });
        }
        catch (error) {
            logger.error('SalesSequence', `Follow-up ${step} failed`, error);
        }
    }
};

import { supabaseClient } from '../../lib/supabaseClient.js';
import { emailOutreach } from '../outreach/emailOutreach.js';
import { logger } from '../logging/logger.js';
/**
 * Executes automated email sequences for lead nurturing.
 */
export const emailSequenceEngine = {
    /**
     * Subscribes a lead to a specific email sequence.
     */
    async subscribeLead(leadId, sequenceId) {
        try {
            logger.info('EmailSequence', `Subscribing lead ${leadId} to sequence ${sequenceId}`);
            const { data, error } = await supabaseClient
                .from('user_sequence_progress')
                .upsert([{
                    lead_id: leadId,
                    sequence_id: sequenceId,
                    current_step: 0,
                    status: 'active'
                }], { onConflict: 'lead_id, sequence_id' })
                .select()
                .single();
            if (error)
                throw error;
            return { data, error: null };
        }
        catch (error) {
            logger.error('EmailSequence', 'Failed to subscribe lead', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Processes all active sequences and sends due emails.
     */
    async processSequences() {
        try {
            // 1. Fetch all active subscriptions
            const { data: activeSubscribers, error: fetchError } = await supabaseClient
                .from('user_sequence_progress')
                .select('*, lead:leads(*), sequence:email_sequences(*)')
                .eq('status', 'active');
            if (fetchError || !activeSubscribers)
                return;
            for (const sub of activeSubscribers) {
                const nextStepIdx = sub.current_step;
                const steps = sub.sequence.steps;
                const step = steps[nextStepIdx];
                if (!step) {
                    // Sequence finished
                    await supabaseClient.from('user_sequence_progress').update({ status: 'completed' }).eq('id', sub.id);
                    continue;
                }
                // Check if enough time has passed (simplified logic: day 0 is immediate, day 2 is 48h after last_sent)
                const lastSent = sub.last_sent_at ? new Date(sub.last_sent_at).getTime() : 0;
                const now = Date.now();
                const waitMs = step.day * 24 * 60 * 60 * 1000;
                if (now - lastSent >= waitMs || !sub.last_sent_at) {
                    logger.info('EmailSequence', `Sending step ${nextStepIdx} of ${sub.sequence.name} to ${sub.lead.contact_info.email}`);
                    // Send Email
                    const sendResult = await emailOutreach.sendEmail({
                        to: sub.lead.contact_info.email,
                        subject: step.subject,
                        body: step.body,
                        leadId: sub.lead_id,
                        userId: sub.lead.user_id
                    });
                    if (sendResult.success) {
                        // Update progress
                        await supabaseClient
                            .from('user_sequence_progress')
                            .update({
                            current_step: nextStepIdx + 1,
                            last_sent_at: new Date().toISOString()
                        })
                            .eq('id', sub.id);
                    }
                }
            }
        }
        catch (error) {
            logger.error('EmailSequence', 'Error in processSequences', error);
        }
    }
};

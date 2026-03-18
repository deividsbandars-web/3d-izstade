import { logger } from '../../logging/logger.js';
import { googleMapsLeadSource } from '../sources/googleMapsLeadSource.js';
import { directoryLeadSource } from '../sources/directoryLeadSource.js';
import { linkedinLeadSource } from '../sources/linkedinLeadSource.js';
import { leadScoring } from '../leadScoring.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';
import { agentScheduler } from '../../../agents/system/scheduler/agentScheduler.js';
import { eventPublisher } from '../../events/eventPublisher.js';
import { PlatformEvent } from '../../events/eventTypes.js';
export const leadEngine = {
    /**
     * 1. Collect leads from multiple REAL sources
     */
    async collectLeads(industry, location, limitPerSource = 5) {
        try {
            logger.info('LeadEngine', `Starting REAL lead collection for ${industry} in ${location}`);
            // Execute in sequence with a small delay to prevent immediate rate limit hits
            const maps = await googleMapsLeadSource.fetchLeads(industry, location, limitPerSource);
            await new Promise(r => setTimeout(r, 1000));
            const directory = await directoryLeadSource.fetchLeads(industry, location, limitPerSource);
            await new Promise(r => setTimeout(r, 1000));
            const linkedin = await linkedinLeadSource.fetchLeads(industry, location, limitPerSource);
            const allLeads = [
                ...(maps.data || []),
                ...(directory.data || []),
                ...(linkedin.data || [])
            ];
            logger.info('LeadEngine', `Total leads collected: ${allLeads.length}`);
            return { data: allLeads, error: null };
        }
        catch (error) {
            logger.error('LeadEngine', 'Failed to collect leads', error);
            return { data: [], error: String(error) };
        }
    },
    /**
     * 2. Validate lead data format
     */
    validateLead(lead) {
        // A real lead must at least have a name and some contact point
        if (!lead.company_name)
            return false;
        if (!lead.website && !lead.phone && !lead.email)
            return false;
        return true;
    },
    /**
     * 3. Process (Collect -> Validate -> Score -> Store)
     */
    async processAndStoreLeads(industry, location, userId) {
        try {
            logger.info('LeadEngine', `Processing and storing REAL leads for ${industry}`);
            const collection = await this.collectLeads(industry, location);
            const leads = collection.data || [];
            const validLeads = leads.filter(this.validateLead);
            const storedLeads = [];
            for (const lead of validLeads) {
                const score = leadScoring.scoreLead(lead);
                // Store in Supabase using the backend client
                const { data, error } = await supabaseClient.from('leads').insert([{
                        source: lead.source || 'LeadEngine (SerpAPI)',
                        contact_info: lead,
                        status: 'new',
                        score: score,
                        contacted: false,
                        user_id: userId || null
                    }]).select().single();
                if (!error && data) {
                    storedLeads.push(data);
                    // Publish event
                    await eventPublisher.publish(PlatformEvent.LEAD_CREATED, { leadId: data.id, score, industry });
                }
                else if (error) {
                    logger.warn('LeadEngine', `Failed to store lead: ${error.message}`);
                }
            }
            logger.info('LeadEngine', `Successfully processed ${storedLeads.length} valid leads`);
            return { data: storedLeads, error: null };
        }
        catch (error) {
            logger.error('LeadEngine', 'Failed to process leads', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * 4. Assign a lead to a sales agent by creating a task
     */
    async assignLead(leadId, salesAgentId) {
        try {
            logger.info('LeadEngine', `Assigning lead ${leadId} to agent ${salesAgentId}`);
            const taskResult = await agentScheduler.dispatchTask({
                agent_id: salesAgentId,
                status: 'pending',
                task_data: {
                    action: 'Perform Outreach',
                    lead_id: leadId
                }
            });
            return { data: taskResult.data, error: null };
        }
        catch (error) {
            logger.error('LeadEngine', 'Failed to assign lead', error);
            return { data: null, error: String(error) };
        }
    }
};

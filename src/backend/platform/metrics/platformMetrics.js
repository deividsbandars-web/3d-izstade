import { supabaseClient } from '../../../lib/supabaseClient';
import { logger } from '../../logging/logger';
export const platformMetrics = {
    /**
     * Retrieves aggregated statistics about agents and their tasks
     */
    async getAgentStats() {
        try {
            logger.info('PlatformMetrics', 'Fetching agent statistics');
            const { count: agentCount, error: agentError } = await supabaseClient
                .from('agents')
                .select('*', { count: 'exact', head: true });
            const { count: taskCount, error: taskError } = await supabaseClient
                .from('agent_tasks')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');
            if (agentError)
                throw agentError;
            if (taskError)
                throw taskError;
            return {
                data: {
                    number_of_agents: agentCount || 0,
                    tasks_completed: taskCount || 0
                },
                error: null
            };
        }
        catch (error) {
            logger.error('PlatformMetrics', 'Failed to get agent stats', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Retrieves aggregated statistics about leads and outreach
     */
    async getLeadStats() {
        try {
            logger.info('PlatformMetrics', 'Fetching lead statistics');
            const { count: leadCount, error: leadError } = await supabaseClient
                .from('leads')
                .select('*', { count: 'exact', head: true });
            const { count: contactedCount, error: contactedError } = await supabaseClient
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('contacted', true);
            if (leadError)
                throw leadError;
            if (contactedError)
                throw contactedError;
            return {
                data: {
                    leads_generated: leadCount || 0,
                    emails_sent: contactedCount || 0 // Proxy for emails sent based on 'contacted' status
                },
                error: null
            };
        }
        catch (error) {
            logger.error('PlatformMetrics', 'Failed to get lead stats', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Retrieves aggregated statistics about generated businesses
     */
    async getBusinessStats() {
        try {
            logger.info('PlatformMetrics', 'Fetching business statistics');
            const { count: projectCount, error } = await supabaseClient
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            if (error)
                throw error;
            return {
                data: {
                    active_projects: projectCount || 0
                },
                error: null
            };
        }
        catch (error) {
            logger.error('PlatformMetrics', 'Failed to get business stats', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Retrieves aggregated statistics about the Expo City
     */
    async getExpoStats() {
        try {
            logger.info('PlatformMetrics', 'Fetching expo statistics');
            const { data: analytics, error } = await supabaseClient
                .from('booth_analytics')
                .select('visits');
            if (error)
                throw error;
            const totalVisits = analytics?.reduce((sum, record) => sum + (record.visits || 0), 0) || 0;
            return {
                data: {
                    booth_visits: totalVisits
                },
                error: null
            };
        }
        catch (error) {
            logger.error('PlatformMetrics', 'Failed to get expo stats', error);
            return { data: null, error: String(error) };
        }
    }
};

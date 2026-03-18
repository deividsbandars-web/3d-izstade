import { supabaseClient } from '../../lib/supabaseClient';
import { logger } from '../logging/logger';
export const memoryService = {
    /**
     * Saves a new memory context for an agent
     */
    async saveMemory(payload) {
        try {
            const { data, error } = await supabaseClient
                .from('agent_memory')
                .insert([{
                    agent_id: payload.agent_id,
                    context: payload.context,
                    metadata: payload.metadata || {}
                }])
                .select()
                .single();
            if (error)
                throw error;
            return { data, error: null };
        }
        catch (error) {
            logger.error('MemoryService', 'Failed to save memory', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Gets recent memory for an agent
     */
    async getMemory(agentId, limit = 5) {
        try {
            const { data, error } = await supabaseClient
                .from('agent_memory')
                .select('*')
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return { data, error: null };
        }
        catch (error) {
            logger.error('MemoryService', 'Failed to get memory', error);
            return { data: null, error: String(error) };
        }
    },
    /**
     * Searches memory based on context matching (Basic ILIKE implementation for now,
     * can be upgraded to pgvector/embeddings later)
     */
    async searchMemory(agentId, query) {
        try {
            const { data, error } = await supabaseClient
                .from('agent_memory')
                .select('*')
                .eq('agent_id', agentId)
                .ilike('context', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(10);
            if (error)
                throw error;
            return { data, error: null };
        }
        catch (error) {
            logger.error('MemoryService', 'Failed to search memory', error);
            return { data: null, error: String(error) };
        }
    }
};

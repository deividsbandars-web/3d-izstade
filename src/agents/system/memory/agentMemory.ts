import { supabaseClient, handleSupabaseError } from '../../../lib/supabaseClient.js';

export const agentMemory = {
  /**
   * Stores a memory fragment for a specific agent.
   */
  async remember(agentId: string, key: string, value: any) {
    try {
      // Fetch current memory
      const { data: agent, error: fetchError } = await supabaseClient
        .from('agents')
        .select('memory')
        .eq('id', agentId)
        .single();

      if (fetchError) throw fetchError;

      const currentMemory = agent.memory || {};
      const updatedMemory = { ...currentMemory, [key]: value };

      // Update memory
      const { error: updateError } = await supabaseClient
        .from('agents')
        .update({ memory: updatedMemory })
        .eq('id', agentId);

      if (updateError) throw updateError;
      
      return { success: true, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'agentMemory.remember');
    }
  },

  /**
   * Retrieves a specific memory fragment.
   */
  async recall(agentId: string, key: string) {
    try {
      const { data, error } = await supabaseClient
        .from('agents')
        .select('memory')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      
      const memory = data.memory || {};
      return { data: memory[key] ?? null, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'agentMemory.recall');
    }
  }
};

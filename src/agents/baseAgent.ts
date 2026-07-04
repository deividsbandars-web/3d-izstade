import { createSystemLlmMetering, llmService } from '../backend/ai/llmService.js';
import { supabaseClient } from '../lib/supabaseClient.js';
import { logger } from '../backend/logging/logger.js';

export abstract class BaseAgent {
  role: string;
  systemPrompt: string;

  constructor(role: string, systemPrompt: string) {
    this.role = role;
    this.systemPrompt = systemPrompt;
  }

  abstract generatePrompt(taskData: any): string;

  async executeTask(taskId: string, _agentId: string, taskData: any): Promise<any> {
    try {
      logger.info(this.role, `Executing task ${taskId}`);
      
      const prompt = this.generatePrompt(taskData);
      const fullPrompt = `${this.systemPrompt}\n\nTask: ${prompt}`;

      const { text, error } = await llmService.generateText(fullPrompt, {
        metering: createSystemLlmMetering(this.role, 'execute-agent-task'),
        temperature: 0.7,
      });
      
      if (error || !text) throw new Error(error || 'LLM execution failed');

      const result = {
        status: 'success',
        role: this.role,
        output: text,
        completed_at: new Date().toISOString()
      };

      await this.storeResults(taskId, result);
      return result;
    } catch (error) {
      logger.error(this.role, `Task ${taskId} failed`, error);
      await this.storeResults(taskId, { status: 'failed', error: String(error) });
      return null;
    }
  }

  async storeResults(taskId: string, result: any) {
    await supabaseClient
      .from('agent_tasks')
      .update({ result, status: result.status, updated_at: new Date().toISOString() })
      .eq('id', taskId);
  }
}

// Legacy support
export async function runAgent(task: string) {
  const { text } = await llmService.generateText(`You are an autonomous business AI agent.\n\nTask: ${task}`, {
    metering: createSystemLlmMetering('base-agent', 'run-legacy-agent'),
  });
  return text;
}

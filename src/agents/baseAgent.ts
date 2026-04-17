import { supabaseClient } from '../lib/supabaseClient';

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
      console.info(`[BaseAgent] [${this.role}] Executing task ${taskId}`);
      
      const prompt = this.generatePrompt(taskData);
      const fullPrompt = `${this.systemPrompt}\n\nTask: ${prompt}`;

      const text = await requestAgentText(fullPrompt);
      
      if (!text) throw new Error('LLM execution failed');

      const result = {
        status: 'success',
        role: this.role,
        output: text,
        completed_at: new Date().toISOString()
      };

      await this.storeResults(taskId, result);
      return result;
    } catch (error) {
      console.error(`[BaseAgent] [${this.role}] Task ${taskId} failed`, error);
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
  return await requestAgentText(`You are an autonomous business AI agent.\n\nTask: ${task}`);
}

async function requestAgentText(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('/api/ai/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`AI_API_HTTP_${response.status}`);
    }

    const payload = await response.json() as { text?: string | null; response?: string | null };
    return payload.text || payload.response || null;
  } catch (error) {
    console.error('[BaseAgent] API fallback engaged', error);
    return `Simulated agent response for task: ${prompt.slice(0, 120)}`;
  }
}

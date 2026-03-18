import { llmService } from '../../ai/llmService';
import { logger } from '../../logging/logger';
import { agentScheduler } from '../../../agents/system/scheduler/agentScheduler';
export const marketingRunner = {
    async execute(taskId, _agentId, taskData) {
        try {
            logger.info('MarketingRunner', `Executing task ${taskId}`);
            const action = taskData.action || 'Create marketing plan';
            const brief = taskData.brief || '';
            const prompt = `You are a Chief Marketing Officer AI.
      Action: ${action}
      Brief: ${brief}
      
      Generate a comprehensive go-to-market strategy, ad copy examples, and campaign structure.`;
            const { text, error } = await llmService.generateText(prompt, { provider: 'openai', temperature: 0.8 });
            if (error || !text)
                throw new Error(String(error));
            const resultPayload = {
                status: 'success',
                runner: 'marketing',
                strategy: text,
                completed_at: new Date().toISOString()
            };
            await agentScheduler.completeTask(taskId, resultPayload, 'completed');
            logger.info('MarketingRunner', `Task ${taskId} completed.`);
            return resultPayload;
        }
        catch (error) {
            logger.error('MarketingRunner', `Task ${taskId} failed.`, error);
            await agentScheduler.completeTask(taskId, { error: String(error) }, 'failed');
            return null;
        }
    }
};

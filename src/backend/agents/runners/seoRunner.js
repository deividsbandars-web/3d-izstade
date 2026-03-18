import { llmService } from '../../ai/llmService';
import { logger } from '../../logging/logger';
import { agentScheduler } from '../../../agents/system/scheduler/agentScheduler';
export const seoRunner = {
    async execute(taskId, agentId, taskData) {
        try {
            logger.info('SEORunner', `Executing task ${taskId} for agent ${agentId}`);
            // 1. Read task payload
            const action = taskData.action || 'Perform SEO analysis';
            const brief = taskData.brief || 'No brief provided';
            // 2. Prepare Prompt
            const prompt = `You are an expert SEO Agent. 
      Action requested: ${action}
      Project Brief: ${brief}
      
      Provide a detailed SEO strategy, keyword clusters, and technical recommendations.`;
            // 3. Call LLM Service
            const { text, error } = await llmService.generateText(prompt, { provider: 'openai', temperature: 0.6 });
            if (error || !text) {
                throw new Error(`LLM Generation failed: ${error}`);
            }
            // 4. Produce Result and Store
            const resultPayload = {
                status: 'success',
                runner: 'seo',
                analysis: text,
                completed_at: new Date().toISOString()
            };
            await agentScheduler.completeTask(taskId, resultPayload, 'completed');
            logger.info('SEORunner', `Task ${taskId} completed successfully.`);
            return resultPayload;
        }
        catch (error) {
            logger.error('SEORunner', `Failed to execute task ${taskId}`, error);
            await agentScheduler.completeTask(taskId, { error: String(error) }, 'failed');
            return null;
        }
    }
};

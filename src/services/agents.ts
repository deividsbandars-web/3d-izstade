import { agentScheduler } from '../agents/system/scheduler/agentScheduler.js';
import { agentMemory } from '../agents/system/memory/agentMemory.js';
import { serverApiPost } from './serverApi.js';

export const AgentSystemAPI = {
  brain: {
    processTask: (taskId: string, agentId: string, taskData: Record<string, unknown>) => (
      serverApiPost('/api/agents/run', { agentId, taskData, taskId })
    ),
  },
  scheduler: agentScheduler,
  memory: agentMemory
};

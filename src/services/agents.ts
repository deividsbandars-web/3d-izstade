// Frontend exposure for agent orchestration system
import { agentBrain } from '../agents/system/brain/agentBrain.js';
import { agentScheduler } from '../agents/system/scheduler/agentScheduler.js';
import { agentMemory } from '../agents/system/memory/agentMemory.js';

export const AgentSystemAPI = {
  brain: agentBrain,
  scheduler: agentScheduler,
  memory: agentMemory
};

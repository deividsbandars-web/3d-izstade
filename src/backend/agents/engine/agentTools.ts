import { createAgentToolRegistry } from '../tools/agentToolService.js';
import type { AgentTool } from '../tools/agentToolTypes.js';

export type { AgentTool } from '../tools/agentToolTypes.js';

export const agentTools: Record<string, AgentTool> = createAgentToolRegistry();

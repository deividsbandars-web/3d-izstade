import { agentExecutor } from './execution/agentExecutor.js';

export interface RunAgentTaskInput {
  taskId: string;
  agentId: string;
  taskData: Record<string, any>;
}

export interface RunAgentTaskSuccess {
  ok: true;
  result: any;
  taskAction?: string;
}

export interface RunAgentTaskFailure {
  ok: false;
  error: string;
  result: any;
  statusCode: number;
  taskAction?: string;
}

export type RunAgentTaskOutcome = RunAgentTaskSuccess | RunAgentTaskFailure;

function resolveExecutionFailureReason(result: unknown) {
  if (!result || typeof result !== 'object') {
    return 'Agent execution failed';
  }

  const candidate = result as { reason?: unknown; error?: unknown; status?: unknown };
  if (typeof candidate.reason === 'string' && candidate.reason.trim()) {
    return candidate.reason;
  }

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  if (typeof candidate.status === 'string' && candidate.status !== 'success') {
    return `Agent execution returned status ${candidate.status}`;
  }

  return 'Agent execution failed';
}

export const agentsApplicationService = {
  async runAgentTask(input: RunAgentTaskInput): Promise<RunAgentTaskOutcome> {
    const { taskId, agentId, taskData } = input;
    const taskAction = taskData?.action;

    if (!taskId || !agentId) {
      return {
        ok: false,
        error: 'taskId and agentId are required',
        result: null,
        statusCode: 400,
        taskAction,
      };
    }

    try {
      const result = await agentExecutor.executeTask(taskId, agentId, taskData);

      if (!result || result.status === 'failed') {
        return {
          ok: false,
          error: resolveExecutionFailureReason(result),
          result,
          statusCode: 500,
          taskAction,
        };
      }

      return {
        ok: true,
        result,
        taskAction,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        result: null,
        statusCode: 500,
        taskAction,
      };
    }
  },
};

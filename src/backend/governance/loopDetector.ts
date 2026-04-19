import { logger } from '../logging/logger.js';
import { supabaseClient } from '../../lib/supabaseClient.js';

interface AgentTaskHistoryRecord {
  status?: string;
  task_data?: Record<string, any> | string | null;
  result?: Record<string, any> | null;
  created_at?: string;
}

export interface LoopDetectionResult {
  isLoop: boolean;
  reason?: string;
  policy: 'clear' | 'warn' | 'block';
  diagnostics?: {
    actionKey: string;
    sameActionRecentCount: number;
    sameLineageCount: number;
    consecutiveFailures: number;
  };
}

const HISTORY_LIMIT = 20;
const SAME_ACTION_BLOCK_THRESHOLD = 4;
const SAME_LINEAGE_BLOCK_THRESHOLD = 5;
const CONSECUTIVE_FAILURE_BLOCK_THRESHOLD = 3;

function normalizeActionKey(action: string) {
  return action.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 240);
}

function extractTaskPayload(task: AgentTaskHistoryRecord) {
  if (!task.task_data) {
    return {};
  }

  if (typeof task.task_data === 'string') {
    return { action: task.task_data };
  }

  return task.task_data;
}

function extractActionKey(task: AgentTaskHistoryRecord) {
  const payload = extractTaskPayload(task);
  return normalizeActionKey(String(payload.action || payload.brief || ''));
}

function extractLineageId(task: AgentTaskHistoryRecord) {
  const payload = extractTaskPayload(task);
  return String(
    payload.lineageId ||
    payload.governance?.lineageId ||
    payload._queue?.lineageId ||
    ''
  );
}

function countConsecutiveFailures(tasks: AgentTaskHistoryRecord[]) {
  let failures = 0;

  for (const task of tasks) {
    const status = task.status || '';
    const resultStatus = typeof task.result?.status === 'string' ? task.result.status : '';
    if (status === 'failed' || resultStatus === 'failed') {
      failures += 1;
      continue;
    }

    break;
  }

  return failures;
}

export const loopDetector = {
  async detectLoop(agentId: string, projectId: string, proposedAction: string): Promise<LoopDetectionResult> {
    const actionKey = normalizeActionKey(proposedAction);

    try {
      const { data: recentTasks, error } = await supabaseClient
        .from('agent_tasks')
        .select('status, task_data, result, created_at')
        .eq('agent_id', agentId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);

      if (error) {
        throw error;
      }

      if (!recentTasks || recentTasks.length === 0 || !actionKey) {
        return {
          isLoop: false,
          policy: 'clear',
          diagnostics: {
            actionKey,
            sameActionRecentCount: 0,
            sameLineageCount: 0,
            consecutiveFailures: 0
          }
        };
      }

      const lineageId = extractLineageId({
        task_data: { action: proposedAction, governance: { lineageId: `${projectId}:${actionKey}` } }
      });
      const sameActionRecentCount = recentTasks
        .slice(0, 8)
        .filter((task) => extractActionKey(task as AgentTaskHistoryRecord) === actionKey)
        .length;
      const sameLineageCount = recentTasks
        .filter((task) => extractLineageId(task as AgentTaskHistoryRecord) === lineageId)
        .length;
      const consecutiveFailures = countConsecutiveFailures(recentTasks as AgentTaskHistoryRecord[]);

      const diagnostics = {
        actionKey,
        sameActionRecentCount,
        sameLineageCount,
        consecutiveFailures
      };

      if (
        sameActionRecentCount >= SAME_ACTION_BLOCK_THRESHOLD ||
        sameLineageCount >= SAME_LINEAGE_BLOCK_THRESHOLD ||
        consecutiveFailures >= CONSECUTIVE_FAILURE_BLOCK_THRESHOLD
      ) {
        const reason = [
          sameActionRecentCount >= SAME_ACTION_BLOCK_THRESHOLD
            ? `action repeated ${sameActionRecentCount} times`
            : null,
          sameLineageCount >= SAME_LINEAGE_BLOCK_THRESHOLD
            ? `lineage repeated ${sameLineageCount} times`
            : null,
          consecutiveFailures >= CONSECUTIVE_FAILURE_BLOCK_THRESHOLD
            ? `${consecutiveFailures} consecutive failures`
            : null
        ].filter(Boolean).join(', ');

        logger.warn('LoopDetector', `Blocked repetitive workflow for agent ${agentId}: ${reason}`);
        return {
          isLoop: true,
          reason,
          policy: 'block',
          diagnostics
        };
      }

      if (sameActionRecentCount >= 2 || sameLineageCount >= 2) {
        return {
          isLoop: false,
          reason: 'repetition trend detected',
          policy: 'warn',
          diagnostics
        };
      }

      return {
        isLoop: false,
        policy: 'clear',
        diagnostics
      };
    } catch (error) {
      logger.error('LoopDetector', 'Failed to detect loops', error);

      if ((process.env.NODE_ENV ?? 'development') === 'production') {
        return {
          isLoop: true,
          reason: 'governance history unavailable',
          policy: 'block',
          diagnostics: {
            actionKey,
            sameActionRecentCount: 0,
            sameLineageCount: 0,
            consecutiveFailures: 0
          }
        };
      }

      return {
        isLoop: false,
        reason: 'governance history unavailable',
        policy: 'warn',
        diagnostics: {
          actionKey,
          sameActionRecentCount: 0,
          sameLineageCount: 0,
          consecutiveFailures: 0
        }
      };
    }
  }
};

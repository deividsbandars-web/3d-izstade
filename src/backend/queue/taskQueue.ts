import { supabaseClient } from '../../lib/supabaseClient';
import { agentExecutor } from '../agents/execution/agentExecutor';

const LEASE_DURATION_MS = 5 * 60_000;
const MAX_TASK_ATTEMPTS = 3;
const BATCH_SIZE = 10;
const WORKER_ID = `task-worker-${process.pid}`;

interface QueueMetadata {
  attempts?: number;
  leaseId?: string;
  leaseExpiresAt?: string;
  leasedBy?: string;
  claimedAt?: string;
  lastError?: string;
  lastFailedAt?: string;
  quarantineReason?: string;
}

interface AgentTaskRecord {
  id: string;
  agent_id: string;
  project_id?: string;
  status: string;
  task_data: Record<string, any>;
  result?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

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

let isListening = false;
let subscription: any = null;
const inFlightTasks = new Set<string>();

function getQueueMetadata(task: AgentTaskRecord): QueueMetadata {
  return (task.task_data?._queue as QueueMetadata | undefined) ?? {};
}

function buildQueueMetadata(task: AgentTaskRecord) {
  const existing = getQueueMetadata(task);
  const attempts = (existing.attempts ?? 0) + 1;
  const claimedAt = new Date().toISOString();
  const leaseId = `${WORKER_ID}:${task.id}:${Date.now()}`;

  return {
    ...existing,
    attempts,
    claimedAt,
    leaseId,
    leasedBy: WORKER_ID,
    leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_MS).toISOString(),
    lastError: undefined,
    quarantineReason: undefined
  } satisfies QueueMetadata;
}

function buildRetryTaskData(task: AgentTaskRecord, error: unknown) {
  const queue = getQueueMetadata(task);
  return {
    ...task.task_data,
    _queue: {
      ...queue,
      leasedBy: undefined,
      leaseId: undefined,
      leaseExpiresAt: undefined,
      lastFailedAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : String(error)
    } satisfies QueueMetadata
  };
}

function buildPoisonTaskData(task: AgentTaskRecord, error: unknown) {
  const queue = getQueueMetadata(task);
  return {
    ...task.task_data,
    _queue: {
      ...queue,
      leasedBy: undefined,
      leaseId: undefined,
      leaseExpiresAt: undefined,
      lastFailedAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : String(error),
      quarantineReason: 'max_attempts_exceeded'
    } satisfies QueueMetadata
  };
}

async function claimTask(task: AgentTaskRecord) {
  if (inFlightTasks.has(task.id)) {
    return null;
  }

  const queueMetadata = buildQueueMetadata(task);
  const taskData = {
    ...task.task_data,
    _queue: queueMetadata
  };

  const { data, error } = await supabaseClient
    .from('agent_tasks')
    .update({
      status: 'processing',
      task_data: taskData,
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error(`[TaskQueue] Failed to claim task ${task.id}:`, error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as AgentTaskRecord;
}

async function fetchPendingTask(taskId: string) {
  const { data, error } = await supabaseClient
    .from('agent_tasks')
    .select('*')
    .eq('id', taskId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    console.error(`[TaskQueue] Failed to fetch pending task ${taskId}:`, error.message);
    return null;
  }

  return data as AgentTaskRecord | null;
}

async function requeueTask(task: AgentTaskRecord, error: unknown) {
  const { error: updateError } = await supabaseClient
    .from('agent_tasks')
    .update({
      status: 'pending',
      task_data: buildRetryTaskData(task, error),
      result: {
        queueStatus: 'retry_scheduled',
        reason: error instanceof Error ? error.message : String(error)
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id);

  if (updateError) {
    console.error(`[TaskQueue] Failed to requeue task ${task.id}:`, updateError.message);
  }
}

async function quarantineTask(task: AgentTaskRecord, error: unknown) {
  const { error: updateError } = await supabaseClient
    .from('agent_tasks')
    .update({
      status: 'failed',
      task_data: buildPoisonTaskData(task, error),
      result: {
        queueStatus: 'poison_quarantined',
        attempts: getQueueMetadata(task).attempts ?? 0,
        reason: error instanceof Error ? error.message : String(error)
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id);

  if (updateError) {
    console.error(`[TaskQueue] Failed to quarantine task ${task.id}:`, updateError.message);
  }
}

export const taskQueue = {
  startListening() {
    if (isListening) return;

    console.log('[TaskQueue] Starting Realtime task listener...');
    isListening = true;

    void this.processNextBatch();

    subscription = supabaseClient
      .channel('pending_tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_tasks',
          filter: 'status=eq.pending'
        },
        (payload) => {
          const taskId = String(payload.new.id);
          console.log('[TaskQueue] New task detected via Realtime:', taskId);
          void this.processTaskById(taskId);
        }
      )
      .subscribe();
  },

  stopListening() {
    if (subscription) {
      supabaseClient.removeChannel(subscription);
      subscription = null;
    }
    isListening = false;
    console.log('[TaskQueue] Stopped Realtime task listener.');
  },

  async processTaskById(taskId: string) {
    const pendingTask = await fetchPendingTask(taskId);
    if (!pendingTask) {
      return;
    }

    const claimedTask = await claimTask(pendingTask);
    if (!claimedTask) {
      return;
    }

    await this.processTask(claimedTask);
  },

  async processTask(task: AgentTaskRecord) {
    if (inFlightTasks.has(task.id)) {
      return;
    }

    inFlightTasks.add(task.id);

    try {
      const enrichedTaskData = {
        ...task.task_data,
        project_id: task.project_id
      };

      const result = await agentExecutor.executeTask(task.id, task.agent_id, enrichedTaskData);

      if (!result || result.status === 'failed') {
        const attempts = getQueueMetadata(task).attempts ?? 1;
        const failureReason = resolveExecutionFailureReason(result);
        if (attempts >= MAX_TASK_ATTEMPTS) {
          await quarantineTask(task, failureReason);
        } else {
          await requeueTask(task, failureReason);
        }
      }
    } catch (err) {
      console.error(`[TaskQueue] Error processing task ${task.id}:`, err);
      const attempts = getQueueMetadata(task).attempts ?? 1;
      if (attempts >= MAX_TASK_ATTEMPTS) {
        await quarantineTask(task, err);
      } else {
        await requeueTask(task, err);
      }
    } finally {
      inFlightTasks.delete(task.id);
    }
  },

  async processNextBatch() {
    try {
      const { data: tasks, error } = await supabaseClient
        .from('agent_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE);

      if (error) {
        console.error('[TaskQueue] Error fetching tasks:', error.message);
        return;
      }

      if (!tasks || tasks.length === 0) {
        return;
      }

      console.log(`[TaskQueue] Found ${tasks.length} pending tasks. Claiming...`);
      const claimedTasks = await Promise.all(tasks.map((task) => claimTask(task as AgentTaskRecord)));
      const runnableTasks = claimedTasks.filter((task): task is AgentTaskRecord => Boolean(task));
      await Promise.allSettled(runnableTasks.map((task) => this.processTask(task)));
    } catch (err) {
      console.error('[TaskQueue] Unexpected error during batch processing:', err);
    }
  }
};

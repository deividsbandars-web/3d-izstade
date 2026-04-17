import { randomUUID } from 'crypto';
import { logger } from '../../logging/logger.js';
import { agentExecutionLoop } from './agentExecutionLoop.js';
import { agentTaskGraph } from './agentTaskGraph.js';
import type { TaskNode } from './agentTaskGraph.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';
import { memoryService } from '../memoryService.js';

const MAX_WORKFLOW_ITERATIONS = 20;
const MAX_TASK_ATTEMPTS = 2;
const MAX_STALLED_ITERATIONS = 2;

export const agentCoordinator = {
  async runCollaborativeWorkflow(projectId: string, _overarchingGoal: string, nodes: TaskNode[]) {
    try {
      logger.info('AgentCoordinator', `Starting collaborative workflow for project ${projectId}`);

      const graph = agentTaskGraph.buildGraph(nodes);
      const taskAttempts = new Map<string, number>();
      const workflowId = `workflow-${projectId}-${randomUUID()}`;
      let allCompleted = false;
      let iterations = 0;
      let stalledIterations = 0;
      let haltReason: string | null = null;

      const sharedMemoryId = `project_shared_${projectId}`;

      while (!allCompleted && iterations < MAX_WORKFLOW_ITERATIONS) {
        const readyTasks = agentTaskGraph.getReadyTasks(graph);

        if (readyTasks.length === 0) {
          const pending = Array.from(graph.values()).filter((node) => node.status === 'pending');
          if (pending.length === 0) {
            allCompleted = true;
            break;
          }

          stalledIterations += 1;
          if (stalledIterations >= MAX_STALLED_ITERATIONS) {
            haltReason = 'workflow_deadlock_or_dependency_stall';
            logger.warn('AgentCoordinator', 'Workflow halted due to repeated stall with pending tasks.');
            break;
          }

          iterations += 1;
          continue;
        }

        stalledIterations = 0;

        const executionResults = await Promise.all(readyTasks.map(async (task) => {
          const currentAttempt = (taskAttempts.get(task.id) ?? 0) + 1;
          taskAttempts.set(task.id, currentAttempt);

          if (currentAttempt > MAX_TASK_ATTEMPTS) {
            agentTaskGraph.updateTask(graph, task.id, 'failed', {
              status: 'failed',
              reason: 'max_task_attempts_exceeded',
              governance: {
                workflowId,
                attempts: currentAttempt - 1
              }
            });

            return { progressed: true, success: false };
          }

          agentTaskGraph.updateTask(graph, task.id, 'in_progress');

          try {
            const { data: agents } = await supabaseClient
              .from('agents')
              .select('id')
              .eq('role', task.agentRole)
              .limit(1);

            let agentId = agents?.[0]?.id;
            if (!agentId) {
              logger.warn('AgentCoordinator', `No specific agent found for role ${task.agentRole}, using fallback ID.`);
              agentId = 'shared_system_agent';
            }

            const sharedContext = await memoryService.getMemory(sharedMemoryId, 5);
            const contextString = sharedContext.data?.map((memory) => memory.context).join(' | ') || '';
            const lineageId = `${workflowId}:${task.id}:attempt-${currentAttempt}`;
            const enrichedTaskDescription =
              `${task.description}. Governance workflowId=${workflowId}. Lineage=${lineageId}. ` +
              `Context from other agents: ${contextString}`;

            const tempTaskId = `temp_collab_${task.id}_${Date.now()}`;
            const result = await agentExecutionLoop.runAgent(
              tempTaskId,
              agentId,
              task.agentRole,
              enrichedTaskDescription,
              3
            );

            if (result && result.status === 'success') {
              await memoryService.saveMemory({
                agent_id: sharedMemoryId,
                context: `Agent ${task.agentRole} completed task [${task.description}] under ${lineageId}. Result summary: ${JSON.stringify(result.results)}`,
                metadata: {
                  project_id: projectId,
                  workflow_id: workflowId,
                  lineage_id: lineageId
                }
              });

              agentTaskGraph.updateTask(graph, task.id, 'completed', {
                ...result,
                governance: {
                  workflowId,
                  lineageId,
                  attempts: currentAttempt
                }
              });

              return { progressed: true, success: true };
            }

            const failureResult = {
              ...(result || {}),
              status: 'failed',
              governance: {
                workflowId,
                lineageId,
                attempts: currentAttempt
              }
            };

            if (currentAttempt < MAX_TASK_ATTEMPTS) {
              agentTaskGraph.updateTask(graph, task.id, 'pending', {
                ...failureResult,
                retryScheduled: true
              });
            } else {
              agentTaskGraph.updateTask(graph, task.id, 'failed', failureResult);
            }

            return { progressed: true, success: false };
          } catch (error) {
            logger.error('AgentCoordinator', `Task ${task.id} failed`, error);

            if (currentAttempt < MAX_TASK_ATTEMPTS) {
              agentTaskGraph.updateTask(graph, task.id, 'pending', {
                status: 'failed',
                retryScheduled: true,
                governance: {
                  workflowId,
                  attempts: currentAttempt
                },
                error: String(error)
              });
            } else {
              agentTaskGraph.updateTask(graph, task.id, 'failed', {
                status: 'failed',
                governance: {
                  workflowId,
                  attempts: currentAttempt
                },
                error: String(error)
              });
            }

            return { progressed: true, success: false };
          }
        }));

        if (!executionResults.some((result) => result.progressed)) {
          stalledIterations += 1;
        }

        iterations += 1;
      }

      if (!allCompleted && !haltReason && iterations >= MAX_WORKFLOW_ITERATIONS) {
        haltReason = 'max_workflow_iterations_exceeded';
        logger.warn('AgentCoordinator', 'Workflow halted before all tasks completed (max iterations).');
      }

      return {
        success: allCompleted,
        workflowId,
        haltReason,
        finalState: Array.from(graph.values())
      };
    } catch (error) {
      logger.error('AgentCoordinator', 'Workflow orchestration failed', error);
      return { success: false, error: String(error) };
    }
  }
};

import type { Task, Material } from '../../models/index.js';

/**
 * Aprēķina kopējo projekta pašizmaksu (Materiāli + Darbs)
 */
export const calculateProjectCost = (tasks: Task[], materials: Material[]): number => {
  const taskCost = tasks.reduce((sum, task) => sum + (task.cost * task.hours), 0);
  const materialCost = materials.reduce((sum, mat) => sum + (mat.price * mat.quantity), 0);
  return taskCost + materialCost;
};

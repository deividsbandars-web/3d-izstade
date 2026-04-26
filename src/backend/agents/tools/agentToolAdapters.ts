import {
  dataSourceToolAdapters,
  leadToolAdapters,
  marketingToolAdapters,
  revenueToolAdapters,
  workflowToolAdapters,
} from './adapters/index.js';

export const agentToolAdapters = {
  ...dataSourceToolAdapters,
  ...leadToolAdapters,
  ...workflowToolAdapters,
  ...revenueToolAdapters,
  ...marketingToolAdapters,
};

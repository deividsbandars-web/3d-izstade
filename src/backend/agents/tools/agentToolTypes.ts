export interface AgentTool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}


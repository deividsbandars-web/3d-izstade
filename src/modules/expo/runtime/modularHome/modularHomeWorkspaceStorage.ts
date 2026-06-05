import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import type { ModularHomeProductId } from './modularHomeProducts';

export const MODULAR_HOME_PROJECT_WORKSPACE_KEY = 'warpala.modularHomeProjectWorkspace';

export type ModularHomeProjectQuoteStatus = 'notRequested' | 'localPreviewSaved';

export type ModularHomeLocalProject = {
  projectId: string;
  createdAt: string;
  updatedAt: string;
  productId: ModularHomeProductId;
  config: ModularHomeConfiguratorState;
  estimateTotal: number;
  quoteStatus: ModularHomeProjectQuoteStatus;
};

export type CreateModularHomeLocalProjectInput = {
  config: ModularHomeConfiguratorState;
  estimateTotal: number;
  productId: ModularHomeProductId;
  quoteStatus?: ModularHomeProjectQuoteStatus;
};

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function createProjectId(): string {
  return `home-project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProjects(value: unknown): ModularHomeLocalProject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ModularHomeLocalProject => (
    typeof item === 'object'
    && item !== null
    && typeof (item as ModularHomeLocalProject).projectId === 'string'
    && typeof (item as ModularHomeLocalProject).createdAt === 'string'
    && typeof (item as ModularHomeLocalProject).updatedAt === 'string'
    && typeof (item as ModularHomeLocalProject).productId === 'string'
    && typeof (item as ModularHomeLocalProject).estimateTotal === 'number'
    && typeof (item as ModularHomeLocalProject).quoteStatus === 'string'
    && typeof (item as ModularHomeLocalProject).config === 'object'
    && (item as ModularHomeLocalProject).config !== null
  ));
}

export function getModularHomeLocalProjects(): ModularHomeLocalProject[] {
  if (!isBrowserStorageAvailable()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(MODULAR_HOME_PROJECT_WORKSPACE_KEY);
    return normalizeProjects(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export function writeModularHomeLocalProjects(projects: readonly ModularHomeLocalProject[]): boolean {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(MODULAR_HOME_PROJECT_WORKSPACE_KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

export function createModularHomeLocalProject(
  input: CreateModularHomeLocalProjectInput,
): ModularHomeLocalProject {
  const now = new Date().toISOString();

  return {
    config: { ...input.config },
    createdAt: now,
    estimateTotal: input.estimateTotal,
    productId: input.productId,
    projectId: createProjectId(),
    quoteStatus: input.quoteStatus ?? 'notRequested',
    updatedAt: now,
  };
}

export function saveModularHomeLocalProject(project: ModularHomeLocalProject): boolean {
  const projects = getModularHomeLocalProjects();

  return writeModularHomeLocalProjects([
    project,
    ...projects.filter((item) => item.projectId !== project.projectId),
  ]);
}

export function duplicateModularHomeLocalProject(projectId: string): ModularHomeLocalProject | null {
  const projects = getModularHomeLocalProjects();
  const project = projects.find((item) => item.projectId === projectId);

  if (!project) {
    return null;
  }

  const now = new Date().toISOString();
  const duplicate: ModularHomeLocalProject = {
    ...project,
    config: { ...project.config },
    createdAt: now,
    projectId: createProjectId(),
    updatedAt: now,
  };

  return writeModularHomeLocalProjects([duplicate, ...projects]) ? duplicate : null;
}

export function deleteModularHomeLocalProject(projectId: string): boolean {
  const projects = getModularHomeLocalProjects();

  return writeModularHomeLocalProjects(projects.filter((project) => project.projectId !== projectId));
}

export function findModularHomeLocalProject(projectId: string): ModularHomeLocalProject | undefined {
  return getModularHomeLocalProjects().find((project) => project.projectId === projectId);
}

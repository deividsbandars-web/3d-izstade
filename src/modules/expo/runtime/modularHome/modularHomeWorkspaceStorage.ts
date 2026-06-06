import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import type { ModularHomeProductId } from './modularHomeProducts';

export const MODULAR_HOME_PROJECT_WORKSPACE_KEY = 'warpala.modularHomeProjectWorkspace';

export type ModularHomeProjectQuoteStatus = 'notRequested' | 'localPreviewSaved';

export type ModularHomeLocalProject = {
  projectId: string;
  createdAt: string;
  updatedAt: string;
  projectName: string;
  productId: ModularHomeProductId;
  config: ModularHomeConfiguratorState;
  estimateTotal: number;
  quoteStatus: ModularHomeProjectQuoteStatus;
};

export type CreateModularHomeLocalProjectInput = {
  config: ModularHomeConfiguratorState;
  estimateTotal: number;
  productId: ModularHomeProductId;
  projectName?: string;
  quoteStatus?: ModularHomeProjectQuoteStatus;
};

export type ModularHomeProjectComparisonOption = {
  currentValue: string;
  hasChanged: boolean;
  key: keyof ModularHomeConfiguratorState;
  label: string;
  savedValue: string;
};

export type ModularHomeProjectComparison = {
  currentProject: ModularHomeLocalProject;
  estimateDelta: number;
  options: readonly ModularHomeProjectComparisonOption[];
  savedProject: ModularHomeLocalProject;
};

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function createProjectId(): string {
  return `home-project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createFallbackProjectName(productId: string, createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return `${productId} project`;
  }

  return `${productId} ${date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}`;
}

function normalizeProjectName(value: unknown, productId: string, createdAt: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim().slice(0, 80);
  }

  return createFallbackProjectName(productId, createdAt);
}

function normalizeProjects(value: unknown): ModularHomeLocalProject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ModularHomeLocalProject[] => {
    if (
      typeof item !== 'object'
      || item === null
      || typeof (item as ModularHomeLocalProject).projectId !== 'string'
      || typeof (item as ModularHomeLocalProject).createdAt !== 'string'
      || typeof (item as ModularHomeLocalProject).updatedAt !== 'string'
      || typeof (item as ModularHomeLocalProject).productId !== 'string'
      || typeof (item as ModularHomeLocalProject).estimateTotal !== 'number'
      || typeof (item as ModularHomeLocalProject).quoteStatus !== 'string'
      || typeof (item as ModularHomeLocalProject).config !== 'object'
      || (item as ModularHomeLocalProject).config === null
    ) {
      return [];
    }

    const project = item as ModularHomeLocalProject;

    return [{
      ...project,
      projectName: normalizeProjectName(
        (item as Partial<ModularHomeLocalProject>).projectName,
        project.productId,
        project.createdAt,
      ),
    }];
  });
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
    projectName: normalizeProjectName(input.projectName, input.productId, now),
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
    projectName: `${project.projectName} copy`.slice(0, 80),
    updatedAt: now,
  };

  return writeModularHomeLocalProjects([duplicate, ...projects]) ? duplicate : null;
}

export function renameModularHomeLocalProject(
  projectId: string,
  projectName: string,
): ModularHomeLocalProject | null {
  const projects = getModularHomeLocalProjects();
  const project = projects.find((item) => item.projectId === projectId);

  if (!project) {
    return null;
  }

  const renamed: ModularHomeLocalProject = {
    ...project,
    projectName: normalizeProjectName(projectName, project.productId, project.createdAt),
    updatedAt: new Date().toISOString(),
  };

  return writeModularHomeLocalProjects([
    renamed,
    ...projects.filter((item) => item.projectId !== projectId),
  ]) ? renamed : null;
}

const COMPARE_OPTION_LABELS = {
  doorPackage: 'Door package',
  facade: 'Facade',
  finishLevel: 'Finish level',
  roof: 'Roof',
  template: 'Template',
  terrace: 'Terrace',
  windowPackage: 'Window package',
} as const satisfies Partial<Record<keyof ModularHomeConfiguratorState, string>>;

const COMPARE_OPTION_KEYS = Object.keys(COMPARE_OPTION_LABELS) as Array<keyof typeof COMPARE_OPTION_LABELS>;

export function createModularHomeProjectComparison(
  savedProject: ModularHomeLocalProject,
  currentProject: ModularHomeLocalProject,
): ModularHomeProjectComparison {
  return {
    currentProject,
    estimateDelta: currentProject.estimateTotal - savedProject.estimateTotal,
    options: COMPARE_OPTION_KEYS.map((key) => {
      const savedValue = String(savedProject.config[key] ?? '');
      const currentValue = String(currentProject.config[key] ?? '');

      return {
        currentValue,
        hasChanged: savedValue !== currentValue,
        key,
        label: COMPARE_OPTION_LABELS[key],
        savedValue,
      };
    }),
    savedProject,
  };
}

export function compareModularHomeLocalProjects(
  savedProjectId: string,
  currentProjectId: string,
): ModularHomeProjectComparison | null {
  const projects = getModularHomeLocalProjects();
  const savedProject = projects.find((project) => project.projectId === savedProjectId);
  const currentProject = projects.find((project) => project.projectId === currentProjectId);

  if (!savedProject || !currentProject) {
    return null;
  }

  return createModularHomeProjectComparison(savedProject, currentProject);
}

export function deleteModularHomeLocalProject(projectId: string): boolean {
  const projects = getModularHomeLocalProjects();

  return writeModularHomeLocalProjects(projects.filter((project) => project.projectId !== projectId));
}

export function findModularHomeLocalProject(projectId: string): ModularHomeLocalProject | undefined {
  return getModularHomeLocalProjects().find((project) => project.projectId === projectId);
}

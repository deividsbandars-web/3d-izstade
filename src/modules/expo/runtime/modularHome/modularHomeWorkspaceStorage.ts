import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import {
  calculateComponentBom,
  type ModularHomeComponentSummaryItem,
} from './modularHomeComponents';
import {
  getBomModuleSummary,
  getModulesForConfig,
  getModularHomeProduct,
  getModularHomeProductConfigSummary,
  type ModularHomeModuleId,
  type ModularHomeProductId,
} from './modularHomeProducts';

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

export type ModularHomeProjectComparisonOptionKey = 'product' | keyof ModularHomeConfiguratorState;

export type ModularHomeProjectComparisonOption = {
  currentValue: string;
  hasChanged: boolean;
  key: ModularHomeProjectComparisonOptionKey;
  label: string;
  savedValue: string;
};

export type ModularHomeProjectComparisonDeltaStatus = 'added' | 'changed' | 'removed' | 'same';

export type ModularHomeProjectComparisonModuleDelta = {
  costDelta: number;
  currentCost: number;
  currentQuantity: number;
  id: string;
  label: string;
  moduleType: string;
  quantityDelta: number;
  savedCost: number;
  savedQuantity: number;
  status: ModularHomeProjectComparisonDeltaStatus;
};

export type ModularHomeProjectComparisonComponentDelta = {
  category: string;
  costDelta: number;
  currentCost: number;
  currentQuantity: number;
  id: string;
  label: string;
  quantityDelta: number;
  savedCost: number;
  savedQuantity: number;
  status: ModularHomeProjectComparisonDeltaStatus;
  unit: string;
};

export type ModularHomeProjectComparisonBomSummary = {
  componentSubtotalDelta: number;
  currentComponentSubtotal: number;
  currentModuleCount: number;
  currentTotalQuantity: number;
  laborCostDelta: number;
  materialCostDelta: number;
  moduleCountDelta: number;
  savedComponentSubtotal: number;
  savedModuleCount: number;
  savedTotalQuantity: number;
  totalQuantityDelta: number;
  wasteCostDelta: number;
};

export type ModularHomeProjectComparison = {
  bomSummary: ModularHomeProjectComparisonBomSummary;
  componentDeltas: readonly ModularHomeProjectComparisonComponentDelta[];
  currentProject: ModularHomeLocalProject;
  changedOptionCount: number;
  estimateDelta: number;
  moduleDeltas: readonly ModularHomeProjectComparisonModuleDelta[];
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
  doorPlacement: 'Door placement',
  facade: 'Facade',
  finishLevel: 'Finish level',
  layoutVariant: 'Layout variant',
  roof: 'Roof',
  template: 'Template',
  terrace: 'Terrace',
  windowPackage: 'Window package',
  windowPlacement: 'Window placement',
} as const satisfies Partial<Record<keyof ModularHomeConfiguratorState, string>>;

const COMPARE_PRODUCT_OPTION_LABEL = {
  product: 'Product/template',
} as const satisfies Record<'product', string>;

const COMPARE_OPTION_KEYS = Object.keys(COMPARE_OPTION_LABELS) as Array<keyof typeof COMPARE_OPTION_LABELS>;
const COMPARE_ALL_OPTION_KEYS = [
  'product',
  ...COMPARE_OPTION_KEYS,
] as const satisfies readonly ModularHomeProjectComparisonOptionKey[];

function getProductLabel(project: ModularHomeLocalProject): string {
  return getModularHomeProduct(project.productId)?.name
    ?? getModularHomeProductConfigSummary(project.config).product
    ?? project.productId;
}

function getConfigCompareValue(
  project: ModularHomeLocalProject,
  key: ModularHomeProjectComparisonOptionKey,
): string {
  if (key === 'product') {
    return getProductLabel(project);
  }

  const summary = getModularHomeProductConfigSummary(project.config);
  const summaryValue = summary[key as keyof typeof summary];

  return typeof summaryValue === 'string'
    ? summaryValue
    : String(project.config[key] ?? '');
}

function getCompareOptionLabel(key: ModularHomeProjectComparisonOptionKey): string {
  return key === 'product'
    ? COMPARE_PRODUCT_OPTION_LABEL.product
    : COMPARE_OPTION_LABELS[key];
}

function createDeltaStatus(
  savedQuantity: number,
  currentQuantity: number,
  savedCost: number,
  currentCost: number,
): ModularHomeProjectComparisonDeltaStatus {
  if (savedQuantity <= 0 && currentQuantity > 0) {
    return 'added';
  }

  if (savedQuantity > 0 && currentQuantity <= 0) {
    return 'removed';
  }

  if (savedQuantity !== currentQuantity || savedCost !== currentCost) {
    return 'changed';
  }

  return 'same';
}

function roundComparisonNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

function addModuleSummary(
  summary: Map<string, {
    cost: number;
    label: string;
    moduleType: string;
    quantity: number;
  }>,
  input: {
    cost: number;
    id: string;
    label: string;
    moduleType: string;
    quantity: number;
  },
) {
  const existing = summary.get(input.id) ?? {
    cost: 0,
    label: input.label,
    moduleType: input.moduleType,
    quantity: 0,
  };

  existing.cost += input.cost;
  existing.quantity += input.quantity;
  summary.set(input.id, existing);
}

function summarizeProjectModules(project: ModularHomeLocalProject) {
  const summary = new Map<string, {
    cost: number;
    label: string;
    moduleType: string;
    quantity: number;
  }>();
  const baseModuleIds = new Set<ModularHomeModuleId>();

  for (const item of getBomModuleSummary(project.productId)) {
    baseModuleIds.add(item.moduleId);
    addModuleSummary(summary, {
      cost: item.totalPrice,
      id: item.moduleId,
      label: item.module?.id ?? item.moduleId,
      moduleType: item.moduleType,
      quantity: item.quantity,
    });
  }

  for (const module of getModulesForConfig(project.config)) {
    if (baseModuleIds.has(module.id)) {
      continue;
    }

    addModuleSummary(summary, {
      cost: module.price,
      id: module.id,
      label: module.id,
      moduleType: module.type,
      quantity: 1,
    });
  }

  return summary;
}

function createModuleDeltas(
  savedProject: ModularHomeLocalProject,
  currentProject: ModularHomeLocalProject,
): readonly ModularHomeProjectComparisonModuleDelta[] {
  const saved = summarizeProjectModules(savedProject);
  const current = summarizeProjectModules(currentProject);
  const moduleIds = [...new Set([...saved.keys(), ...current.keys()])];

  return moduleIds.map((id) => {
    const savedItem = saved.get(id);
    const currentItem = current.get(id);
    const savedQuantity = savedItem?.quantity ?? 0;
    const currentQuantity = currentItem?.quantity ?? 0;
    const savedCost = savedItem?.cost ?? 0;
    const currentCost = currentItem?.cost ?? 0;

    return {
      costDelta: currentCost - savedCost,
      currentCost,
      currentQuantity,
      id,
      label: currentItem?.label ?? savedItem?.label ?? id,
      moduleType: currentItem?.moduleType ?? savedItem?.moduleType ?? 'module',
      quantityDelta: currentQuantity - savedQuantity,
      savedCost,
      savedQuantity,
      status: createDeltaStatus(savedQuantity, currentQuantity, savedCost, currentCost),
    };
  }).sort((a, b) => Math.abs(b.costDelta) - Math.abs(a.costDelta));
}

function summarizeComponentsById(items: readonly ModularHomeComponentSummaryItem[]) {
  const summary = new Map<string, {
    category: string;
    cost: number;
    label: string;
    quantity: number;
    unit: string;
  }>();

  for (const item of items) {
    const existing = summary.get(item.componentId) ?? {
      category: item.category,
      cost: 0,
      label: item.label,
      quantity: 0,
      unit: item.unit,
    };

    existing.cost += item.totalCost;
    existing.quantity = roundComparisonNumber(existing.quantity + item.quantity);
    summary.set(item.componentId, existing);
  }

  return summary;
}

function createComponentDeltas(
  savedItems: readonly ModularHomeComponentSummaryItem[],
  currentItems: readonly ModularHomeComponentSummaryItem[],
): readonly ModularHomeProjectComparisonComponentDelta[] {
  const saved = summarizeComponentsById(savedItems);
  const current = summarizeComponentsById(currentItems);
  const componentIds = [...new Set([...saved.keys(), ...current.keys()])];

  return componentIds.map((id) => {
    const savedItem = saved.get(id);
    const currentItem = current.get(id);
    const savedQuantity = savedItem?.quantity ?? 0;
    const currentQuantity = currentItem?.quantity ?? 0;
    const savedCost = savedItem?.cost ?? 0;
    const currentCost = currentItem?.cost ?? 0;

    return {
      category: currentItem?.category ?? savedItem?.category ?? 'component',
      costDelta: currentCost - savedCost,
      currentCost,
      currentQuantity,
      id,
      label: currentItem?.label ?? savedItem?.label ?? id,
      quantityDelta: roundComparisonNumber(currentQuantity - savedQuantity),
      savedCost,
      savedQuantity,
      status: createDeltaStatus(savedQuantity, currentQuantity, savedCost, currentCost),
      unit: currentItem?.unit ?? savedItem?.unit ?? 'unit',
    };
  }).sort((a, b) => Math.abs(b.costDelta) - Math.abs(a.costDelta));
}

export function createModularHomeProjectComparison(
  savedProject: ModularHomeLocalProject,
  currentProject: ModularHomeLocalProject,
): ModularHomeProjectComparison {
  const savedBom = calculateComponentBom(savedProject.config);
  const currentBom = calculateComponentBom(currentProject.config);
  const options = COMPARE_ALL_OPTION_KEYS.map((key) => {
    const savedValue = getConfigCompareValue(savedProject, key);
    const currentValue = getConfigCompareValue(currentProject, key);

    return {
      currentValue,
      hasChanged: savedValue !== currentValue,
      key,
      label: getCompareOptionLabel(key),
      savedValue,
    };
  });

  return {
    bomSummary: {
      componentSubtotalDelta: currentBom.subtotal - savedBom.subtotal,
      currentComponentSubtotal: currentBom.subtotal,
      currentModuleCount: currentBom.moduleCount,
      currentTotalQuantity: currentBom.totalQuantity,
      laborCostDelta: currentBom.laborCostEstimate - savedBom.laborCostEstimate,
      materialCostDelta: currentBom.materialCostEstimate - savedBom.materialCostEstimate,
      moduleCountDelta: currentBom.moduleCount - savedBom.moduleCount,
      savedComponentSubtotal: savedBom.subtotal,
      savedModuleCount: savedBom.moduleCount,
      savedTotalQuantity: savedBom.totalQuantity,
      totalQuantityDelta: roundComparisonNumber(currentBom.totalQuantity - savedBom.totalQuantity),
      wasteCostDelta: currentBom.wasteCostEstimate - savedBom.wasteCostEstimate,
    },
    changedOptionCount: options.filter((option) => option.hasChanged).length,
    componentDeltas: createComponentDeltas(savedBom.items, currentBom.items),
    currentProject,
    estimateDelta: currentProject.estimateTotal - savedProject.estimateTotal,
    moduleDeltas: createModuleDeltas(savedProject, currentProject),
    options,
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

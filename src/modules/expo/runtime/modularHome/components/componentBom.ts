import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import { calculateModularHomeQuantities } from '../modularHomeQuantities';
import {
  createComponentPricingBreakdown,
  getModularHomePricingCategoryTotals,
  MODULAR_HOME_PRICING_CONTEXT,
  sumModularHomePricingBreakdowns,
} from '../modularHomePricing';
import {
  getBomModuleSummary,
  getModularHomeProduct,
  getModularHomeProductForConfig,
  getModulesForConfig,
  getModuleQuantitySummary,
  type ModularHomeModuleId,
} from '../modularHomeProducts';
import {
  getComponentById,
  getComponentIdsForModule,
  MODULAR_HOME_COMPONENT_BOM_DISCLAIMER,
  MODULAR_HOME_MODULE_COMPONENT_IDS,
  MODULAR_HOME_PRODUCT_COMPONENT_LIBRARY,
} from './catalog';
import type {
  ModularHomeComponent,
  ModularHomeComponentBom,
  ModularHomeComponentBomGroup,
  ModularHomeComponentCategory,
  ModularHomeComponentId,
  ModularHomeComponentSummaryItem,
  ModularHomeComponentUnit,
} from './types';
import { roundMoney, roundQuantity, roundRatio } from './manufacturingHelpers';
import { calculateComponentQuantity } from './quantity';

export function getComponentsForModule(moduleId: string): readonly ModularHomeComponent[] {
  if (!MODULAR_HOME_MODULE_COMPONENT_IDS[moduleId as ModularHomeModuleId]) {
    return [];
  }

  return getComponentIdsForModule(moduleId as ModularHomeModuleId)
    .map((componentId) => getComponentById(componentId))
    .filter((component): component is ModularHomeComponent => Boolean(component));
}

export function getComponentsForProduct(productId: string): readonly ModularHomeComponent[] {
  const product = getModularHomeProduct(productId);

  if (!product) {
    return [];
  }

  const componentIds = new Set<ModularHomeComponentId>();

  for (const componentId of MODULAR_HOME_PRODUCT_COMPONENT_LIBRARY[product.id]) {
    componentIds.add(componentId);
  }

  return [...componentIds]
    .map((componentId) => getComponentById(componentId))
    .filter((component): component is ModularHomeComponent => Boolean(component));
}

export function getComponentSummaryForConfig(
  config: ModularHomeConfiguratorState,
): readonly ModularHomeComponentSummaryItem[] {
  const product = getModularHomeProductForConfig(config);

  if (!product) {
    return [];
  }

  const moduleQuantityById = new Map(
    getModuleQuantitySummary(product.id).map((item) => [item.moduleId, item.quantity]),
  );
  const summaryByComponentId = new Map<ModularHomeComponentId, ModularHomeComponentSummaryItem & {
    mutableModuleIds: ModularHomeModuleId[];
  }>();

  for (const module of getModulesForConfig(config)) {
    const moduleQuantity = moduleQuantityById.get(module.id) ?? 1;

    for (const component of getComponentsForModule(module.id)) {
      if (!component.compatibleModuleTypes.includes(module.type)) {
        continue;
      }

      const quantity = calculateComponentQuantity(component, module, moduleQuantity, config);

      if (quantity <= 0) {
        continue;
      }

      const roundedQuantity = roundQuantity(quantity);
      const baseCost = roundMoney(roundedQuantity * component.baseUnitCost);
      const laborCost = roundMoney(roundedQuantity * component.laborUnitCost);
      const wasteCost = roundMoney((baseCost + laborCost) * component.wasteFactor);
      const totalCost = baseCost + laborCost + wasteCost;
      const existing = summaryByComponentId.get(component.id);

      if (existing) {
        existing.quantity = roundQuantity(existing.quantity + roundedQuantity);
        existing.baseCost += baseCost;
        existing.laborCost += laborCost;
        existing.pricingBreakdown = sumModularHomePricingBreakdowns([
          existing.pricingBreakdown,
          createComponentPricingBreakdown({
            laborCost,
            materialCost: baseCost,
            wasteCost,
          }),
        ]);
        existing.wasteCost += wasteCost;
        existing.totalCost += totalCost;
        if (!existing.mutableModuleIds.includes(module.id)) {
          existing.mutableModuleIds.push(module.id);
        }
        continue;
      }

      summaryByComponentId.set(component.id, {
        baseCost,
        category: component.category,
        component,
        componentId: component.id,
        label: component.label,
        laborCost,
        moduleIds: [module.id],
        mutableModuleIds: [module.id],
        notes: component.notes,
        pricingBreakdown: createComponentPricingBreakdown({
          laborCost,
          materialCost: baseCost,
          wasteCost,
        }),
        quantity: roundedQuantity,
        totalCost,
        unit: component.unit,
        visualToken: component.visualToken,
        wasteCost,
      });
    }
  }

  return [...summaryByComponentId.values()].map((item) => ({
    baseCost: item.baseCost,
    category: item.category,
    component: item.component,
    componentId: item.componentId,
    label: item.label,
    laborCost: item.laborCost,
    moduleIds: item.mutableModuleIds,
    notes: item.notes,
    pricingBreakdown: item.pricingBreakdown,
    quantity: roundQuantity(item.quantity),
    totalCost: item.totalCost,
    unit: item.unit,
    visualToken: item.visualToken,
    wasteCost: item.wasteCost,
  }));
}

export function calculateComponentBom(config: ModularHomeConfiguratorState): ModularHomeComponentBom {
  const product = getModularHomeProductForConfig(config);
  const items = getComponentSummaryForConfig(config);
  const quantities = calculateModularHomeQuantities(config);
  const moduleSummary = product ? getBomModuleSummary(product.id) : [];
  const pricingCategoryTotals = getModularHomePricingCategoryTotals(items.map((item) => item.pricingBreakdown));
  const groupsByCategory = new Map<ModularHomeComponentCategory, {
    componentIds: ModularHomeComponentId[];
    laborCostEstimate: number;
    materialCostEstimate: number;
    moduleIds: ModularHomeModuleId[];
    quantity: number;
    subtotal: number;
    units: Set<ModularHomeComponentUnit>;
    wasteCostEstimate: number;
  }>();

  for (const item of items) {
    const existing = groupsByCategory.get(item.category) ?? {
      componentIds: [],
      laborCostEstimate: 0,
      materialCostEstimate: 0,
      moduleIds: [],
      quantity: 0,
      subtotal: 0,
      units: new Set<ModularHomeComponentUnit>(),
      wasteCostEstimate: 0,
    };

    if (!existing.componentIds.includes(item.componentId)) {
      existing.componentIds.push(item.componentId);
    }

    for (const moduleId of item.moduleIds) {
      if (!existing.moduleIds.includes(moduleId)) {
        existing.moduleIds.push(moduleId);
      }
    }

    existing.laborCostEstimate += item.laborCost;
    existing.materialCostEstimate += item.baseCost;
    existing.quantity = roundQuantity(existing.quantity + item.quantity);
    existing.subtotal += item.totalCost;
    existing.units.add(item.unit);
    existing.wasteCostEstimate += item.wasteCost;
    groupsByCategory.set(item.category, existing);
  }

  const groups = [...groupsByCategory.entries()].map(([category, group]): ModularHomeComponentBomGroup => {
    const costBeforeWaste = group.materialCostEstimate + group.laborCostEstimate;

    return {
      category,
      componentCount: group.componentIds.length,
      componentIds: group.componentIds,
      laborCostEstimate: group.laborCostEstimate,
      materialCostEstimate: group.materialCostEstimate,
      moduleIds: group.moduleIds,
      quantity: roundQuantity(group.quantity),
      subtotal: group.subtotal,
      unit: group.units.size === 1 ? [...group.units][0] : 'mixed',
      wasteCostEstimate: group.wasteCostEstimate,
      wasteFactor: costBeforeWaste > 0 ? roundRatio(group.wasteCostEstimate / costBeforeWaste) : 0,
    };
  });

  return {
    componentCount: items.length,
    config,
    disclaimer: MODULAR_HOME_COMPONENT_BOM_DISCLAIMER,
    groups,
    items,
    laborCostEstimate: items.reduce((total, item) => total + item.laborCost, 0),
    materialCostEstimate: items.reduce((total, item) => total + item.baseCost, 0),
    moduleCount: quantities.moduleCount,
    modules: moduleSummary,
    pricingCategoryTotals,
    pricingContext: MODULAR_HOME_PRICING_CONTEXT,
    productId: product?.id ?? null,
    productName: product?.name ?? 'Unknown modular home',
    quantities,
    subtotal: items.reduce((total, item) => total + item.totalCost, 0),
    totalQuantity: roundQuantity(items.reduce((total, item) => total + item.quantity, 0)),
    wasteCostEstimate: items.reduce((total, item) => total + item.wasteCost, 0),
  };
}

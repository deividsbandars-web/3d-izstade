import type { ModularHomeConfiguratorState } from '../modularHomeConfigurator';
import { getModularHomeTemplate } from '../modularHomeConfig';
import { calculateModularHomeQuantities } from '../modularHomeQuantities';
import { summarizeModularHomePricing } from '../modularHomePricing';
import { getModularHomeDimensionSummary, getModularHomeProductConfigSummary, getModularHomeProductForConfig } from '../modularHomeProducts';
import { MODULAR_HOME_ESTIMATE_CONFIG, type ModularHomeEstimate, type ModularHomeEstimateAdjustment } from './estimateTypes';
import { sumLineItems } from './estimateFormatting';
import { createAdjustment, createBaseLineItems, createOptionLineItems, createOptionalServices } from './estimateLineItems';
import { createEstimateScenarios, createModularHomeEstimateSections, getModularHomeScopeOfSupply } from './estimateSections';
import { createVatEstimate } from './estimateVat';

export function calculateModularHomeEstimate(config: ModularHomeConfiguratorState): ModularHomeEstimate {
  const template = getModularHomeTemplate(config.template);
  const product = getModularHomeProductForConfig(config);
  const dimensions = getModularHomeDimensionSummary(config);
  const quantities = calculateModularHomeQuantities(config);
  const selectedOptions = getModularHomeProductConfigSummary(config);
  const basePrice = product?.basePrice ?? template.basePrice;
  const lineItems = [
    ...createBaseLineItems(basePrice, product?.id),
    ...createOptionLineItems(config),
  ];
  const subtotal = sumLineItems(lineItems);
  const optionalServices = createOptionalServices(
    quantities.grossFloorAreaM2 || product?.floorAreaM2 || (Number.parseInt(template.sizeLabel, 10) || 40),
    quantities.transportModuleCount || product?.transportModuleCount || 2,
  );
  const optionalServicesTotal = sumLineItems(optionalServices);
  const vatEstimate = createVatEstimate(subtotal + optionalServicesTotal);
  const estimatedTotal = subtotal + optionalServicesTotal + vatEstimate.amount;
  const baseModel = product?.name ?? template.name;
  const scenarios = createEstimateScenarios({
    estimatedTotal,
    optionalServicesTotal,
    productName: baseModel,
    subtotal,
  });
  const pricing = summarizeModularHomePricing([
    ...lineItems.map((item) => item.pricingBreakdown),
    ...optionalServices.map((item) => item.pricingBreakdown),
    vatEstimate.pricingBreakdown,
  ]);
  const sections = createModularHomeEstimateSections({
    lineItems,
    optionalServices,
    pricing,
    quantities,
    selectedOptions,
    vatEstimate,
  });
  const adjustments = [
    ...lineItems.slice(2),
    ...optionalServices,
    vatEstimate,
  ]
    .map(createAdjustment)
    .filter((item): item is ModularHomeEstimateAdjustment => item !== null);

  return {
    adjustments,
    baseModel,
    basePrice,
    basePriceLabel: 'Base modules + bathroom core',
    disclaimer: MODULAR_HOME_ESTIMATE_CONFIG.disclaimer,
    estimatedTotal,
    lineItems,
    optionalServices,
    optionalServicesTotal,
    pricing,
    priceConfidenceVersion: 'v5',
    quantities,
    scenarios,
    selectedOptions,
    sections,
    sizeLabel: `${dimensions.floorAreaM2} m2`,
    scopeOfSupply: getModularHomeScopeOfSupply(selectedOptions),
    subtotal,
    templateId: product?.defaultTemplateId ?? template.templateId,
    totalPrice: estimatedTotal,
    vatEstimate,
    vatRate: MODULAR_HOME_ESTIMATE_CONFIG.vatRate,
  };
}

export function calculateHomeEstimate(config: ModularHomeConfiguratorState): ModularHomeEstimate {
  return calculateModularHomeEstimate(config);
}

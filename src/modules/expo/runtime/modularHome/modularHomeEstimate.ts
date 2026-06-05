import {
  getModularHomeConfigSummary,
  type ModularHomeConfiguratorState,
  type ModularHomeFacadeOption,
  type ModularHomeFinishLevelOption,
  type ModularHomeRoofOption,
  type ModularHomeTerraceOption,
} from './modularHomeConfigurator';
import { getModularHomeTemplate, type ModularHomeTemplateId } from './modularHomeConfig';

export type ModularHomeEstimateAdjustment = {
  amount: number;
  id: string;
  label: string;
};

export type ModularHomeEstimate = {
  adjustments: readonly ModularHomeEstimateAdjustment[];
  baseModel: string;
  basePrice: number;
  basePriceLabel: string;
  disclaimer: string;
  selectedOptions: ReturnType<typeof getModularHomeConfigSummary>;
  sizeLabel: string;
  templateId: ModularHomeTemplateId;
  totalPrice: number;
};

export const MODULAR_HOME_ESTIMATE_CONFIG = {
  disclaimer: 'Estimate only \u00b7 final quote depends on site, transport and engineering.',
  facade: {
    naturalTimber: 0,
    darkThermoWood: 3200,
    lightPainted: 2400,
  } satisfies Record<ModularHomeFacadeOption, number>,
  finishLevel: {
    shell: 0,
    standard: 12000,
    premium: 24000,
  } satisfies Record<ModularHomeFinishLevelOption, number>,
  roof: {
    pitched: 0,
    flat: 0,
    greenRoofPlaceholder: 6500,
  } satisfies Record<ModularHomeRoofOption, number>,
  terrace: {
    none: 0,
    smallTerrace: 4500,
    extendedTerrace: 8000,
  } satisfies Record<ModularHomeTerraceOption, number>,
} as const;

function createAdjustment(id: string, label: string, amount: number): ModularHomeEstimateAdjustment | null {
  return amount === 0 ? null : { amount, id, label };
}

export function calculateHomeEstimate(config: ModularHomeConfiguratorState): ModularHomeEstimate {
  const template = getModularHomeTemplate(config.template);
  const selectedOptions = getModularHomeConfigSummary(config);
  const adjustments = [
    createAdjustment('facade', `${selectedOptions.facade} facade`, MODULAR_HOME_ESTIMATE_CONFIG.facade[config.facade]),
    createAdjustment('roof', `${selectedOptions.roof} roof`, MODULAR_HOME_ESTIMATE_CONFIG.roof[config.roof]),
    createAdjustment('terrace', selectedOptions.terrace, MODULAR_HOME_ESTIMATE_CONFIG.terrace[config.terrace]),
    createAdjustment('finishLevel', `${selectedOptions.finishLevel} finish`, MODULAR_HOME_ESTIMATE_CONFIG.finishLevel[config.finishLevel]),
  ].filter((item): item is ModularHomeEstimateAdjustment => item !== null);
  const basePrice = template.basePrice;
  const totalPrice = adjustments.reduce((total, item) => total + item.amount, basePrice);

  return {
    adjustments,
    baseModel: template.name,
    basePrice,
    basePriceLabel: template.basePriceLabel,
    disclaimer: MODULAR_HOME_ESTIMATE_CONFIG.disclaimer,
    selectedOptions,
    sizeLabel: template.sizeLabel,
    templateId: template.templateId,
    totalPrice,
  };
}

export function formatHomeEstimateEur(amount: number) {
  return new Intl.NumberFormat('en-IE', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

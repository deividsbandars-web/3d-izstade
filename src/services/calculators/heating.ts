import { COUNTRIES } from "../../core/constants";

export type HeatingCountryCode = keyof typeof COUNTRIES;

export const HEATING_SOURCES = {
  air_water: { name: "Gaiss-udens siltumsuknis (Panasonic/Daikin)", materialBase: 6500, laborBase: 1200 },
  ground_source: { name: "Geotermalais (zemes) siltumsuknis", materialBase: 9500, laborBase: 4500 },
  gas_boiler: { name: "Gazes kondensacijas katls", materialBase: 1800, laborBase: 600 },
  pellet_boiler: { name: "Granulu katls (automatiskais)", materialBase: 3800, laborBase: 1200 }
} as const;

export const HEATING_DISTRIBUTION_TYPES = {
  underfloor: { name: "Siltas gridas (caurules + kolektors)", materialRatePerM2: 22, laborRatePerM2: 18 },
  radiators: { name: "Radiatoru sistema (terauda / aluminija)", materialRatePerM2: 15, laborRatePerM2: 12 },
  industrial: { name: "Kaloriferi / gaisa silditaji", materialRatePerM2: 8, laborRatePerM2: 5 }
} as const;

export const HEATING_ADD_ONS = {
  automation: { name: "Vieda vadiba (smart home / WiFi)", price: 850 },
  buffer_tank: { name: "Akumulacijas tvertne (500-1000L)", price: 1200 },
  solar_ready: { name: "Saules kolektoru sagatave", price: 450 }
} as const;

export type HeatingSourceType = keyof typeof HEATING_SOURCES;
export type HeatingDistributionType = keyof typeof HEATING_DISTRIBUTION_TYPES;

export interface HeatingCalculatorInput {
  country: HeatingCountryCode;
  area: number;
  sourceType: HeatingSourceType;
  distType: HeatingDistributionType;
  includeAutomation: boolean;
  includeBuffer: boolean;
  includeSolar: boolean;
  floors: number;
}

export interface HeatingCostBreakdown {
  materials: number;
  labor: number;
}

export interface HeatingCalculatorResult {
  sourceCost: HeatingCostBreakdown;
  distributionCost: HeatingCostBreakdown;
  extrasCost: number;
  totalMaterials: number;
  totalLabor: number;
  grandTotal: number;
}

export interface HeatingDomainDefinition {
  category: "heating";
  contractVersion: "calculator-domain-v1-canonical";
  sourceOptions: typeof HEATING_SOURCES;
  distributionOptions: typeof HEATING_DISTRIBUTION_TYPES;
  addOnOptions: typeof HEATING_ADD_ONS;
}

export const HEATING_DOMAIN_DEFINITION: HeatingDomainDefinition = {
  category: "heating",
  contractVersion: "calculator-domain-v1-canonical",
  sourceOptions: HEATING_SOURCES,
  distributionOptions: HEATING_DISTRIBUTION_TYPES,
  addOnOptions: HEATING_ADD_ONS
};

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

export function calculateHeatingEstimate(input: HeatingCalculatorInput): HeatingCalculatorResult {
  const country = COUNTRIES[input.country];
  const source = HEATING_SOURCES[input.sourceType];
  const distribution = HEATING_DISTRIBUTION_TYPES[input.distType];

  const sourceCost: HeatingCostBreakdown = {
    materials: roundCurrency(source.materialBase * country.matMult),
    labor: roundCurrency(source.laborBase * country.workMult)
  };

  const distributionCost: HeatingCostBreakdown = {
    materials: roundCurrency(input.area * distribution.materialRatePerM2 * country.matMult),
    labor: roundCurrency(input.area * distribution.laborRatePerM2 * country.workMult)
  };

  let extrasCost = 0;
  if (input.includeAutomation) extrasCost += HEATING_ADD_ONS.automation.price * country.matMult;
  if (input.includeBuffer) extrasCost += HEATING_ADD_ONS.buffer_tank.price * country.matMult;
  if (input.includeSolar) extrasCost += HEATING_ADD_ONS.solar_ready.price * country.matMult;

  const totalMaterials = roundCurrency(sourceCost.materials + distributionCost.materials + extrasCost);
  const totalLabor = roundCurrency(sourceCost.labor + distributionCost.labor);

  return {
    sourceCost,
    distributionCost,
    extrasCost: roundCurrency(extrasCost),
    totalMaterials,
    totalLabor,
    grandTotal: roundCurrency(totalMaterials + totalLabor)
  };
}

// Legacy numeric adapter kept for old callers until all heating consumers migrate.
export function calculateHeating(area: number, unitPrice: number, laborRate: number, units: number) {
  const materials = (area * 0.5 * unitPrice) + (units * unitPrice);
  const labor = (area * laborRate) + (units * laborRate * 2);
  const overhead = materials * 0.1;
  const total = materials + labor + overhead;

  return { materials, labor, overhead, total };
}

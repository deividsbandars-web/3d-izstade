import type { ModularHomeTemplateId } from '../modularHomeConfig';
import type { ModularHomeQuantityTakeoff } from '../modularHomeQuantities';
import type {
  ModularHomeCostRegion,
  ModularHomeCurrency,
  ModularHomePricingBreakdown,
  ModularHomePricingSourceType,
  ModularHomePricingSummary,
} from '../modularHomePricing';
import type { getModularHomeProductConfigSummary } from '../modularHomeProducts';

export type ModularHomeEstimateLineItemCategory =
  | 'baseProduct'
  | 'bathroomCore'
  | 'facade'
  | 'roof'
  | 'terrace'
  | 'finish'
  | 'windowPackage'
  | 'doorPackage'
  | 'windowPlacement'
  | 'doorPlacement'
  | 'facadeBoardOrientation'
  | 'facadeBoardWidth'
  | 'facadeBoardProfile'
  | 'facadeBoardSpacing'
  | 'trimColor'
  | 'roofEdgeColor'
  | 'roofGutterStyle'
  | 'windowFrameColor'
  | 'windowFrameType'
  | 'interiorWallFinish'
  | 'floorFinish'
  | 'interiorFloorStyle'
  | 'wallPanelStyle'
  | 'furniturePackage'
  | 'sofa'
  | 'table'
  | 'bed'
  | 'kitchenLine'
  | 'wardrobePlaceholder'
  | 'transport'
  | 'installation'
  | 'vat';

export type ModularHomeEstimateConfidence =
  | 'packageFixed'
  | 'estimated'
  | 'siteDependent'
  | 'requiresEngineering';

export type ModularHomeEstimatePriceSource =
  | 'internalPreview'
  | 'supplierPlaceholder'
  | 'manualReviewRequired';

export type ModularHomeEstimatePricingAssumptions = {
  marginAssumption: string;
  notes: readonly string[];
  wasteAssumption: string;
};

export type ModularHomeEstimateScenarioId =
  | 'base'
  | 'expected'
  | 'premium'
  | 'siteDependentExtras';

export type ModularHomeEstimateReliabilityMetadata = {
  confidence: ModularHomeEstimateConfidence;
  currency: ModularHomeCurrency;
  lastUpdated: string;
  notes: readonly string[];
  priceSource: ModularHomeEstimatePriceSource;
  pricingAssumptions: ModularHomeEstimatePricingAssumptions;
  region: ModularHomeCostRegion;
  sourceType: ModularHomePricingSourceType;
  supplierPlaceholder: string;
};

export type ModularHomeEstimateLineItem = ModularHomeEstimateReliabilityMetadata & {
  amount: number;
  category: ModularHomeEstimateLineItemCategory;
  id: string;
  isPlaceholder?: boolean;
  label: string;
  note?: string;
  pricingBreakdown: ModularHomePricingBreakdown;
};

export type ModularHomeScopeOfSupplySectionId = 'included' | 'optional' | 'requiresReview';

export type ModularHomeScopeOfSupplySection = {
  id: ModularHomeScopeOfSupplySectionId;
  items: readonly string[];
  label: string;
};

export type ModularHomeEstimateAdjustment = {
  amount: number;
  id: string;
  label: string;
};

export type ModularHomeEstimateScenario = ModularHomeEstimateReliabilityMetadata & {
  amount: number;
  description: string;
  exclusions: readonly string[];
  finalQuoteRequirement: string;
  id: ModularHomeEstimateScenarioId;
  included: readonly string[];
  isAdditiveAllowance?: boolean;
  label: string;
  vatMarginNote: string;
};

export type ModularHomeEstimateSectionId =
  | 'modulePackage'
  | 'materials'
  | 'factoryLabor'
  | 'finishPackage'
  | 'terraceExtensions'
  | 'transportPlaceholder'
  | 'installationPlaceholder'
  | 'designEngineeringPlaceholder'
  | 'vatMarginContingency'
  | 'excludedSiteDependent';

export type ModularHomeEstimateSectionLineItem = ModularHomeEstimateReliabilityMetadata & {
  id: string;
  isExcluded?: boolean;
  isPlaceholder?: boolean;
  label: string;
  note?: string;
  quantity: string;
  subtotal: number | null;
  unit: string;
  unitCost: number | null;
};

export type ModularHomeEstimateSection = {
  confidence: ModularHomeEstimateConfidence;
  description: string;
  id: ModularHomeEstimateSectionId;
  label: string;
  lineItems: readonly ModularHomeEstimateSectionLineItem[];
  subtotal: number;
};

export type ModularHomeEstimate = {
  adjustments: readonly ModularHomeEstimateAdjustment[];
  baseModel: string;
  basePrice: number;
  basePriceLabel: string;
  disclaimer: string;
  estimatedTotal: number;
  lineItems: readonly ModularHomeEstimateLineItem[];
  optionalServices: readonly ModularHomeEstimateLineItem[];
  optionalServicesTotal: number;
  pricing: ModularHomePricingSummary;
  priceConfidenceVersion: 'v5';
  quantities: ModularHomeQuantityTakeoff;
  scenarios: readonly ModularHomeEstimateScenario[];
  selectedOptions: ReturnType<typeof getModularHomeProductConfigSummary>;
  sections: readonly ModularHomeEstimateSection[];
  sizeLabel: string;
  scopeOfSupply: readonly ModularHomeScopeOfSupplySection[];
  subtotal: number;
  templateId: ModularHomeTemplateId;
  totalPrice: number;
  vatEstimate: ModularHomeEstimateLineItem;
  vatRate: number;
};

export const MODULAR_HOME_ESTIMATE_CONFIG = {
  disclaimer: 'Estimate only - final quote depends on site, transport, VAT, foundations, utilities and engineering.',
  premiumScenarioContingencyRate: 0.12,
  installationPerM2: 180,
  transportBase: 900,
  transportPerModule: 1800,
  vatRate: 0.21,
} as const;

export type ModularHomeEstimateSectionLineItemDraft =
  Omit<ModularHomeEstimateSectionLineItem, keyof ModularHomeEstimateReliabilityMetadata>
  & Partial<ModularHomeEstimateReliabilityMetadata>
  & {
    sourceCategory?: ModularHomeEstimateLineItemCategory;
  };

export type ModularHomeEstimateSectionDraft =
  Omit<ModularHomeEstimateSection, 'lineItems' | 'subtotal'>
  & {
    lineItems: readonly ModularHomeEstimateSectionLineItemDraft[];
  };

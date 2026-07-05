import { MODULAR_HOME_PRICING_CONTEXT, type ModularHomePricingCategory, type ModularHomePricingSummary, type ModularHomePricingSourceType } from '../modularHomePricing';
import type {
  ModularHomeEstimateConfidence,
  ModularHomeEstimateLineItemCategory,
  ModularHomeEstimatePriceSource,
  ModularHomeEstimatePricingAssumptions,
  ModularHomeEstimateReliabilityMetadata,
  ModularHomeEstimateSectionId,
  ModularHomeEstimateSectionLineItem,
} from './estimateTypes';
import { getModularHomeEstimateSourceTypeLabel } from './estimateFormatting';

const PRICE_METADATA_LAST_UPDATED = MODULAR_HOME_PRICING_CONTEXT.priceDate;

export function getPricingAmount(
  pricing: ModularHomePricingSummary,
  category: ModularHomePricingCategory,
): number {
  return pricing.categoryTotals.find((item) => item.category === category)?.amount ?? 0;
}

export function sumSectionLineItems(lineItems: readonly ModularHomeEstimateSectionLineItem[]): number {
  return lineItems.reduce((total, item) => total + (item.subtotal ?? 0), 0);
}

export function hasReviewSignal(value: string | undefined): boolean {
  return /\b(corner|covered|engineering|extended|final|foundation|glazed|green|panoramic|permit|review|site|slider|supplier|transport)\b/i.test(value ?? '');
}

export function getEstimateSourceType(
  priceSource: ModularHomeEstimatePriceSource,
): ModularHomePricingSourceType {
  if (priceSource === 'supplierPlaceholder') {
    return 'supplierBudgetPlaceholder';
  }

  if (priceSource === 'manualReviewRequired') {
    return 'manualReview';
  }

  return 'internalDatabase';
}

export function getEstimateSupplierPlaceholder(input: {
  confidence: ModularHomeEstimateConfidence;
  priceSource: ModularHomeEstimatePriceSource;
  sectionId: ModularHomeEstimateSectionId;
  sourceCategory?: ModularHomeEstimateLineItemCategory;
}): string {
  const category = input.sourceCategory;

  if (input.priceSource === 'internalPreview') {
    return 'internal-preview-database';
  }

  if (input.sectionId === 'transportPlaceholder') {
    return 'transport-logistics-placeholder';
  }

  if (input.sectionId === 'installationPlaceholder') {
    return 'site-installation-placeholder';
  }

  if (input.sectionId === 'designEngineeringPlaceholder') {
    return 'engineering-review-placeholder';
  }

  if (category === 'windowPackage' || category === 'windowPlacement' || category === 'windowFrameColor' || category === 'windowFrameType') {
    return 'window-system-supplier-placeholder';
  }

  if (category === 'doorPackage' || category === 'doorPlacement') {
    return 'door-system-supplier-placeholder';
  }

  if (category === 'facade' || category === 'facadeBoardOrientation' || category === 'facadeBoardWidth' || category === 'facadeBoardProfile' || category === 'facadeBoardSpacing' || category === 'trimColor') {
    return 'facade-boarding-supplier-placeholder';
  }

  if (category === 'roof' || category === 'roofEdgeColor' || category === 'roofGutterStyle') {
    return 'roof-package-supplier-placeholder';
  }

  if (category === 'terrace') {
    return 'terrace-structure-supplier-placeholder';
  }

  if (category === 'finish' || category === 'interiorWallFinish' || category === 'floorFinish' || category === 'interiorFloorStyle' || category === 'wallPanelStyle') {
    return 'interior-finish-supplier-placeholder';
  }

  if (category === 'furniturePackage' || category === 'sofa' || category === 'table' || category === 'bed' || category === 'kitchenLine' || category === 'wardrobePlaceholder') {
    return 'interior-package-supplier-placeholder';
  }

  if (category === 'bathroomCore') {
    return 'bathroom-core-placeholder';
  }

  if (category === 'baseProduct') {
    return input.confidence === 'packageFixed' ? 'internal-module-library' : 'timber-module-supplier-placeholder';
  }

  return input.priceSource === 'manualReviewRequired'
    ? 'manual-review-placeholder'
    : 'general-supplier-placeholder';
}

export function getEstimatePricingAssumptions(input: {
  priceSource: ModularHomeEstimatePriceSource;
  sectionId: ModularHomeEstimateSectionId;
  sourceCategory?: ModularHomeEstimateLineItemCategory;
}): ModularHomeEstimatePricingAssumptions {
  const category = input.sourceCategory;
  const marginAssumption = input.priceSource === 'internalPreview'
    ? 'Preview margin allocation from internal pricing mix'
    : input.priceSource === 'supplierPlaceholder'
      ? 'Supplier placeholder margin, pending live quote review'
      : 'Manual review margin, final commercial terms required';
  const wasteAssumption = (
    category === 'facade'
    || category === 'facadeBoardOrientation'
    || category === 'facadeBoardWidth'
    || category === 'facadeBoardProfile'
    || category === 'facadeBoardSpacing'
    || category === 'roof'
    || category === 'terrace'
    || category === 'bathroomCore'
    || category === 'baseProduct'
  )
    ? 'Component/BOM waste allowance applied in preview planning'
    : input.sectionId === 'transportPlaceholder' || input.sectionId === 'installationPlaceholder'
      ? 'No direct material waste allowance; site/logistics placeholder only'
      : 'Waste carried through preview category allowances where applicable';
  const notes = [
    marginAssumption,
    wasteAssumption,
  ];

  return {
    marginAssumption,
    notes,
    wasteAssumption,
  };
}

export function createEstimateMetadata(input: {
  confidence?: ModularHomeEstimateConfidence;
  isExcluded?: boolean;
  isPlaceholder?: boolean;
  label: string;
  note?: string;
  notes?: readonly string[];
  priceSource?: ModularHomeEstimatePriceSource;
  sectionId: ModularHomeEstimateSectionId;
  sourceCategory?: ModularHomeEstimateLineItemCategory;
}): ModularHomeEstimateReliabilityMetadata {
  const category = input.sourceCategory;
  const hasReviewNote = hasReviewSignal(input.note) || hasReviewSignal(input.label);
  const confidence = input.confidence ?? (() => {
    if (input.isExcluded || input.sectionId === 'excludedSiteDependent' || input.sectionId === 'designEngineeringPlaceholder') {
      return 'requiresEngineering';
    }

    if (
      category === 'transport'
      || category === 'installation'
      || category === 'vat'
      || input.sectionId === 'transportPlaceholder'
      || input.sectionId === 'installationPlaceholder'
      || input.sectionId === 'vatMarginContingency'
    ) {
      return 'siteDependent';
    }

    if (hasReviewNote && (
      category === 'roof'
      || category === 'terrace'
      || category === 'windowPackage'
      || category === 'doorPackage'
      || category === 'windowPlacement'
      || category === 'doorPlacement'
      || category === 'facadeBoardOrientation'
      || category === 'facadeBoardWidth'
      || category === 'roofEdgeColor'
      || category === 'windowFrameColor'
      || category === 'interiorWallFinish'
      || category === 'floorFinish'
      || category === 'furniturePackage'
      || category === 'sofa'
      || category === 'table'
      || category === 'bed'
      || category === 'kitchenLine'
      || category === 'wardrobePlaceholder'
    )) {
      return 'requiresEngineering';
    }

    if (category === 'baseProduct') {
      return 'packageFixed';
    }

    return 'estimated';
  })();
  const priceSource = input.priceSource ?? (() => {
    if (
      confidence === 'requiresEngineering'
      || confidence === 'siteDependent'
      || input.isExcluded
    ) {
      return 'manualReviewRequired';
    }

    if (
      category === 'bathroomCore'
      || category === 'facade'
      || category === 'roof'
      || category === 'terrace'
      || category === 'finish'
      || category === 'windowPackage'
      || category === 'doorPackage'
      || category === 'windowPlacement'
      || category === 'doorPlacement'
      || category === 'facadeBoardOrientation'
      || category === 'facadeBoardWidth'
      || category === 'roofEdgeColor'
      || category === 'windowFrameColor'
      || category === 'interiorWallFinish'
      || category === 'floorFinish'
      || category === 'furniturePackage'
      || category === 'sofa'
      || category === 'table'
      || category === 'bed'
      || category === 'kitchenLine'
      || category === 'wardrobePlaceholder'
    ) {
      return 'supplierPlaceholder';
    }

    return 'internalPreview';
  })();
  const sourceType = getEstimateSourceType(priceSource);
  const supplierPlaceholder = getEstimateSupplierPlaceholder({
    confidence,
    priceSource,
    sectionId: input.sectionId,
    sourceCategory: category,
  });
  const pricingAssumptions = getEstimatePricingAssumptions({
    priceSource,
    sectionId: input.sectionId,
    sourceCategory: category,
  });
  const reliabilityNoteByConfidence: Record<ModularHomeEstimateConfidence, string> = {
    estimated: 'Preview estimate based on current module and option assumptions.',
    packageFixed: 'Preview package allowance from the internal modular product library.',
    requiresEngineering: 'Requires manual production, engineering or permit review before a real quote.',
    siteDependent: 'Site-dependent allowance; final cost depends on route, ground, utilities and local requirements.',
  };
  const sourceNoteByPriceSource: Record<ModularHomeEstimatePriceSource, string> = {
    internalPreview: 'Price source: internal preview pricing database.',
    manualReviewRequired: 'Price source: manual review required before production quote.',
    supplierPlaceholder: 'Price source: supplier placeholder until live supplier pricing is connected.',
  };
  const notes = [
    reliabilityNoteByConfidence[confidence],
    sourceNoteByPriceSource[priceSource],
    `Source type: ${getModularHomeEstimateSourceTypeLabel(sourceType)}.`,
    `Supplier placeholder: ${supplierPlaceholder}.`,
    `Region/currency: ${MODULAR_HOME_PRICING_CONTEXT.costRegionLabel} / ${MODULAR_HOME_PRICING_CONTEXT.currency}.`,
    ...pricingAssumptions.notes,
    ...(input.note ? [input.note] : []),
    ...(input.notes ?? []),
  ];

  return {
    confidence,
    currency: MODULAR_HOME_PRICING_CONTEXT.currency,
    lastUpdated: PRICE_METADATA_LAST_UPDATED,
    notes: Array.from(new Set(notes)),
    priceSource,
    pricingAssumptions,
    region: MODULAR_HOME_PRICING_CONTEXT.costRegion,
    sourceType,
    supplierPlaceholder,
  };
}

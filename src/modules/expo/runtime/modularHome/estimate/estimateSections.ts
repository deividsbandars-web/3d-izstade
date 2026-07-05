import type { ModularHomeQuantityTakeoff } from '../modularHomeQuantities';
import type { ModularHomePricingSummary } from '../modularHomePricing';
import type { getModularHomeProductConfigSummary } from '../modularHomeProducts';
import { MODULAR_HOME_ESTIMATE_CONFIG, type ModularHomeEstimateConfidence, type ModularHomeEstimateLineItem, type ModularHomeEstimateLineItemCategory, type ModularHomeEstimatePriceSource, type ModularHomeEstimateScenario, type ModularHomeEstimateScenarioId, type ModularHomeEstimateSection, type ModularHomeEstimateSectionDraft, type ModularHomeEstimateSectionId, type ModularHomeEstimateSectionLineItem, type ModularHomeEstimateSectionLineItemDraft, type ModularHomeScopeOfSupplySection } from './estimateTypes';
import { formatEstimateQuantity, getUnitCost, roundToNearestFifty } from './estimateFormatting';
import { createEstimateMetadata, getPricingAmount, hasReviewSignal, sumSectionLineItems } from './estimateMetadata';

export function normalizeSectionLineItem(
  sectionId: ModularHomeEstimateSectionId,
  item: ModularHomeEstimateSectionLineItemDraft,
): ModularHomeEstimateSectionLineItem {
  const { sourceCategory, ...lineItem } = item;

  return {
    ...lineItem,
    ...createEstimateMetadata({
      confidence: item.confidence,
      isExcluded: item.isExcluded,
      isPlaceholder: item.isPlaceholder,
      label: item.label,
      note: item.note,
      notes: item.notes,
      priceSource: item.priceSource,
      sectionId,
      sourceCategory,
    }),
  };
}

export function createSection(input: ModularHomeEstimateSectionDraft): ModularHomeEstimateSection {
  const lineItems = input.lineItems.map((item) => normalizeSectionLineItem(input.id, item));

  return {
    ...input,
    lineItems,
    subtotal: sumSectionLineItems(lineItems),
  };
}

export function createEstimateScenario(input: {
  amount: number;
  confidence: ModularHomeEstimateConfidence;
  description: string;
  exclusions: readonly string[];
  finalQuoteRequirement: string;
  id: ModularHomeEstimateScenarioId;
  included: readonly string[];
  isAdditiveAllowance?: boolean;
  label: string;
  notes: readonly string[];
  priceSource: ModularHomeEstimatePriceSource;
  vatMarginNote: string;
}): ModularHomeEstimateScenario {
  return {
    amount: input.amount,
    description: input.description,
    exclusions: input.exclusions,
    finalQuoteRequirement: input.finalQuoteRequirement,
    id: input.id,
    included: input.included,
    isAdditiveAllowance: input.isAdditiveAllowance,
    label: input.label,
    vatMarginNote: input.vatMarginNote,
    ...createEstimateMetadata({
      confidence: input.confidence,
      label: input.label,
      notes: input.notes,
      priceSource: input.priceSource,
      sectionId: input.id === 'siteDependentExtras' ? 'excludedSiteDependent' : 'vatMarginContingency',
      sourceCategory: input.id === 'siteDependentExtras' ? 'installation' : 'baseProduct',
    }),
  };
}

export function createEstimateScenarios(input: {
  estimatedTotal: number;
  optionalServicesTotal: number;
  productName: string;
  subtotal: number;
}): readonly ModularHomeEstimateScenario[] {
  const baseVatAmount = roundToNearestFifty(input.subtotal * MODULAR_HOME_ESTIMATE_CONFIG.vatRate);
  const baseScenarioAmount = input.subtotal + baseVatAmount;
  const premiumScenarioAmount = roundToNearestFifty(
    Math.max(
      input.estimatedTotal + input.estimatedTotal * MODULAR_HOME_ESTIMATE_CONFIG.premiumScenarioContingencyRate,
      input.estimatedTotal + 7500,
    ),
  );

  return [
    createEstimateScenario({
      amount: baseScenarioAmount,
      confidence: 'estimated',
      description: 'Base production package scenario for initial buyer discussion.',
      exclusions: [
        'transport and crane access',
        'installation and foundation works',
        'utility connections',
        'permits and municipality fees',
        'site preparation',
      ],
      finalQuoteRequirement: 'Requires final model confirmation, supplier check and site review before quote.',
      id: 'base',
      included: [
        input.productName,
        'selected module and option package',
        'preview production package allowance',
        'VAT placeholder on the production package',
      ],
      label: 'Base package',
      notes: [
        'Useful for package comparison before site-dependent extras are added.',
        'Base scenario is not a complete installed project price.',
      ],
      priceSource: 'internalPreview',
      vatMarginNote: 'Includes preview VAT placeholder on production package only; margin/contingency are internal preview allocations.',
    }),
    createEstimateScenario({
      amount: input.estimatedTotal,
      confidence: 'siteDependent',
      description: 'Expected discussion scenario using current selected configuration and placeholders.',
      exclusions: [
        'final foundation design',
        'utility connection pricing',
        'permit and municipality-specific fees',
        'route-specific transport permits',
        'engineering release for production',
      ],
      finalQuoteRequirement: 'Requires manual quote review with site address, delivery route, foundation and engineering assumptions.',
      id: 'expected',
      included: [
        'selected production package',
        'transport placeholder',
        'installation placeholder',
        'VAT placeholder',
        'current option and detail selections',
      ],
      label: 'Expected discussion total',
      notes: [
        'This is the main client-facing preview scenario.',
        'Site-dependent placeholders are included but still require review.',
      ],
      priceSource: 'manualReviewRequired',
      vatMarginNote: 'VAT, margin and contingency are preview placeholders; final quote may separate tax and commercial terms.',
    }),
    createEstimateScenario({
      amount: premiumScenarioAmount,
      confidence: 'requiresEngineering',
      description: 'Premium scenario for higher specification, supplier review and contingency discussion.',
      exclusions: [
        'engineering-grade premium interior specification',
        'supplier-confirmed premium materials',
        'final glazing/weatherproofing details',
        'site-specific foundation and utilities',
      ],
      finalQuoteRequirement: 'Requires supplier confirmation, engineering review and final quote scope sign-off.',
      id: 'premium',
      included: [
        'expected scenario baseline',
        `${Math.round(MODULAR_HOME_ESTIMATE_CONFIG.premiumScenarioContingencyRate * 100)}% premium/contingency allowance`,
        'higher-specification review buffer',
      ],
      label: 'Premium scenario',
      notes: [
        'Use for investor/client conversations where premium finishes or risk buffer are expected.',
        'Not a guaranteed cap.',
      ],
      priceSource: 'manualReviewRequired',
      vatMarginNote: 'Premium scenario carries preview margin/contingency; VAT treatment must be confirmed in final quote.',
    }),
    createEstimateScenario({
      amount: input.optionalServicesTotal,
      confidence: 'siteDependent',
      description: 'Separated site-dependent extras allowance, shown as an additive planning block.',
      exclusions: [
        'soil report',
        'foundation contractor quote',
        'utility provider fees',
        'municipality fees',
        'transport permit/crane specifics',
      ],
      finalQuoteRequirement: 'Requires site survey, route check and local contractor/supplier quotes.',
      id: 'siteDependentExtras',
      included: [
        'transport placeholder',
        'installation placeholder',
      ],
      isAdditiveAllowance: true,
      label: 'Site-dependent extras',
      notes: [
        'This is not a standalone project total.',
        'Use it to explain what can change after site review.',
      ],
      priceSource: 'manualReviewRequired',
      vatMarginNote: 'VAT and margin treatment for extras depends on final delivery, installation and local contractor scope.',
    }),
  ];
}

export function getLineItemByCategory(
  lineItems: readonly ModularHomeEstimateLineItem[],
  category: ModularHomeEstimateLineItemCategory,
): ModularHomeEstimateLineItem | undefined {
  return lineItems.find((item) => item.category === category);
}

export function getLineItemsByCategories(
  lineItems: readonly ModularHomeEstimateLineItem[],
  categories: readonly ModularHomeEstimateLineItemCategory[],
): readonly ModularHomeEstimateLineItem[] {
  return lineItems.filter((item) => categories.includes(item.category));
}

export function createModularHomeEstimateSections(input: {
  lineItems: readonly ModularHomeEstimateLineItem[];
  optionalServices: readonly ModularHomeEstimateLineItem[];
  pricing: ModularHomePricingSummary;
  quantities: ModularHomeQuantityTakeoff;
  selectedOptions: ReturnType<typeof getModularHomeProductConfigSummary>;
  vatEstimate: ModularHomeEstimateLineItem;
}): readonly ModularHomeEstimateSection[] {
  const modulePackageItems = getLineItemsByCategories(input.lineItems, ['baseProduct', 'bathroomCore']);
  const finishItem = getLineItemByCategory(input.lineItems, 'finish');
  const terraceItem = getLineItemByCategory(input.lineItems, 'terrace');
  const transportItem = getLineItemByCategory(input.optionalServices, 'transport');
  const installationItem = getLineItemByCategory(input.optionalServices, 'installation');
  const materialSubtotal = getPricingAmount(input.pricing, 'material');
  const factoryLaborSubtotal = getPricingAmount(input.pricing, 'factoryLabor');
  const designEngineeringSubtotal = getPricingAmount(input.pricing, 'designEngineering');
  const marginSubtotal = getPricingAmount(input.pricing, 'margin');
  const contingencySubtotal = getPricingAmount(input.pricing, 'contingency');
  const grossFloorArea = input.quantities.grossFloorAreaM2 || 1;
  const materialAreaBasis = Math.max(
    input.quantities.facadeAreaM2 + input.quantities.roofAreaM2 + input.quantities.grossFloorAreaM2,
    grossFloorArea,
  );

  return [
    createSection({
      confidence: 'estimated',
      description: 'Factory module shell, wet core and base package allowances.',
      id: 'modulePackage',
      label: 'Module package',
      lineItems: modulePackageItems.map((item) => {
        const quantity = item.category === 'bathroomCore'
          ? input.quantities.bathroomCoreCount
          : input.quantities.moduleCount;

        return {
          confidence: item.category === 'baseProduct' ? 'packageFixed' : 'estimated',
          id: `section-${item.id}`,
          label: item.label,
          note: item.note,
          quantity: item.category === 'bathroomCore'
            ? formatEstimateQuantity(input.quantities.bathroomCoreCount, ' core')
            : formatEstimateQuantity(input.quantities.moduleCount, ' modules'),
          subtotal: item.amount,
          sourceCategory: item.category,
          unit: item.category === 'bathroomCore' ? 'core' : 'module package',
          unitCost: getUnitCost(item.amount, quantity),
        };
      }),
    }),
    createSection({
      confidence: 'estimated',
      description: 'Aggregated material allowance from component and option pricing categories.',
      id: 'materials',
      label: 'Materials',
      lineItems: [
        {
          confidence: 'estimated',
          id: 'section-materials-allowance',
          label: 'Materials allowance',
          note: 'Includes material-category allocations from modules, options and component BOM preview data.',
          quantity: formatEstimateQuantity(materialAreaBasis, ' m2 basis'),
          subtotal: materialSubtotal,
          unit: 'pricing m2 basis',
          unitCost: getUnitCost(materialSubtotal, materialAreaBasis),
        },
      ],
    }),
    createSection({
      confidence: 'estimated',
      description: 'Factory labor allowance from module and option pricing categories.',
      id: 'factoryLabor',
      label: 'Factory labor',
      lineItems: [
        {
          confidence: 'estimated',
          id: 'section-factory-labor-allowance',
          label: 'Factory labor allowance',
          note: 'Preview factory labor category allocation; supplier production timing still requires review.',
          quantity: formatEstimateQuantity(input.quantities.moduleCount, ' modules'),
          subtotal: factoryLaborSubtotal,
          unit: 'factory module',
          unitCost: getUnitCost(factoryLaborSubtotal, input.quantities.moduleCount),
        },
      ],
    }),
    createSection({
      confidence: 'estimated',
      description: 'Selected interior/finish package.',
      id: 'finishPackage',
      label: 'Finish package',
      lineItems: [
        {
          confidence: 'estimated',
          id: `section-${finishItem?.id ?? 'finish-package'}`,
          label: finishItem?.label ?? `Finish level: ${input.selectedOptions.finishLevel}`,
          note: finishItem?.note ?? 'Finish package estimate remains preview-only.',
          quantity: '1 package',
          subtotal: finishItem?.amount ?? 0,
          sourceCategory: finishItem?.category ?? 'finish',
          unit: 'finish package',
          unitCost: finishItem?.amount ?? 0,
        },
      ],
    }),
    createSection({
      confidence: hasReviewSignal(input.selectedOptions.terrace) ? 'requiresEngineering' : 'estimated',
      description: 'Selected terrace or extension package.',
      id: 'terraceExtensions',
      label: 'Terrace/extensions',
      lineItems: [
        {
          ...(input.selectedOptions.terrace === 'No terrace' ? { confidence: 'packageFixed' as const } : {}),
          id: `section-${terraceItem?.id ?? 'terrace-extension'}`,
          isPlaceholder: input.selectedOptions.terrace === 'No terrace',
          label: terraceItem?.label ?? `Terrace: ${input.selectedOptions.terrace}`,
          note: terraceItem?.note ?? 'Terrace extension package requires foundation/interface review.',
          quantity: input.quantities.terraceAreaM2 > 0
            ? formatEstimateQuantity(input.quantities.terraceAreaM2, ' m2')
            : '0 m2',
          subtotal: terraceItem?.amount ?? 0,
          sourceCategory: terraceItem?.category ?? 'terrace',
          unit: 'terrace area',
          unitCost: getUnitCost(terraceItem?.amount ?? 0, input.quantities.terraceAreaM2),
        },
      ],
    }),
    createSection({
      confidence: 'siteDependent',
      description: 'Transport allowance only; final logistics are route and site dependent.',
      id: 'transportPlaceholder',
      label: 'Transport placeholder',
      lineItems: [
        {
          confidence: 'siteDependent',
          id: `section-${transportItem?.id ?? 'transport-placeholder'}`,
          isPlaceholder: true,
          label: transportItem?.label ?? 'Transport placeholder',
          note: transportItem?.note,
          quantity: formatEstimateQuantity(input.quantities.transportModuleCount, ' transport modules'),
          subtotal: transportItem?.amount ?? 0,
          sourceCategory: transportItem?.category ?? 'transport',
          unit: 'transport module',
          unitCost: getUnitCost(transportItem?.amount ?? 0, input.quantities.transportModuleCount),
        },
      ],
    }),
    createSection({
      confidence: 'siteDependent',
      description: 'Installation allowance only; final site readiness and foundation scope are not included.',
      id: 'installationPlaceholder',
      label: 'Installation placeholder',
      lineItems: [
        {
          confidence: 'siteDependent',
          id: `section-${installationItem?.id ?? 'installation-placeholder'}`,
          isPlaceholder: true,
          label: installationItem?.label ?? 'Installation placeholder',
          note: installationItem?.note,
          quantity: formatEstimateQuantity(grossFloorArea, ' m2'),
          subtotal: installationItem?.amount ?? 0,
          sourceCategory: installationItem?.category ?? 'installation',
          unit: 'gross floor m2',
          unitCost: getUnitCost(installationItem?.amount ?? 0, grossFloorArea),
        },
      ],
    }),
    createSection({
      confidence: 'requiresEngineering',
      description: 'Design and engineering allocation from preview pricing categories.',
      id: 'designEngineeringPlaceholder',
      label: 'Design/engineering placeholder',
      lineItems: [
        {
          confidence: 'requiresEngineering',
          id: 'section-design-engineering-placeholder',
          isPlaceholder: true,
          label: 'Design and engineering allowance',
          note: 'Final structural, MEP and permit design scope requires review.',
          quantity: '1 allowance',
          subtotal: designEngineeringSubtotal,
          unit: 'allowance',
          unitCost: designEngineeringSubtotal,
        },
      ],
    }),
    createSection({
      confidence: 'siteDependent',
      description: 'Commercial and tax placeholders carried separately from production package costs.',
      id: 'vatMarginContingency',
      label: 'VAT/margin/contingency',
      lineItems: [
        {
          confidence: 'siteDependent',
          id: 'section-margin-placeholder',
          isPlaceholder: true,
          label: 'Margin placeholder',
          note: 'Preview margin allocation only.',
          quantity: '1 allowance',
          subtotal: marginSubtotal,
          unit: 'allowance',
          unitCost: marginSubtotal,
        },
        {
          confidence: 'siteDependent',
          id: 'section-contingency-placeholder',
          isPlaceholder: true,
          label: 'Contingency placeholder',
          note: 'Preview contingency allocation only.',
          quantity: '1 allowance',
          subtotal: contingencySubtotal,
          unit: 'allowance',
          unitCost: contingencySubtotal,
        },
        {
          confidence: 'estimated',
          id: `section-${input.vatEstimate.id}`,
          isPlaceholder: true,
          label: input.vatEstimate.label,
          note: input.vatEstimate.note,
          priceSource: 'internalPreview',
          quantity: '1 placeholder',
          subtotal: input.vatEstimate.amount,
          sourceCategory: input.vatEstimate.category,
          unit: 'VAT placeholder',
          unitCost: input.vatEstimate.amount,
        },
      ],
    }),
    createSection({
      confidence: 'requiresEngineering',
      description: 'Items not priced in the preview estimate and requiring project review.',
      id: 'excludedSiteDependent',
      label: 'Excluded/site-dependent',
      lineItems: [
        {
          confidence: 'requiresEngineering',
          id: 'section-excluded-site-preparation',
          isExcluded: true,
          label: 'Site preparation and earthworks',
          note: 'Requires site survey and local contractor pricing.',
          quantity: 'review',
          subtotal: null,
          unit: 'site',
          unitCost: null,
        },
        {
          confidence: 'requiresEngineering',
          id: 'section-excluded-foundation',
          isExcluded: true,
          label: 'Final foundation design and works',
          note: 'Foundation choice depends on soil, loads and municipality requirements.',
          quantity: 'review',
          subtotal: null,
          unit: 'site',
          unitCost: null,
        },
        {
          confidence: 'requiresEngineering',
          id: 'section-excluded-permits-utilities',
          isExcluded: true,
          label: 'Permits, utility connections and municipality fees',
          note: 'Local requirements are outside preview pricing.',
          quantity: 'review',
          subtotal: null,
          unit: 'project',
          unitCost: null,
        },
      ],
    }),
  ];
}

export function getModularHomeScopeOfSupply(
  selectedOptions: ReturnType<typeof getModularHomeProductConfigSummary>,
): readonly ModularHomeScopeOfSupplySection[] {
  return [
    {
      id: 'included',
      label: 'Included',
      items: [
        'Timber module shell',
        `${selectedOptions.dimensionPreset} controlled dimension preset`,
        `${selectedOptions.windowPackage} window package`,
        `${selectedOptions.doorPackage} door package`,
        `${selectedOptions.windowPlacement} controlled window placement`,
        `${selectedOptions.doorPlacement} controlled door placement`,
        `${selectedOptions.facade} facade package`,
        `${selectedOptions.facadeBoardOrientation} facade board orientation`,
        `${selectedOptions.facadeBoardWidth} facade board width`,
        `${selectedOptions.facadeBoardProfile} facade board profile`,
        `${selectedOptions.facadeBoardSpacing} facade board spacing`,
        `${selectedOptions.trimColor} trim color`,
        `${selectedOptions.roof} package`,
        `${selectedOptions.roofEdgeColor} roof edge color`,
        `${selectedOptions.roofGutterStyle} roof edge/gutter style`,
        `${selectedOptions.layoutVariant} layout planning preview`,
        `${selectedOptions.windowFrameColor} window frame color`,
        `${selectedOptions.windowFrameType} window frame type`,
        `${selectedOptions.interiorWallFinish} interior wall finish`,
        `${selectedOptions.floorFinish} floor finish`,
        `${selectedOptions.interiorFloorStyle} interior floor style`,
        `${selectedOptions.wallPanelStyle} wall panel style`,
        `${selectedOptions.furniturePackage} interior furniture package`,
        `Furniture toggles: sofa ${selectedOptions.sofa}, table ${selectedOptions.table}, bed ${selectedOptions.bed}, kitchen ${selectedOptions.kitchenLine}, wardrobe ${selectedOptions.wardrobePlaceholder}`,
        selectedOptions.terrace === 'No terrace'
          ? 'No terrace extension selected'
          : `${selectedOptions.terrace} extension package`,
        'Basic installation planning',
      ],
    },
    {
      id: 'optional',
      label: 'Optional',
      items: [
        'Foundation',
        'Terrace foundation and structural review',
        'Transport planning and delivery',
        'Utility connections',
        'Interior premium package',
        'Permits/design services',
      ],
    },
    {
      id: 'requiresReview',
      label: 'Not included / requires review',
      items: [
        'Site preparation',
        'Local permits',
        'Engineering verification',
        'Final transport cost',
        'Municipality-specific requirements',
      ],
    },
  ];
}

import type { ModularHomeQuotePreviewRequest } from './ModularHomeQuoteForm';
import {
  formatHomeEstimateEur,
  getModularHomeEstimateConfidenceLabel,
  type ModularHomeEstimate,
} from './modularHomeEstimate';
import type { ModularHomeMaterialTakeoff } from './modularHomeMaterialTakeoff';
import type { ModularHomeDimensionSummary, ModularHomeProductionConstraint } from './modularHomeProducts';
import type { ModularHomeComponentBom, ModularHomeManufacturingBom } from './modularHomeComponents';

export type ModularHomeProfessionalQuoteExportInput = {
  componentBom: ModularHomeComponentBom;
  dimensions: ModularHomeDimensionSummary;
  estimate: ModularHomeEstimate;
  generatedAt: Date;
  latestQuoteRequest: ModularHomeQuotePreviewRequest | null;
  manufacturingBom: ModularHomeManufacturingBom;
  materialTakeoff: ModularHomeMaterialTakeoff;
  productionConstraints: readonly ModularHomeProductionConstraint[];
  projectId: string;
};

export type ModularHomeProfessionalQuoteExportRow = {
  label: string;
  value: string;
};

export type ModularHomeProfessionalQuoteExportData = {
  clientRows: readonly ModularHomeProfessionalQuoteExportRow[];
  configRows: readonly ModularHomeProfessionalQuoteExportRow[];
  disclaimers: readonly string[];
  estimateScenarioRows: readonly {
    amountLabel: string;
    confidenceLabel: string;
    exclusions: readonly string[];
    finalQuoteRequirement: string;
    id: string;
    included: readonly string[];
    label: string;
  }[];
  exportText: string;
  headerRows: readonly ModularHomeProfessionalQuoteExportRow[];
  manufacturingRows: readonly ModularHomeProfessionalQuoteExportRow[];
  nextSteps: readonly string[];
  openingRows: readonly ModularHomeProfessionalQuoteExportRow[];
  productionConstraintRows: readonly string[];
  projectRows: readonly ModularHomeProfessionalQuoteExportRow[];
  scopeSections: readonly {
    id: string;
    items: readonly string[];
    label: string;
  }[];
  takeoffRows: readonly ModularHomeProfessionalQuoteExportRow[];
};

function formatGeneratedAt(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatLandOwned(value: string): string {
  if (value === 'yes') {
    return 'Yes';
  }
  if (value === 'no') {
    return 'No';
  }
  return 'Client to confirm';
}

export function buildModularHomeProfessionalQuoteExportData(
  input: ModularHomeProfessionalQuoteExportInput,
): ModularHomeProfessionalQuoteExportData {
  const {
    componentBom,
    dimensions,
    estimate,
    generatedAt,
    latestQuoteRequest,
    manufacturingBom,
    materialTakeoff,
    productionConstraints,
    projectId,
  } = input;

  const generatedAtLabel = formatGeneratedAt(generatedAt);
  const latestClientName = latestQuoteRequest?.name || 'Client placeholder';

  const headerRows = [
    { label: 'Export type', value: 'Professional quote export preview' },
    { label: 'Generated', value: generatedAtLabel },
    { label: 'Project ID', value: projectId },
    { label: 'Model', value: `${estimate.baseModel} / ${estimate.sizeLabel}` },
  ] as const;

  const clientRows = latestQuoteRequest ? [
    { label: 'Client', value: latestQuoteRequest.name || 'Client placeholder' },
    { label: 'Email', value: latestQuoteRequest.email || 'Not provided' },
    { label: 'Phone', value: latestQuoteRequest.phone || 'Not provided' },
    { label: 'Country / city', value: latestQuoteRequest.countryCity || 'Not provided' },
    { label: 'Land owned', value: formatLandOwned(latestQuoteRequest.landOwned) },
    { label: 'Target build date', value: latestQuoteRequest.targetBuildDate || 'Client to confirm' },
    { label: 'Budget range', value: latestQuoteRequest.budgetRange || 'Client to confirm' },
  ] : [
    { label: 'Client', value: 'Client placeholder' },
    { label: 'Email', value: 'Not captured yet' },
    { label: 'Phone', value: 'Not captured yet' },
    { label: 'Country / city', value: 'Not captured yet' },
    { label: 'Land owned', value: 'Client to confirm' },
    { label: 'Target build date', value: 'Client to confirm' },
    { label: 'Budget range', value: 'Client to confirm' },
  ] as const;

  const projectRows = [
    { label: 'Floor area', value: dimensions.floorAreaLabel },
    { label: 'Footprint', value: dimensions.footprintLabel },
    { label: 'Ceiling height', value: dimensions.ceilingHeightLabel },
    { label: 'Modules', value: dimensions.moduleCountLabel },
    { label: 'Transport modules', value: dimensions.transportModuleCountLabel },
    { label: 'Build note', value: dimensions.buildCategoryNote },
  ] as const;

  const configRows = [
    { label: 'Layout variant', value: estimate.selectedOptions.layoutVariant },
    { label: 'Dimension preset', value: estimate.selectedOptions.dimensionPreset },
    { label: 'Room-use profile', value: estimate.selectedOptions.roomUseProfile },
    { label: 'Facade', value: estimate.selectedOptions.facade },
    { label: 'Roof', value: estimate.selectedOptions.roof },
    { label: 'Terrace', value: estimate.selectedOptions.terrace },
    { label: 'Window package', value: `${estimate.selectedOptions.windowPackage} / ${estimate.selectedOptions.windowPlacement}` },
    { label: 'Door package', value: `${estimate.selectedOptions.doorPackage} / ${estimate.selectedOptions.doorPlacement}` },
    { label: 'Interior package', value: `${estimate.selectedOptions.finishLevel} / ${estimate.selectedOptions.interiorWallFinish} / ${estimate.selectedOptions.floorFinish}` },
    { label: 'Furniture package', value: estimate.selectedOptions.furniturePackage },
  ] as const;

  const takeoffRows = [
    { label: 'Gross floor area', value: `${materialTakeoff.grossFloorAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Exterior wall area', value: `${materialTakeoff.exteriorWallAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Facade area', value: `${materialTakeoff.facadeAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Facade boards', value: `${materialTakeoff.facadeBoardLinearM.toLocaleString('en-IE', { maximumFractionDigits: 1 })} lm` },
    { label: 'Roof area', value: `${materialTakeoff.roofAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Terrace decking', value: `${materialTakeoff.terraceDeckingAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Window area', value: `${materialTakeoff.totalWindowAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Door count', value: materialTakeoff.doorCount.toString() },
    { label: 'Bathroom core count', value: materialTakeoff.bathroomCoreCount.toString() },
    { label: 'Kitchen line count', value: materialTakeoff.kitchenLineCount.toString() },
  ] as const;

  const openingRows = [
    { label: 'Opening count', value: manufacturingBom.openingScheduleSummary.totalQuantity.toString() },
    { label: 'Windows', value: manufacturingBom.openingScheduleSummary.windowCount.toString() },
    { label: 'Doors', value: manufacturingBom.openingScheduleSummary.doorCount.toString() },
    { label: 'Review-required openings', value: manufacturingBom.openingScheduleSummary.reviewRequiredCount.toString() },
    { label: 'Opening estimate impact', value: formatHomeEstimateEur(manufacturingBom.openingScheduleSummary.totalEstimateImpact) },
  ] as const;

  const manufacturingRows = [
    { label: 'Panel groups', value: manufacturingBom.panelGroups.length.toString() },
    { label: 'Assembly groups', value: manufacturingBom.assemblyGroups.length.toString() },
    { label: 'Component codes', value: manufacturingBom.componentCodes.length.toString() },
    { label: 'Facade boards', value: `${manufacturingBom.facadeBoardLinearM.toLocaleString('en-IE', { maximumFractionDigits: 1 })} lm` },
    { label: 'Roof cassettes', value: `${manufacturingBom.roofCassetteAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Floor cassettes', value: `${manufacturingBom.floorCassetteAreaM2.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m2` },
    { label: 'Hardware placeholder groups', value: manufacturingBom.fastenerHardwarePlaceholders.length.toString() },
    { label: 'Component BOM subtotal', value: formatHomeEstimateEur(componentBom.subtotal) },
  ] as const;

  const estimateScenarioRows = estimate.scenarios.map((scenario) => ({
    amountLabel: `${scenario.isAdditiveAllowance ? '+' : ''}${formatHomeEstimateEur(scenario.amount)}`,
    confidenceLabel: getModularHomeEstimateConfidenceLabel(scenario.confidence),
    exclusions: scenario.exclusions,
    finalQuoteRequirement: scenario.finalQuoteRequirement,
    id: scenario.id,
    included: scenario.included,
    label: scenario.label,
  }));

  const scopeSections = estimate.scopeOfSupply.map((section) => ({
    id: section.id,
    items: section.items,
    label: section.label,
  }));

  const productionConstraintRows = productionConstraints.map((constraint) => (
    `${constraint.severity}: ${constraint.message} Next step: ${constraint.nextStep}`
  ));

  const nextSteps = [
    'Review land/site conditions and access constraints.',
    'Confirm transport route, crane or delivery setup.',
    'Run engineering review for structure, openings and terrace scope.',
    'Freeze final scope and issue final quote.',
  ] as const;

  const disclaimers = [
    estimate.disclaimer,
    manufacturingBom.disclaimer,
    materialTakeoff.disclaimer,
    'Professional quote export preview only. This is not a final contract price or engineering deliverable.',
    'Production verification, site review, transport review and final engineering sign-off are still required.',
  ] as const;

  const exportText = [
    'Modular Home Professional Quote Export',
    `Project ID: ${projectId}`,
    `Generated: ${generatedAtLabel}`,
    `Client: ${latestClientName}`,
    ...clientRows.map((row) => `${row.label}: ${row.value}`),
    'Project:',
    ...projectRows.map((row) => `- ${row.label}: ${row.value}`),
    'Configuration:',
    ...configRows.map((row) => `- ${row.label}: ${row.value}`),
    'Material takeoff summary:',
    ...takeoffRows.map((row) => `- ${row.label}: ${row.value}`),
    'Opening schedule summary:',
    ...openingRows.map((row) => `- ${row.label}: ${row.value}`),
    'Manufacturing BOM preview summary:',
    ...manufacturingRows.map((row) => `- ${row.label}: ${row.value}`),
    'Estimate scenarios:',
    ...estimateScenarioRows.flatMap((row) => [
      `- ${row.label}: ${row.amountLabel} (${row.confidenceLabel})`,
      `  Includes: ${row.included.join(', ')}`,
      `  Excludes: ${row.exclusions.join(', ')}`,
      `  Final quote: ${row.finalQuoteRequirement}`,
    ]),
    'Scope of supply:',
    ...scopeSections.flatMap((section) => [
      `${section.label}:`,
      ...section.items.map((item) => `- ${item}`),
    ]),
    'Production constraints:',
    ...(productionConstraintRows.length > 0 ? productionConstraintRows.map((row) => `- ${row}`) : ['- No critical production constraints flagged in the current preview.']),
    'Next steps:',
    ...nextSteps.map((step) => `- ${step}`),
    'Disclaimers:',
    ...disclaimers.map((item) => `- ${item}`),
  ].join('\n');

  return {
    clientRows,
    configRows,
    disclaimers,
    estimateScenarioRows,
    exportText,
    headerRows,
    manufacturingRows,
    nextSteps,
    openingRows,
    productionConstraintRows,
    projectRows,
    scopeSections,
    takeoffRows,
  };
}

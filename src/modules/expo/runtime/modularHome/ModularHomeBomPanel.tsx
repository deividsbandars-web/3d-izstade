import { type ModularHomePreviewConfig } from './modularHomeConfig';
import {
  type ModularHomeComponentBom,
  type ModularHomeComponentCategory,
  type ModularHomeComponentUnit,
  type ModularHomeManufacturingBom,
} from './modularHomeComponents';
import {
  formatHomeEstimateEur,
  type ModularHomeEstimate,
} from './modularHomeEstimate';
import { type ModularHomeMaterialTakeoff } from './modularHomeMaterialTakeoff';

type ModularHomeBomPanelProps = {
  componentBom: ModularHomeComponentBom;
  estimate: ModularHomeEstimate;
  isTouchDevice?: boolean;
  manufacturingBom: ModularHomeManufacturingBom;
  materialTakeoff: ModularHomeMaterialTakeoff;
  template: ModularHomePreviewConfig;
};

const COMPONENT_BOM_CATEGORY_LABELS = {
  wallPanel: 'Wall panels',
  floorCassette: 'Floor cassettes',
  roofCassette: 'Roof cassettes',
  facadeBoarding: 'Facade boarding',
  windowUnit: 'Window units',
  doorUnit: 'Door units',
  bathroomCore: 'Bathroom cores',
  kitchenLine: 'Kitchen lines',
  terraceDeck: 'Terrace decks',
  foundationPad: 'Foundation pads',
  interiorFinish: 'Interior finishes',
  furniturePackage: 'Furniture packages',
} as const satisfies Record<ModularHomeComponentCategory, string>;

function formatComponentBomUnit(unit: ModularHomeComponentUnit | 'mixed'): string {
  if (unit === 'm2') {
    return `m${String.fromCharCode(178)}`;
  }

  if (unit === 'linearM') {
    return 'linear m';
  }

  return unit;
}

function formatQuantityM2(value: number): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m${String.fromCharCode(178)}`;
}

function formatQuantityLinearM(value: number): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: 1 })} lm`;
}

function formatWasteFactor(value: number): string {
  return `${(value * 100).toLocaleString('en-IE', { maximumFractionDigits: 1 })}%`;
}

function formatOpeningTypeLabel(value: 'window' | 'exteriorDoor' | 'terraceDoor' | 'interiorDoorPlaceholder'): string {
  switch (value) {
    case 'window':
      return 'Window';
    case 'exteriorDoor':
      return 'Exterior door';
    case 'terraceDoor':
      return 'Terrace door';
    case 'interiorDoorPlaceholder':
      return 'Interior door placeholder';
    default:
      return value;
  }
}

export function ModularHomeBomPanel({
  componentBom,
  estimate,
  isTouchDevice = false,
  manufacturingBom,
  materialTakeoff,
  template,
}: ModularHomeBomPanelProps) {
  return (
        <section
          aria-label={`${template.name} module and manufacturing BOM`}
          data-home-bom-tab-panel="true"
          data-home-bom-tab-component-count={componentBom.componentCount}
          data-home-bom-tab-module-count={estimate.quantities.moduleCount}
          data-home-bom-tab-manufacturing-assembly-count={manufacturingBom.assemblyGroups.length}
          data-home-bom-tab-manufacturing-component-code-count={manufacturingBom.componentCodes.length}
          data-home-bom-tab-manufacturing-panel-count={manufacturingBom.panelGroups.reduce((total, group) => total + group.panelCount, 0)}
          data-home-bom-tab-manufacturing-board-length-count={manufacturingBom.boardLengthGroups.reduce((total, group) => total + group.quantity, 0)}
          data-home-bom-tab-manufacturing-hardware-count={manufacturingBom.fastenerHardwarePlaceholders.reduce((total, item) => total + item.quantity, 0)}
          style={{
            background: 'linear-gradient(180deg, rgba(20, 83, 45, 0.42), rgba(2, 6, 23, 0.62))',
            border: '1px solid rgba(134, 239, 172, 0.24)',
            borderRadius: isTouchDevice ? '15px' : '17px',
            display: 'grid',
            gap: isTouchDevice ? '9px' : '10px',
            marginTop: isTouchDevice ? '10px' : '12px',
            padding: isTouchDevice ? '10px' : '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
            <div>
              <div style={{ color: '#86efac', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                BOM workspace
              </div>
              <div style={{ color: '#ecfdf5', fontSize: isTouchDevice ? '0.8rem' : '0.88rem', fontWeight: 950, lineHeight: 1.08, marginTop: '4px' }}>
                Module package and manufacturing preview
              </div>
            </div>
            <div style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.72rem' : '0.78rem', fontWeight: 950, textAlign: 'right', whiteSpace: 'nowrap' }}>
              {formatHomeEstimateEur(componentBom.subtotal)}
            </div>
          </div>

          <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 800, lineHeight: 1.28 }}>
            {manufacturingBom.disclaimer}
          </div>

          <div style={{ display: 'grid', gap: isTouchDevice ? '7px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
            {([
              ['Modules', estimate.quantities.moduleCount.toString()],
              ['Components', componentBom.componentCount.toString()],
              ['Assembly groups', manufacturingBom.assemblyGroups.length.toString()],
              ['Component codes', manufacturingBom.componentCodes.length.toString()],
              ['Openings', manufacturingBom.openingScheduleSummary.totalQuantity.toString()],
              ['Material takeoff', `${formatQuantityM2(materialTakeoff.grossFloorAreaM2)} floor`],
              ['Facade boards', formatQuantityLinearM(manufacturingBom.facadeBoardLinearM)],
              ['Roof cassettes', formatQuantityM2(manufacturingBom.roofCassetteAreaM2)],
              ['Floor cassettes', formatQuantityM2(manufacturingBom.floorCassetteAreaM2)],
              ['Waste factor', formatWasteFactor(manufacturingBom.totalWasteFactor)],
            ] as const).map(([label, value]) => (
              <div
                key={label}
                data-home-bom-tab-total={`${label}:${value}`}
                style={{
                  background: 'rgba(2, 6, 23, 0.26)',
                  border: '1px solid rgba(134, 239, 172, 0.14)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '8px 9px' : '8px 9px',
                }}
              >
                <div style={{ color: '#86efac', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ color: '#dcfce7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 920, marginTop: '3px' }}>{value}</div>
              </div>
            ))}
          </div>

          <div
            data-home-bom-opening-schedule="true"
            data-home-bom-opening-count={manufacturingBom.openingScheduleSummary.totalQuantity}
            data-home-bom-opening-review-count={manufacturingBom.openingScheduleSummary.reviewRequiredCount}
            style={{
              background: 'rgba(2, 6, 23, 0.22)',
              border: '1px solid rgba(134, 239, 172, 0.12)',
              borderRadius: '10px',
              display: 'grid',
              gap: '5px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <div style={{ color: '#86efac', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Opening schedule v1
            </div>
            <div style={{ color: '#dcfce7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 860, lineHeight: 1.25 }}>
              {manufacturingBom.openingScheduleSummary.windowCount} windows · {manufacturingBom.openingScheduleSummary.doorCount} external doors · {manufacturingBom.openingScheduleSummary.reviewRequiredCount} review-required openings · estimate impact {formatHomeEstimateEur(manufacturingBom.openingScheduleSummary.totalEstimateImpact)}
            </div>
            <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25 }}>
              Controlled opening presets only. Final headers, flashing, sealing and terrace coordination still require production review.
            </div>
          </div>

          <div
            data-home-bom-material-takeoff="true"
            data-home-bom-material-window-area={materialTakeoff.totalWindowAreaM2}
            data-home-bom-material-door-count={materialTakeoff.doorCount}
            style={{
              background: 'rgba(2, 6, 23, 0.22)',
              border: '1px solid rgba(125, 211, 252, 0.14)',
              borderRadius: '10px',
              display: 'grid',
              gap: '6px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <div style={{ color: '#7dd3fc', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Material takeoff v1
            </div>
            <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 860, lineHeight: 1.25 }}>
              {materialTakeoff.disclaimer}
            </div>
            <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
              {([
                ['Gross floor area', formatQuantityM2(materialTakeoff.grossFloorAreaM2)],
                ['Exterior wall area', formatQuantityM2(materialTakeoff.exteriorWallAreaM2)],
                ['Interior partitions', formatQuantityM2(materialTakeoff.interiorWallPartitionAreaM2)],
                ['Facade area', formatQuantityM2(materialTakeoff.facadeAreaM2)],
                ['Facade boards', formatQuantityLinearM(materialTakeoff.facadeBoardLinearM)],
                ['Roof area', formatQuantityM2(materialTakeoff.roofAreaM2)],
                ['Floor finish area', formatQuantityM2(materialTakeoff.floorFinishAreaM2)],
                ['Interior wall finish', formatQuantityM2(materialTakeoff.interiorWallFinishAreaM2)],
                ['Terrace decking', formatQuantityM2(materialTakeoff.terraceDeckingAreaM2)],
                ['Window area', formatQuantityM2(materialTakeoff.totalWindowAreaM2)],
                ['Door count', materialTakeoff.doorCount.toString()],
                ['Kitchen lines', materialTakeoff.kitchenLineCount.toString()],
                ['Bathroom cores', materialTakeoff.bathroomCoreCount.toString()],
                ['Furniture items', materialTakeoff.furnitureItemCount.toString()],
              ] as const).map(([label, value]) => (
                <div
                  key={label}
                  data-home-bom-material-takeoff-item={`${label}:${value}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.38)',
                    border: '1px solid rgba(125, 211, 252, 0.12)',
                    borderRadius: '9px',
                    padding: isTouchDevice ? '6px 7px' : '7px 8px',
                  }}
                >
                  <div style={{ color: '#7dd3fc', fontSize: '0.48rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 880, marginTop: '3px' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              {materialTakeoff.notes.map((note) => (
                <div
                  key={note}
                  data-home-bom-material-takeoff-note={note}
                  style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.24 }}
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {componentBom.groups.map((group) => (
              <div
                key={group.category}
                data-home-bom-tab-component-group={`${group.category}:${group.quantity}:${group.subtotal}`}
                style={{
                  background: 'rgba(15, 23, 42, 0.42)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  display: 'grid',
                  gap: '4px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ alignItems: 'start', display: 'grid', gap: '8px', gridTemplateColumns: '1fr auto' }}>
                  <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 880, lineHeight: 1.25 }}>
                    {COMPONENT_BOM_CATEGORY_LABELS[group.category]} <span style={{ color: '#93c5fd' }}>({group.quantity} {formatComponentBomUnit(group.unit)})</span>
                  </span>
                  <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950 }}>
                    {formatHomeEstimateEur(group.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {manufacturingBom.panelGroups.slice(0, 5).map((group) => (
              <div
                key={group.id}
                data-home-bom-tab-panel-group={`${group.id}:${group.panelCount}:${group.areaM2}`}
                style={{
                  background: 'rgba(2, 6, 23, 0.24)',
                  border: '1px solid rgba(134, 239, 172, 0.12)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#d1fae5', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900 }}>
                  {group.label} · {group.panelCount} panels · {formatQuantityM2(group.areaM2)}
                </div>
                <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25, marginTop: '3px' }}>
                  {group.panelGroupId} / {group.componentCode} / {group.approximatePanelDimensions.join(' / ')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {manufacturingBom.panelSizeGroups.slice(0, 4).map((group) => (
              <div
                key={group.id}
                data-home-bom-tab-panel-size-group={`${group.id}:${group.panelCount}:${group.dimensions}:${group.areaM2}`}
                style={{
                  background: 'rgba(6, 78, 59, 0.22)',
                  border: '1px solid rgba(110, 231, 183, 0.13)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#a7f3d0', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 900 }}>
                  {group.label} - {group.panelCount} pcs - {group.dimensions}
                </div>
                <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25, marginTop: '3px' }}>
                  {formatQuantityM2(group.areaM2)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {manufacturingBom.openingSchedule.map((item) => (
              <div
                key={item.id}
                data-home-opening-schedule-item={`${item.openingId}:${item.type}:${item.wallSide}:${item.widthMm}:${item.heightMm}:${item.quantity}:${item.estimateImpact}`}
                style={{
                  background: 'rgba(2, 6, 23, 0.24)',
                  border: '1px solid rgba(134, 239, 172, 0.12)',
                  borderRadius: '10px',
                  display: 'grid',
                  gap: '4px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#d1fae5', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900 }}>
                  {item.openingId} · {formatOpeningTypeLabel(item.type)} · {item.wallSide} · {item.widthMm} x {item.heightMm} mm · qty {item.quantity}
                </div>
                <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25 }}>
                  {item.unitCodePlaceholder} / {item.frameType} / {item.glazingType} / estimate impact {formatHomeEstimateEur(item.estimateImpact)}
                </div>
                <div style={{ color: item.reviewRequirement ? '#fde68a' : '#86efac', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 760, lineHeight: 1.22 }}>
                  {item.reviewRequirement ?? item.notes}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '5px' }}>
            {([
              ['Opening schedule', manufacturingBom.openingSchedule.map((item) => `${item.openingId} ${formatOpeningTypeLabel(item.type)} ${item.wallSide} ${item.widthMm}x${item.heightMm}mm x${item.quantity}`).join(' / ') || 'No openings'],
              ['Board length groups', manufacturingBom.boardLengthGroups.map((group) => `${group.label}: ${group.quantity} pcs x ${group.lengthM}m`).join(' / ')],
              ['Assembly groups', manufacturingBom.assemblyGroups.map((group) => `${group.assemblyGroupId}: ${group.quantity} ${group.unit}`).join(' / ')],
              ['Component codes', manufacturingBom.componentCodes.slice(0, 10).join(' / ')],
              ['Panel group IDs', manufacturingBom.panelGroups.map((group) => group.panelGroupId).join(' / ')],
              ['Board categories', manufacturingBom.boardLengthGroups.map((group) => `${group.boardLengthCategory}: ${group.quantity}`).join(' / ')],
              ['Hardware groups', manufacturingBom.fastenerHardwarePlaceholders.map((item) => `${item.hardwareGroupId}: ${item.quantity} ${item.unit}`).join(' / ')],
              ['Waste categories', manufacturingBom.wasteFactorsByMaterial.map((item) => `${item.materialCategory}: ${formatWasteFactor(item.wasteFactor)}`).join(' / ')],
              ['Production batch notes', manufacturingBom.productionBatchNotes.slice(0, 2).join(' / ')],
              ['Transport package notes', manufacturingBom.transportPackageNotes.slice(0, 2).join(' / ')],
            ] as const).map(([label, value]) => (
              <div
                key={label}
                data-home-bom-tab-cutlist-readiness={`${label}:${value}`}
                style={{
                  borderTop: '1px solid rgba(134, 239, 172, 0.12)',
                  color: '#bbf7d0',
                  fontSize: isTouchDevice ? '0.52rem' : '0.56rem',
                  fontWeight: 780,
                  lineHeight: 1.25,
                  paddingTop: '5px',
                }}
              >
                <strong style={{ color: '#dcfce7' }}>{label}:</strong> {value}
              </div>
            ))}
          </div>
        </section>
  );
}

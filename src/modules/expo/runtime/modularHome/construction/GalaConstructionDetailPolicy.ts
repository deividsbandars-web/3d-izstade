import type { GalaConstructionWallKind } from './GalaConstructionModel';

export type GalaConstructionRenderDetailLevel = 'full' | 'reduced';
export type GalaConstructionRenderViewMode = 'cutaway' | 'exterior' | 'floorplan' | 'interior';

export function shouldRenderGalaWallSegment({
  renderDetailLevel,
  viewMode,
  wallKind,
}: {
  renderDetailLevel: GalaConstructionRenderDetailLevel;
  viewMode: GalaConstructionRenderViewMode;
  wallKind: GalaConstructionWallKind;
}) {
  if (renderDetailLevel === 'full') {
    return true;
  }

  return viewMode === 'exterior'
    ? wallKind === 'exterior'
    : true;
}

export function shouldRenderGalaExteriorInteriorFace({
  viewMode,
  wallKind,
}: {
  viewMode: GalaConstructionRenderViewMode;
  wallKind: GalaConstructionWallKind;
}) {
  return wallKind === 'exterior' && viewMode !== 'exterior';
}

export function shouldRenderGalaExteriorCladding({
  renderDetailLevel,
  viewMode,
}: {
  renderDetailLevel: GalaConstructionRenderDetailLevel;
  viewMode: GalaConstructionRenderViewMode;
}) {
  if (renderDetailLevel === 'full') {
    return true;
  }

  return viewMode !== 'interior';
}

export function shouldRenderGalaOpeningFineDetail(renderDetailLevel: GalaConstructionRenderDetailLevel) {
  return renderDetailLevel === 'full';
}

export function shouldRenderGalaRoofFineDetail(renderDetailLevel: GalaConstructionRenderDetailLevel) {
  return renderDetailLevel === 'full';
}

export function shouldRenderGalaRoomAssembly({
  renderDetailLevel,
  viewMode,
}: {
  renderDetailLevel: GalaConstructionRenderDetailLevel;
  viewMode: GalaConstructionRenderViewMode;
}) {
  return viewMode === 'interior'
    || viewMode === 'cutaway'
    || viewMode === 'floorplan'
    || renderDetailLevel === 'full';
}

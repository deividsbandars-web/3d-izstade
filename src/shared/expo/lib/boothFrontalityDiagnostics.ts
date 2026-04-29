import type { ExpoBoothPlacement } from '../layoutEngine.js';

export type BoothFrontalityPlacement = Pick<ExpoBoothPlacement, 'id' | 'nodeType' | 'rotation'>;

export type BoothFrontalityDiagnosticCode =
  | 'missing-rotation'
  | 'non-finite-rotation'
  | 'missing-node-type'
  | 'left-facing-conflict'
  | 'right-facing-conflict';

export type BoothFrontalityDiagnostic = {
  boothId: string;
  code: BoothFrontalityDiagnosticCode;
  message: string;
  nodeType?: BoothFrontalityPlacement['nodeType'];
  severity: 'warning';
  yaw?: number;
};

const LEFT_RIGHT_YAW_TOLERANCE = 0.05;

function normalizeYaw(yaw: number) {
  let normalized = yaw;
  while (normalized <= -Math.PI) {
    normalized += Math.PI * 2;
  }
  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }
  return normalized;
}

function hasRotationShape(placement: BoothFrontalityPlacement) {
  return Array.isArray(placement.rotation) && placement.rotation.length >= 3;
}

function hasFiniteYaw(placement: BoothFrontalityPlacement) {
  return hasRotationShape(placement) && Number.isFinite(placement.rotation[1]);
}

function isLeftFamily(nodeType: BoothFrontalityPlacement['nodeType']) {
  return nodeType === 'hero_left' || nodeType === 'standard_left';
}

function isRightFamily(nodeType: BoothFrontalityPlacement['nodeType']) {
  return nodeType === 'hero_right' || nodeType === 'standard_right';
}

export function diagnoseBoothFrontality(
  placements: BoothFrontalityPlacement[],
): BoothFrontalityDiagnostic[] {
  const diagnostics: BoothFrontalityDiagnostic[] = [];

  placements.forEach((placement) => {
    if (!hasRotationShape(placement)) {
      diagnostics.push({
        boothId: placement.id,
        code: 'missing-rotation',
        message: `Booth ${placement.id} is missing a rotation tuple.`,
        nodeType: placement.nodeType,
        severity: 'warning',
      });
      return;
    }

    if (!hasFiniteYaw(placement)) {
      diagnostics.push({
        boothId: placement.id,
        code: 'non-finite-rotation',
        message: `Booth ${placement.id} is missing a finite yaw rotation.`,
        nodeType: placement.nodeType,
        severity: 'warning',
      });
      return;
    }

    if (!placement.nodeType) {
      diagnostics.push({
        boothId: placement.id,
        code: 'missing-node-type',
        message: `Booth ${placement.id} has no nodeType for frontality reasoning.`,
        severity: 'warning',
        yaw: normalizeYaw(placement.rotation[1] ?? 0),
      });
      return;
    }

    const yaw = normalizeYaw(placement.rotation[1] ?? 0);

    if (isLeftFamily(placement.nodeType) && yaw < -LEFT_RIGHT_YAW_TOLERANCE) {
      diagnostics.push({
        boothId: placement.id,
        code: 'left-facing-conflict',
        message: `Booth ${placement.id} uses ${placement.nodeType} but yaw ${yaw.toFixed(2)} turns against the left-family frontage convention.`,
        nodeType: placement.nodeType,
        severity: 'warning',
        yaw,
      });
    }

    if (isRightFamily(placement.nodeType) && yaw > LEFT_RIGHT_YAW_TOLERANCE) {
      diagnostics.push({
        boothId: placement.id,
        code: 'right-facing-conflict',
        message: `Booth ${placement.id} uses ${placement.nodeType} but yaw ${yaw.toFixed(2)} turns against the right-family frontage convention.`,
        nodeType: placement.nodeType,
        severity: 'warning',
        yaw,
      });
    }
  });

  return diagnostics;
}

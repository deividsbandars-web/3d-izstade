import { buildScreenSockets } from '../legacy/worldCityGeometry';
import type { CanonicalPrimitive, CityScreenSocket, CityScreenSurface, ExpoPlanningZoneId, ExpoPlanningZonePlan } from '../types';

function defaultSocketRenderIntent(
  socket: CityScreenSocket,
  zoneId: ExpoPlanningZoneId
): NonNullable<CityScreenSocket['renderIntent']> {
  const frameDepth = socket.kind === 'hero_wall' ? 2.8 : socket.kind === 'tower_crown' ? 2.2 : 1.9;

  return {
    accentOpacity: socket.kind === 'hero_wall' ? 0.24 : 0.16,
    antennaHeight: socket.kind === 'hero_wall' ? socket.frameSize[1] * 0.08 : socket.kind === 'tower_crown' ? socket.frameSize[1] * 0.1 : 0,
    beamHeight: Math.max(1.1, socket.frameSize[1] * 0.026),
    braceDepth: frameDepth * 0.72,
    bridgeHeight: socket.kind === 'hero_wall' ? socket.frameSize[1] * 0.12 : socket.kind === 'tower_side' ? socket.frameSize[1] * 0.08 : 0,
    columnWidth: Math.max(1.3, socket.frameSize[0] * 0.034),
    frameDepth,
    maxDistance: socket.kind === 'hero_wall' || socket.kind === 'tower_crown' || zoneId === 'rear-campus' ? 1500 : 1040,
    visible: true,
  };
}

function buildSocketPrimitives(socket: CityScreenSocket): CanonicalPrimitive[] {
  const intent = socket.renderIntent;
  const frameDepth = intent?.frameDepth ?? 1.9;
  const frameWidth = socket.frameSize[0];
  const frameHeight = socket.frameSize[1];
  const columnWidth = intent?.columnWidth ?? Math.max(1.3, frameWidth * 0.034);
  const beamHeight = intent?.beamHeight ?? Math.max(1.1, frameHeight * 0.026);
  const accentWidth = socket.kind === 'hero_wall' ? frameWidth * 0.18 : frameWidth * 0.12;
  const braceDepth = intent?.braceDepth ?? (frameDepth * 0.72);
  const antennaHeight = intent?.antennaHeight ?? 0;
  const bridgeHeight = intent?.bridgeHeight ?? 0;

  const primitives: CanonicalPrimitive[] = [
    { color: '#08111c', emissive: socket.color, emissiveIntensity: 0.05, kind: 'box', metalness: 0.24, position: [0, 0, -(frameDepth * 0.28)], roughness: 0.42, size: [frameWidth * 0.96, frameHeight * 0.96, frameDepth * 0.4] },
    { color: '#15253b', emissive: socket.color, emissiveIntensity: 0.08, kind: 'box', metalness: 0.46, position: [-(frameWidth * 0.5) + (columnWidth * 0.5), 0, 0], roughness: 0.32, size: [columnWidth, frameHeight, braceDepth] },
    { color: '#15253b', emissive: socket.color, emissiveIntensity: 0.08, kind: 'box', metalness: 0.46, position: [(frameWidth * 0.5) - (columnWidth * 0.5), 0, 0], roughness: 0.32, size: [columnWidth, frameHeight, braceDepth] },
    { color: '#0f1b2c', emissive: socket.color, emissiveIntensity: 0.08, kind: 'box', metalness: 0.38, position: [0, (frameHeight * 0.5) - (beamHeight * 0.5), 0], roughness: 0.34, size: [frameWidth * 0.9, beamHeight, braceDepth] },
    { color: '#0f1b2c', emissive: socket.color, emissiveIntensity: 0.06, kind: 'box', metalness: 0.32, position: [0, -(frameHeight * 0.5) + (beamHeight * 0.5), 0], roughness: 0.38, size: [frameWidth * 0.86, beamHeight, braceDepth] },
    { color: socket.color, kind: 'plane', opacity: socket.kind === 'hero_wall' ? 0.12 : 0.08, position: [0, 0, frameDepth * 0.34], size: [frameWidth * 0.9, frameHeight * 0.9], transparent: true },
    { color: socket.color, kind: 'plane', opacity: intent?.accentOpacity ?? 0.16, position: [-(frameWidth * 0.5) + (accentWidth * 0.5), 0, frameDepth * 0.44], size: [accentWidth, frameHeight * 0.9], transparent: true },
  ];

  if (bridgeHeight > 0) {
    primitives.push({ color: '#122033', emissive: socket.color, emissiveIntensity: 0.1, kind: 'box', metalness: 0.38, position: [0, -(frameHeight * 0.5) - (bridgeHeight * 0.2), -(frameDepth * 0.12)], roughness: 0.3, size: [frameWidth * 0.26, bridgeHeight, frameDepth * 0.48] });
  }

  if (antennaHeight > 0) {
    primitives.push({ color: '#122033', emissive: socket.color, emissiveIntensity: 0.12, kind: 'box', metalness: 0.42, position: [0, (frameHeight * 0.5) + (antennaHeight * 0.5), -(frameDepth * 0.12)], roughness: 0.28, size: [frameWidth * 0.18, antennaHeight, frameDepth * 0.36] });
  }

  return primitives;
}

export function buildZoneScreenSocketPlan(
  surfaces: CityScreenSurface[],
  socketCap: number,
  zoneId: ExpoPlanningZoneId
) {
  return buildScreenSockets(surfaces).slice(0, socketCap).map((socket) => {
    const renderIntent = socket.renderIntent ?? defaultSocketRenderIntent(socket, zoneId);

    return {
      ...socket,
      renderIntent: {
        ...renderIntent,
        primitives: buildSocketPrimitives({
          ...socket,
          renderIntent,
        }),
      },
      sections: socket.sections ?? surfaces.find((surface) => surface.id === socket.surfaceId)?.sections,
    };
  });
}

export function flattenZoneScreenSockets(
  zones: ExpoPlanningZonePlan[],
  options?: { includeRearCampus?: boolean }
) {
  const includeRearCampus = options?.includeRearCampus ?? false;
  return zones.flatMap((zone) => (
    includeRearCampus || zone.id !== 'rear-campus'
      ? zone.screenSockets
      : []
  )) as CityScreenSocket[];
}

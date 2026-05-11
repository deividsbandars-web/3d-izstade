import type { CityScreenSurface } from '../planning/types';

export type RearCampusScreenHostShell = {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  surfaceId: string;
};

export function resolveRearCampusScreenHostBaseId(surfaceId: string): string | null {
  if (surfaceId === 'rear-campus-bowl-feed-surface') {
    return 'rear-campus-bowl-center-deck';
  }

  if (surfaceId.endsWith('-host-surface')) {
    return surfaceId.slice(0, -'-host-surface'.length);
  }

  if (surfaceId.endsWith('-rear-campus-feed-surface')) {
    return surfaceId.slice(0, -'-rear-campus-feed-surface'.length);
  }

  const terminalFeedMatch = surfaceId.match(/^rear-campus-axis-terminal-(left|right)-feed-surface$/);
  if (terminalFeedMatch) {
    return `rear-campus-terminal-${terminalFeedMatch[1]}`;
  }

  if (surfaceId.startsWith('rear-campus-') && surfaceId.endsWith('-feed-surface')) {
    return surfaceId.slice(0, -'-feed-surface'.length);
  }

  return null;
}

export function resolveRearCampusScreenHostId(surfaceId: string): string | null {
  const baseId = resolveRearCampusScreenHostBaseId(surfaceId);
  return baseId ? `${baseId}-screen-host-shell` : null;
}

export function buildRearCampusScreenHostShells(
  surfaces: ReadonlyArray<CityScreenSurface>,
): RearCampusScreenHostShell[] {
  const shells = new Map<string, RearCampusScreenHostShell>();

  for (const surface of surfaces) {
    const hostId = resolveRearCampusScreenHostId(surface.id);
    if (!hostId) {
      continue;
    }

    const yaw = surface.rotation[1] ?? 0;
    const normal = { x: Math.sin(yaw), z: Math.cos(yaw) };
    const screenFrontHalfDepth = surface.size[2] * 0.5;
    const hostDepth = Math.max(18, surface.size[2] * 5.2);
    const faceInset = 6;
    const hostHalfDepth = hostDepth * 0.5;
    const topY = Math.max(42, surface.position[1] + (surface.size[1] * 0.58));
    const shell: RearCampusScreenHostShell = {
      id: hostId,
      position: [
        surface.position[0] + normal.x * (screenFrontHalfDepth - hostHalfDepth - faceInset),
        topY * 0.5,
        surface.position[2] + normal.z * (screenFrontHalfDepth - hostHalfDepth - faceInset),
      ],
      rotation: [0, yaw, 0],
      size: [
        Math.max(surface.size[0] * 1.16, surface.size[0] + 18),
        topY,
        hostDepth,
      ],
      surfaceId: surface.id,
    };

    const previous = shells.get(hostId);
    if (!previous || shell.size[0] * shell.size[1] > previous.size[0] * previous.size[1]) {
      shells.set(hostId, shell);
    }
  }

  return [...shells.values()];
}

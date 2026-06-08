import type { ReactNode } from 'react';
import {
  EXPO_ZONE_GROUP_DEFINITIONS,
  getExpoZoneById,
  type ExpoZoneGroupDefinition,
  type ExpoZoneGroupDetailRole,
  type ExpoZoneId,
  type ExpoZoneVisibilityState,
} from './expoZoneRegistry';
import type { ExpoZoneRuntimeState } from './expoZoneRuntimeState';
import { resolveExpoZoneDetailState } from './expoZoneDetailPolicy';

type ExpoZoneGroupProps = {
  alwaysVisible?: boolean;
  canReduceInLowQuality?: boolean;
  canHideInLowQuality?: boolean;
  children: ReactNode;
  detailRole?: ExpoZoneGroupDetailRole;
  groupId: string;
  name?: string;
  preserveWhenActive?: boolean;
  preserveWhenAdjacent?: boolean;
  runtimeState: ExpoZoneRuntimeState;
  zoneId: ExpoZoneId;
};

function getZoneGroupDefinition(groupId: string): ExpoZoneGroupDefinition | null {
  return EXPO_ZONE_GROUP_DEFINITIONS.find((definition) => definition.id === groupId) ?? null;
}

function resolveGroupVisibilityState({
  alwaysVisible,
  runtimeState,
  zoneId,
}: {
  alwaysVisible?: boolean;
  runtimeState: ExpoZoneRuntimeState;
  zoneId: ExpoZoneId;
}): ExpoZoneVisibilityState {
  if (alwaysVisible || zoneId === 'unknown') {
    return 'alwaysVisible';
  }

  return runtimeState.zoneVisibilityMap[zoneId] ?? 'alwaysVisible';
}

function shouldHideGroup({
  groupId,
  fallbackDefinition,
  runtimeState,
}: {
  groupId: string;
  fallbackDefinition: ExpoZoneGroupDefinition;
  runtimeState: ExpoZoneRuntimeState;
}) {
  return runtimeState.zoneGroupDetails[groupId]?.hidden
    ?? resolveExpoZoneDetailState({
      activeZoneId: runtimeState.activeZoneId,
      adjacentZoneIds: runtimeState.adjacentZoneIds,
      group: fallbackDefinition,
      qualityTier: runtimeState.qualityTier,
      runtimeCaptureSafe: runtimeState.runtimeCaptureSafe,
      visibilityState: runtimeState.zoneVisibilityMap[fallbackDefinition.zoneId] ?? 'alwaysVisible',
      zoneCullEnabled: runtimeState.zoneCullEnabled,
      zoneCullRequested: runtimeState.zoneCullRequested,
    }).hidden;
}

export function ExpoZoneGroup({
  alwaysVisible,
  canReduceInLowQuality,
  canHideInLowQuality,
  children,
  detailRole,
  groupId,
  name,
  preserveWhenActive,
  preserveWhenAdjacent,
  runtimeState,
  zoneId,
}: ExpoZoneGroupProps) {
  const definition = getZoneGroupDefinition(groupId);
  const effectiveAlwaysVisible = alwaysVisible ?? definition?.alwaysVisible ?? false;
  const effectiveCanHide = canHideInLowQuality ?? definition?.canHideInLowQuality ?? false;
  const fallbackDefinition: ExpoZoneGroupDefinition = {
    alwaysVisible: effectiveAlwaysVisible,
    canHideInLowQuality: effectiveCanHide,
    canReduceInLowQuality: canReduceInLowQuality ?? definition?.canReduceInLowQuality ?? false,
    description: definition?.description ?? groupId,
    detailRole: detailRole ?? definition?.detailRole ?? 'unknown',
    id: groupId,
    label: definition?.label ?? groupId,
    preserveWhenActive: preserveWhenActive ?? definition?.preserveWhenActive ?? true,
    preserveWhenAdjacent: preserveWhenAdjacent ?? definition?.preserveWhenAdjacent ?? true,
    zoneId,
  };
  const visibilityState = resolveGroupVisibilityState({
    alwaysVisible: effectiveAlwaysVisible,
    runtimeState,
    zoneId,
  });
  const hidden = shouldHideGroup({
    fallbackDefinition,
    groupId,
    runtimeState,
  });
  const detailState = runtimeState.zoneGroupDetails[groupId] ?? resolveExpoZoneDetailState({
    activeZoneId: runtimeState.activeZoneId,
    adjacentZoneIds: runtimeState.adjacentZoneIds,
    group: fallbackDefinition,
    qualityTier: runtimeState.qualityTier,
    runtimeCaptureSafe: runtimeState.runtimeCaptureSafe,
    visibilityState,
    zoneCullEnabled: runtimeState.zoneCullEnabled,
    zoneCullRequested: runtimeState.zoneCullRequested,
  });
  const zone = getExpoZoneById(zoneId);

  return (
    <group
      name={name ?? `expo-zone-group:${groupId}`}
      visible={!hidden}
      userData={{
        expoZoneCanHideInLowQuality: effectiveCanHide,
        expoZoneCanReduceInLowQuality: detailState.canReduceInLowQuality,
        expoZoneDetailMode: detailState.detailMode,
        expoZoneDetailReason: detailState.reason,
        expoZoneDetailRole: detailState.detailRole,
        expoZoneGroupHidden: hidden,
        expoZoneGroupId: groupId,
        expoZoneGroupReduced: detailState.reduced,
        expoZoneId: zone.id,
        expoZoneLabel: zone.label,
        expoZoneVisibilityState: visibilityState,
      }}
    >
      {children}
    </group>
  );
}

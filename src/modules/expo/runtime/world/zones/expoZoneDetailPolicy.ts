import type { ExpoResolvedQualityTier } from '../quality/expoQualitySettings';
import {
  getExpoZoneById,
  type ExpoZoneGroupDefinition,
  type ExpoZoneGroupDetailRole,
  type ExpoZoneId,
  type ExpoZoneVisibilityState,
} from './expoZoneRegistry';

export type ExpoZoneDetailMode =
  | 'full'
  | 'reduced'
  | 'hiddenCandidate'
  | 'hidden'
  | 'alwaysVisible';

export type ExpoZoneDetailPolicyInput = {
  activeZoneId: ExpoZoneId;
  adjacentZoneIds: ExpoZoneId[];
  group: ExpoZoneGroupDefinition;
  qualityTier: ExpoResolvedQualityTier;
  runtimeCaptureSafe: boolean;
  visibilityState: ExpoZoneVisibilityState;
  zoneCullEnabled: boolean;
  zoneCullRequested: boolean;
};

export type ExpoZoneGroupDetailState = {
  canHideInLowQuality: boolean;
  canReduceInLowQuality: boolean;
  detailMode: ExpoZoneDetailMode;
  detailRole: ExpoZoneGroupDetailRole;
  groupId: string;
  hidden: boolean;
  hiddenCandidate: boolean;
  preserveWhenActive: boolean;
  preserveWhenAdjacent: boolean;
  reason: string;
  reduced: boolean;
  zoneId: ExpoZoneId;
};

const SAFE_LOW_QUALITY_ROLES = new Set<ExpoZoneGroupDetailRole>([
  'legacy',
  'perimeter',
  'support',
]);

const PRESERVED_ROLES = new Set<ExpoZoneGroupDetailRole>([
  'commercial',
  'demo',
  'landmark',
  'major',
  'unknown',
]);

export function resolveExpoZoneCullBlockedReason({
  qualityTier,
  runtimeCaptureSafe,
  zoneCullRequested,
}: {
  qualityTier: ExpoResolvedQualityTier;
  runtimeCaptureSafe: boolean;
  zoneCullRequested: boolean;
}) {
  if (!zoneCullRequested) {
    return 'not-requested';
  }

  if (runtimeCaptureSafe) {
    return 'blocked-runtime-capture-safe';
  }

  if (qualityTier !== 'low') {
    return `blocked-quality-${qualityTier}`;
  }

  return null;
}

function normalizeGroupDefinition(group: ExpoZoneGroupDefinition): Required<Pick<
  ExpoZoneGroupDefinition,
  'canHideInLowQuality' | 'canReduceInLowQuality' | 'detailRole' | 'preserveWhenActive' | 'preserveWhenAdjacent'
>> {
  return {
    canHideInLowQuality: group.canHideInLowQuality ?? false,
    canReduceInLowQuality: group.canReduceInLowQuality ?? false,
    detailRole: group.detailRole ?? 'unknown',
    preserveWhenActive: group.preserveWhenActive ?? true,
    preserveWhenAdjacent: group.preserveWhenAdjacent ?? true,
  };
}

function isActiveOrPreservedAdjacent(input: ExpoZoneDetailPolicyInput, normalized: ReturnType<typeof normalizeGroupDefinition>) {
  if (input.group.zoneId === input.activeZoneId && normalized.preserveWhenActive) {
    return true;
  }

  return normalized.preserveWhenAdjacent && input.adjacentZoneIds.includes(input.group.zoneId);
}

function isSafeLowQualityDetailGroup(input: ExpoZoneDetailPolicyInput, normalized: ReturnType<typeof normalizeGroupDefinition>) {
  if (!SAFE_LOW_QUALITY_ROLES.has(normalized.detailRole)) {
    return false;
  }

  const zone = getExpoZoneById(input.group.zoneId);
  return !zone.isCommercialZone && !zone.isFutureDemoZone && !zone.isLandmarkZone;
}

export function resolveExpoZoneDetailState(input: ExpoZoneDetailPolicyInput): ExpoZoneGroupDetailState {
  const normalized = normalizeGroupDefinition(input.group);
  const zone = getExpoZoneById(input.group.zoneId);
  const isUnknown = zone.id === 'unknown' || normalized.detailRole === 'unknown';
  const base = {
    canHideInLowQuality: normalized.canHideInLowQuality,
    canReduceInLowQuality: normalized.canReduceInLowQuality,
    detailRole: normalized.detailRole,
    groupId: input.group.id,
    preserveWhenActive: normalized.preserveWhenActive,
    preserveWhenAdjacent: normalized.preserveWhenAdjacent,
    zoneId: zone.id,
  };

  if (input.group.alwaysVisible || isUnknown) {
    return {
      ...base,
      detailMode: 'alwaysVisible',
      hidden: false,
      hiddenCandidate: false,
      reason: input.group.alwaysVisible ? 'group marked always visible' : 'unknown groups remain visible',
      reduced: false,
    };
  }

  if (input.qualityTier === 'high') {
    return {
      ...base,
      detailMode: 'full',
      hidden: false,
      hiddenCandidate: false,
      reason: 'high quality keeps all mapped groups full',
      reduced: false,
    };
  }

  if (input.runtimeCaptureSafe) {
    return {
      ...base,
      detailMode: 'full',
      hidden: false,
      hiddenCandidate: false,
      reason: 'runtime capture safe mode keeps deterministic visibility',
      reduced: false,
    };
  }

  if (isActiveOrPreservedAdjacent(input, normalized)) {
    return {
      ...base,
      detailMode: 'full',
      hidden: false,
      hiddenCandidate: false,
      reason: input.group.zoneId === input.activeZoneId
        ? 'active zone group preserved'
        : 'adjacent zone group preserved',
      reduced: false,
    };
  }

  if (PRESERVED_ROLES.has(normalized.detailRole)) {
    return {
      ...base,
      detailMode: 'full',
      hidden: false,
      hiddenCandidate: false,
      reason: `${normalized.detailRole} group preserved`,
      reduced: false,
    };
  }

  const isSafeDetailGroup = isSafeLowQualityDetailGroup(input, normalized);
  const canReduceSafely = normalized.canReduceInLowQuality && isSafeDetailGroup;
  const canHideSafely = normalized.canHideInLowQuality
    && isSafeDetailGroup
    && input.visibilityState === 'hiddenCandidate';

  if (input.qualityTier === 'medium') {
    return {
      ...base,
      detailMode: canReduceSafely ? 'reduced' : 'full',
      hidden: false,
      hiddenCandidate: false,
      reason: canReduceSafely ? 'medium quality marks distant safe detail as reduced' : 'medium quality keeps group full',
      reduced: canReduceSafely,
    };
  }

  if (input.zoneCullEnabled && canHideSafely) {
    return {
      ...base,
      detailMode: 'hidden',
      hidden: true,
      hiddenCandidate: false,
      reason: 'explicit low-quality zoneCull hides safe distant detail group',
      reduced: false,
    };
  }

  if (canHideSafely) {
    return {
      ...base,
      detailMode: 'hiddenCandidate',
      hidden: false,
      hiddenCandidate: true,
      reason: input.zoneCullRequested
        ? 'zoneCull requested but not enabled for this group'
        : 'low quality marks safe distant detail as hidden candidate',
      reduced: false,
    };
  }

  if (canReduceSafely) {
    return {
      ...base,
      detailMode: 'reduced',
      hidden: false,
      hiddenCandidate: false,
      reason: 'low quality marks safe distant detail as reduced',
      reduced: true,
    };
  }

  return {
    ...base,
    detailMode: 'full',
    hidden: false,
    hiddenCandidate: false,
    reason: 'no safe low-quality detail action available',
    reduced: false,
  };
}

export function shouldReduceZoneGroupDetail(state: ExpoZoneGroupDetailState) {
  return state.detailMode === 'reduced';
}

export function shouldHideZoneGroupInLowQuality(state: ExpoZoneGroupDetailState) {
  return state.detailMode === 'hidden';
}

export function getZoneGroupDetailReason(state: ExpoZoneGroupDetailState) {
  return state.reason;
}

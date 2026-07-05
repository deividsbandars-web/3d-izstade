import { useEffect, useMemo, useRef, useState } from 'react';
import type { ExpoQualitySettings } from '../quality/expoQualitySettings';
import {
  EXPO_ZONE_GROUP_DEFINITIONS,
  EXPO_ZONE_REGISTRY,
  getAdjacentExpoZones,
  getExpoZoneById,
  resolveExpoZoneFromPosition,
  resolveExpoZoneFromReviewId,
  resolveExpoZoneVisibilityState,
  shouldEnableExpoZoneCull,
  type ExpoZoneGroupDefinition,
  type ExpoZoneId,
  type ExpoZoneVisibilityState,
} from './expoZoneRegistry';
import {
  resolveExpoZoneCullBlockedReason,
  resolveExpoZoneDetailState,
  type ExpoZoneGroupDetailState,
} from './expoZoneDetailPolicy';

export type ExpoZoneRuntimeState = {
  activeZoneId: ExpoZoneId;
  activeZoneReason: string;
  adjacentZoneIds: ExpoZoneId[];
  actuallyHiddenGroupCount: number;
  allowLowQualityCull: boolean;
  alwaysVisibleGroupCount: number;
  fullGroupCount: number;
  hiddenCandidateGroupIds: string[];
  hiddenCandidateGroupCount: number;
  hiddenGroupIds: string[];
  lastUpdateAt: number;
  operatorZoneId: string | null;
  playerPosition: [number, number, number];
  previousActiveZoneId: ExpoZoneId | null;
  qualityTier: ExpoQualitySettings['resolvedTier'];
  reducedGroupCount: number;
  reducedGroupIds: string[];
  registeredZoneGroupCount: number;
  runtimeCaptureSafe: boolean;
  unknownGroupCount: number;
  visibleZoneGroupCount: number;
  zoneCullBlockedReason: string | null;
  zoneCullEnabled: boolean;
  visibilityPolicyLabel: string;
  zoneDetailPolicyLabel: string;
  zoneCullRequested: boolean;
  zoneGroupDetails: Record<string, ExpoZoneGroupDetailState>;
  zoneVisibilityMap: Record<ExpoZoneId, ExpoZoneVisibilityState>;
};

export type ResolveExpoZoneRuntimeStateInput = {
  externalActiveZoneId?: string | null;
  previousActiveZoneId?: ExpoZoneId | null;
  qualitySettings: ExpoQualitySettings;
  registeredGroups?: ExpoZoneGroupDefinition[];
  runtimeCaptureSafe: boolean;
  playerPosition: [number, number, number];
};

export type UseExpoZoneRuntimeStateInput = Omit<ResolveExpoZoneRuntimeStateInput, 'previousActiveZoneId'>;

type ExpoReviewOperatorSnapshot = {
  operatorZoneId?: string | null;
};

type ExpoReviewOperatorApi = {
  getSnapshot?: () => ExpoReviewOperatorSnapshot | null;
};

type ExpoReviewOperatorWindow = Window & {
  __WARPALA_EXPO_REVIEW_OPERATOR__?: ExpoReviewOperatorApi;
};

function resolveVisibilityPolicyLabel({
  zoneCullEnabled,
  qualitySettings,
  runtimeCaptureSafe,
}: {
  zoneCullEnabled: boolean;
  qualitySettings: ExpoQualitySettings;
  runtimeCaptureSafe: boolean;
}) {
  if (runtimeCaptureSafe) {
    return 'capture-observe-only';
  }

  if (qualitySettings.resolvedTier === 'high') {
    return 'high-observe-only';
  }

  if (qualitySettings.resolvedTier === 'medium') {
    return 'medium-hidden-candidates-only';
  }

  return zoneCullEnabled ? 'low-debug-cull-enabled' : 'low-hidden-candidates-only';
}

function resolveActiveZone(input: ResolveExpoZoneRuntimeStateInput): {
  activeZoneId: ExpoZoneId;
  activeZoneReason: string;
} {
  const externalZone = resolveExpoZoneFromReviewId(input.externalActiveZoneId);
  if (externalZone) {
    return {
      activeZoneId: externalZone,
      activeZoneReason: `external zone ${input.externalActiveZoneId} mapped to ${externalZone}`,
    };
  }

  const positionZone = resolveExpoZoneFromPosition(input.playerPosition);
  return {
    activeZoneId: positionZone,
    activeZoneReason: `player/camera position resolved to ${positionZone}`,
  };
}

function readBrowserOperatorReviewZoneId() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const api = (window as ExpoReviewOperatorWindow).__WARPALA_EXPO_REVIEW_OPERATOR__;
    const zoneId = api?.getSnapshot?.()?.operatorZoneId;
    return typeof zoneId === 'string' && zoneId.trim() ? zoneId : null;
  } catch {
    return null;
  }
}

function resolveEffectiveRuntimeInput(input: UseExpoZoneRuntimeStateInput): UseExpoZoneRuntimeStateInput {
  if (resolveExpoZoneFromReviewId(input.externalActiveZoneId)) {
    return input;
  }

  const operatorReviewZoneId = readBrowserOperatorReviewZoneId();
  return operatorReviewZoneId
    ? { ...input, externalActiveZoneId: operatorReviewZoneId }
    : input;
}

function buildZoneVisibilityMap({
  activeZoneId,
  allowLowQualityCull,
  qualitySettings,
  runtimeCaptureSafe,
}: {
  activeZoneId: ExpoZoneId;
  allowLowQualityCull: boolean;
  qualitySettings: ExpoQualitySettings;
  runtimeCaptureSafe: boolean;
}) {
  return EXPO_ZONE_REGISTRY.reduce<Record<ExpoZoneId, ExpoZoneVisibilityState>>((acc, zone) => {
    acc[zone.id] = resolveExpoZoneVisibilityState(zone.id, {
      activeZoneId,
      allowLowQualityCull,
      qualityTier: qualitySettings.resolvedTier,
      runtimeCaptureSafe,
    });
    return acc;
  }, {} as Record<ExpoZoneId, ExpoZoneVisibilityState>);
}

function shouldHideGroup({
  detailState,
}: {
  detailState: ExpoZoneGroupDetailState;
}) {
  return detailState.hidden;
}

function resolveZoneDetailPolicyLabel({
  qualitySettings,
  runtimeCaptureSafe,
  zoneCullEnabled,
  zoneCullRequested,
}: {
  qualitySettings: ExpoQualitySettings;
  runtimeCaptureSafe: boolean;
  zoneCullEnabled: boolean;
  zoneCullRequested: boolean;
}) {
  if (runtimeCaptureSafe) {
    return 'capture-detail-full';
  }

  if (qualitySettings.resolvedTier === 'high') {
    return 'high-detail-full';
  }

  if (qualitySettings.resolvedTier === 'medium') {
    return 'medium-safe-reduced-only';
  }

  if (zoneCullEnabled) {
    return 'low-safe-cull-enabled';
  }

  return zoneCullRequested ? 'low-safe-cull-blocked' : 'low-safe-candidates-only';
}

export function resolveExpoZoneRuntimeState(input: ResolveExpoZoneRuntimeStateInput): ExpoZoneRuntimeState {
  const registeredGroups = input.registeredGroups ?? EXPO_ZONE_GROUP_DEFINITIONS;
  const zoneCullRequested = shouldEnableExpoZoneCull();
  const zoneCullBlockedReason = resolveExpoZoneCullBlockedReason({
    qualityTier: input.qualitySettings.resolvedTier,
    runtimeCaptureSafe: input.runtimeCaptureSafe,
    zoneCullRequested,
  });
  const zoneCullEnabled = zoneCullRequested && zoneCullBlockedReason === null;
  const allowLowQualityCull = zoneCullEnabled;
  const { activeZoneId, activeZoneReason } = resolveActiveZone(input);
  const zoneVisibilityMap = buildZoneVisibilityMap({
    activeZoneId,
    allowLowQualityCull,
    qualitySettings: input.qualitySettings,
    runtimeCaptureSafe: input.runtimeCaptureSafe,
  });
  const adjacentZoneIds = getAdjacentExpoZones(activeZoneId).map((zone) => zone.id);
  const zoneGroupDetails: Record<string, ExpoZoneGroupDetailState> = {};
  let alwaysVisibleGroupCount = 0;
  let fullGroupCount = 0;
  let hiddenCandidateGroupCount = 0;
  let actuallyHiddenGroupCount = 0;
  let reducedGroupCount = 0;
  let unknownGroupCount = 0;
  const hiddenGroupIds: string[] = [];
  const hiddenCandidateGroupIds: string[] = [];
  const reducedGroupIds: string[] = [];

  registeredGroups.forEach((group) => {
    const groupZone = getExpoZoneById(group.zoneId);
    const visibilityState = group.alwaysVisible ? 'alwaysVisible' : zoneVisibilityMap[groupZone.id];
    const detailState = resolveExpoZoneDetailState({
      activeZoneId,
      adjacentZoneIds,
      group,
      qualityTier: input.qualitySettings.resolvedTier,
      runtimeCaptureSafe: input.runtimeCaptureSafe,
      visibilityState,
      zoneCullEnabled,
      zoneCullRequested,
    });
    zoneGroupDetails[group.id] = detailState;

    if (detailState.detailMode === 'alwaysVisible') {
      alwaysVisibleGroupCount += 1;
    }
    if (detailState.detailMode === 'full') {
      fullGroupCount += 1;
    }
    if (detailState.hiddenCandidate) {
      hiddenCandidateGroupCount += 1;
      hiddenCandidateGroupIds.push(group.id);
    }
    if (shouldHideGroup({
      detailState,
    })) {
      actuallyHiddenGroupCount += 1;
      hiddenGroupIds.push(group.id);
    }
    if (detailState.reduced) {
      reducedGroupCount += 1;
      reducedGroupIds.push(group.id);
    }
    if (groupZone.id === 'unknown') {
      unknownGroupCount += 1;
    }
  });

  return {
    activeZoneId,
    activeZoneReason,
    adjacentZoneIds,
    actuallyHiddenGroupCount,
    allowLowQualityCull,
    alwaysVisibleGroupCount,
    fullGroupCount,
    hiddenCandidateGroupIds,
    hiddenCandidateGroupCount,
    hiddenGroupIds,
    lastUpdateAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    operatorZoneId: input.externalActiveZoneId ?? null,
    playerPosition: input.playerPosition,
    previousActiveZoneId: input.previousActiveZoneId ?? null,
    qualityTier: input.qualitySettings.resolvedTier,
    reducedGroupCount,
    reducedGroupIds,
    registeredZoneGroupCount: registeredGroups.length,
    runtimeCaptureSafe: input.runtimeCaptureSafe,
    unknownGroupCount,
    visibilityPolicyLabel: resolveVisibilityPolicyLabel({
      zoneCullEnabled,
      qualitySettings: input.qualitySettings,
      runtimeCaptureSafe: input.runtimeCaptureSafe,
    }),
    visibleZoneGroupCount: registeredGroups.length - actuallyHiddenGroupCount,
    zoneCullBlockedReason,
    zoneCullEnabled,
    zoneCullRequested,
    zoneDetailPolicyLabel: resolveZoneDetailPolicyLabel({
      qualitySettings: input.qualitySettings,
      runtimeCaptureSafe: input.runtimeCaptureSafe,
      zoneCullEnabled,
      zoneCullRequested,
    }),
    zoneGroupDetails,
    zoneVisibilityMap,
  };
}

const buildZoneRuntimeMapSignature = <T extends string>(record: Record<string, T>) => (
  Object.entries(record)
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([id, value]) => `${id}:${value}`)
);

const buildZoneRuntimeDetailSignature = (record: Record<string, ExpoZoneGroupDetailState>) => (
  Object.entries(record)
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .map(([id, detail]) => [
      id,
      detail.detailMode,
      detail.hidden,
      detail.hiddenCandidate,
      detail.reduced,
    ].join(':'))
);

export function buildExpoZoneRuntimeStateSignature(state: ExpoZoneRuntimeState) {
  return JSON.stringify({
    activeZoneId: state.activeZoneId,
    adjacentZoneIds: state.adjacentZoneIds,
    allowLowQualityCull: state.allowLowQualityCull,
    alwaysVisibleGroupCount: state.alwaysVisibleGroupCount,
    fullGroupCount: state.fullGroupCount,
    hiddenCandidateGroupIds: state.hiddenCandidateGroupIds,
    hiddenGroupIds: state.hiddenGroupIds,
    operatorZoneId: state.operatorZoneId,
    previousActiveZoneId: state.previousActiveZoneId,
    qualityTier: state.qualityTier,
    reducedGroupIds: state.reducedGroupIds,
    registeredZoneGroupCount: state.registeredZoneGroupCount,
    runtimeCaptureSafe: state.runtimeCaptureSafe,
    visibilityPolicyLabel: state.visibilityPolicyLabel,
    visibleZoneGroupCount: state.visibleZoneGroupCount,
    zoneCullBlockedReason: state.zoneCullBlockedReason,
    zoneCullEnabled: state.zoneCullEnabled,
    zoneCullRequested: state.zoneCullRequested,
    zoneDetailPolicyLabel: state.zoneDetailPolicyLabel,
    zoneGroupDetails: buildZoneRuntimeDetailSignature(state.zoneGroupDetails),
    zoneVisibilityMap: buildZoneRuntimeMapSignature(state.zoneVisibilityMap),
  });
}

export function resolveStableExpoZoneRuntimeState(
  current: ExpoZoneRuntimeState,
  next: ExpoZoneRuntimeState,
) {
  return buildExpoZoneRuntimeStateSignature(current) === buildExpoZoneRuntimeStateSignature(next)
    ? current
    : next;
}

export function useExpoZoneRuntimeState(input: UseExpoZoneRuntimeStateInput): ExpoZoneRuntimeState {
  const latestInputRef = useRef(input);
  latestInputRef.current = input;

  const initialState = useMemo(
    () => resolveExpoZoneRuntimeState({
      ...resolveEffectiveRuntimeInput(input),
      previousActiveZoneId: null,
    }),
    // Initial state only; interval below owns low-frequency runtime updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [state, setState] = useState<ExpoZoneRuntimeState>(initialState);
  const stateRef = useRef(initialState);

  useEffect(() => {
    const update = () => {
      const current = stateRef.current;
      const effectiveInput = resolveEffectiveRuntimeInput(latestInputRef.current);
      const nextActiveZoneId = nextActiveZoneProbe(effectiveInput);
      const next = resolveExpoZoneRuntimeState({
        ...effectiveInput,
        previousActiveZoneId: current.activeZoneId === nextActiveZoneId
          ? current.previousActiveZoneId
          : current.activeZoneId,
      });
      const stable = resolveStableExpoZoneRuntimeState(current, next);
      if (stable !== current) {
        stateRef.current = stable;
        setState(stable);
      }
    };

    const timer = window.setInterval(update, 400);
    return () => window.clearInterval(timer);
  }, []);

  return state;
}

function nextActiveZoneProbe(input: UseExpoZoneRuntimeStateInput) {
  return resolveActiveZone({
    ...input,
    previousActiveZoneId: null,
  }).activeZoneId;
}

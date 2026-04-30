import { useMemo } from 'react';
import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoStartView, ExpoWorldContract } from '../../../world-contract';
import { buildCanonicalWorldPlanFromWorldContract } from '../../planning';
import { useInspectionFocus, useInspectionOperatorSummary, useInspectionTargets, useWorldInspection } from '../../world/inspection/worldInspectionState';
import { buildWorldDiagnosticReportFromPlan } from '../../world/inspection/worldDiagnosticReport';
import { buildBoothWorldObjectRegistry } from '../../world/inspection/worldObjectRegistry';
import { ExpoOperatorOverlay } from '../overlay/ExpoOperatorOverlay';
import {
  buildReviewOperatorZones,
  resolveExpoOperatorSession,
  resolveReviewOperatorZoneStartView,
} from '../model/reviewOperatorSession';
import { useExpoOperatorState } from './useExpoOperatorState';

const LOCAL_BUILD_STAMP = `LOCAL-${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;

export function useExpoOperatorLayer({
  activeZoneId,
  initialUrlFocus,
  mode,
  playerPos,
  sceneVersion,
  setMode,
  worldContract,
}: {
  activeZoneId: string | null;
  initialUrlFocus: string | null;
  mode: ExpoMode;
  playerPos: number[];
  sceneVersion: string | null;
  setMode: (mode: ExpoMode) => void;
  worldContract: ExpoWorldContract;
}) {
  const session = useMemo(() => resolveExpoOperatorSession(), []);
  const reviewZones = useMemo(() => buildReviewOperatorZones(), []);
  const focus = useInspectionFocus();
  const targets = useInspectionTargets();
  const inspectionState = useWorldInspection();
  const inspector = useInspectionOperatorSummary({
    boothPlacements: worldContract.boothPlacements,
    playerPos,
  });
  const boothRegistryEntries = useMemo(
    () => buildBoothWorldObjectRegistry(worldContract.boothPlacements),
    [worldContract.boothPlacements],
  );
  const registryById = useMemo(() => {
    const entries = [
      ...inspectionState.rawSources.city,
      ...inspectionState.rawSources.stadium,
      ...boothRegistryEntries,
    ];

    return new Map(entries.map((entry) => [entry.id, entry]));
  }, [boothRegistryEntries, inspectionState.rawSources.city, inspectionState.rawSources.stadium]);
  const resolvedReviewZones = useMemo(
    () => reviewZones.map((zone) => ({
      ...zone,
      startView: resolveReviewOperatorZoneStartView(zone, registryById),
    })),
    [registryById, reviewZones],
  );
  const canonicalWorldPlan = useMemo(
    () => buildCanonicalWorldPlanFromWorldContract(worldContract),
    [worldContract],
  );
  const diagnosticReport = useMemo(
    () => buildWorldDiagnosticReportFromPlan({
      boothPlacements: worldContract.boothPlacements.map((placement) => ({
        id: placement.id,
        localFootprint: placement.localFootprint,
        nodeType: placement.nodeType,
        rotation: placement.rotation,
      })),
      plan: canonicalWorldPlan,
    }),
    [canonicalWorldPlan, worldContract.boothPlacements],
  );
  const dataMode = 'seeded-local';

  const operator = useExpoOperatorState({
    activeZoneId,
    centerStack: targets.centerStack,
    centerTarget: targets.centerTarget,
    clickStack: targets.clickStack,
    clickTarget: targets.clickTarget,
    dataMode,
    enabled: session.enabled,
    inspector,
    mode,
    playerPos,
    diagnosticReport,
    registryEntries: {
      booths: boothRegistryEntries,
      city: inspectionState.rawSources.city,
      stadium: inspectionState.rawSources.stadium,
    },
    sceneVersion,
    setMode,
    zones: resolvedReviewZones,
  });

  const effectiveFocusSlug = operator.focusSlug === '__use_url__' ? initialUrlFocus : operator.focusSlug;

  const operatorStartView = useMemo(() => {
    if (!session.enabled || !operator.operatorZoneId) {
      return null;
    }

    return resolvedReviewZones.find((zone) => zone.id === operator.operatorZoneId)?.startView ?? null;
  }, [operator.operatorZoneId, resolvedReviewZones, session.enabled]);

  const focusStartView = useMemo<ExpoStartView | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const focus = effectiveFocusSlug;
    if (!focus) {
      return null;
    }

    const normalizedFocus = focus.trim().toLowerCase();
    const placement = worldContract.boothPlacements.find((entry) => {
      const companySlug = String(entry.company?.slug || '').toLowerCase();
      const companyId = String(entry.company?.id || '').toLowerCase();
      const boothSlug = String((entry.company?.booth as { slug?: string | null } | null)?.slug || '').toLowerCase();
      return companySlug === normalizedFocus || companyId === normalizedFocus || boothSlug === normalizedFocus;
    });

    if (!placement) {
      return null;
    }

    const yaw = placement.rotation?.[1] ?? 0;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    return {
      lookAt: [placement.position[0], 3.4, placement.position[2]],
      position: [
        placement.position[0] - (forwardX * 34),
        5,
        placement.position[2] - (forwardZ * 34),
      ],
      source: 'arrival-main',
    };
  }, [effectiveFocusSlug, worldContract.boothPlacements]);

  const effectiveStartViewOverride = operatorStartView ?? focusStartView;

  const verificationTargets = useMemo(() => {
    const hero = worldContract.boothPlacements.find((entry) => String(entry.company?.sponsorTier || '').toLowerCase() === 'hero');
    const elite = worldContract.boothPlacements.find((entry) => String(entry.company?.sponsorTier || '').toLowerCase() === 'platinum');
    const premium = worldContract.boothPlacements.find((entry) => {
      const tier = String(entry.company?.sponsorTier || '').toLowerCase();
      return tier === 'gold' || tier === 'premium';
    });
    return { elite, hero, premium };
  }, [worldContract.boothPlacements]);

  const focusedPlacement = useMemo(() => {
    if (!effectiveFocusSlug) {
      return null;
    }

    const normalizedFocus = effectiveFocusSlug.trim().toLowerCase();
    return worldContract.boothPlacements.find((entry) => {
      const companySlug = String(entry.company?.slug || '').toLowerCase();
      const companyId = String(entry.company?.id || '').toLowerCase();
      const boothSlug = String((entry.company?.booth as { slug?: string | null } | null)?.slug || '').toLowerCase();
      return companySlug === normalizedFocus || companyId === normalizedFocus || boothSlug === normalizedFocus;
    }) ?? null;
  }, [effectiveFocusSlug, worldContract.boothPlacements]);

  const layer = (
    <ExpoOperatorOverlay
      activeZoneId={activeZoneId}
      buildStamp={LOCAL_BUILD_STAMP}
      centerStack={focus.center.stack}
      centerTargetEntry={focus.center.target ? registryById.get(focus.center.target) ?? null : null}
      centerTarget={focus.center.target}
      clickStack={focus.click.stack}
      clickTargetEntry={focus.click.target ? registryById.get(focus.click.target) ?? null : null}
      clickTarget={focus.click.target}
      companyCount={worldContract.boothPlacements.length}
      dataMode={dataMode}
      debug={operator.debug}
      focusedName={focusedPlacement?.company?.name ?? null}
      focusedSlug={focusedPlacement?.company?.slug ?? effectiveFocusSlug ?? null}
      focusedTier={focusedPlacement?.company?.sponsorTier ?? null}
      inspector={inspector}
      layerStates={operator.layerStates}
      markedPoint={operator.markedPoint}
      mode={mode}
      onAddClickStack={() => {
        if (!operator.clickStack || operator.clickStack.length === 0) {
          return;
        }
        operator.setTargetBasket((current) => {
          const next = [...current];
          operator.clickStack.forEach((entry) => {
            if (!next.includes(entry)) {
              next.push(entry);
            }
          });
          return next;
        });
      }}
      onAddClickTarget={() => {
        if (!operator.clickTarget) {
          return;
        }
        operator.setTargetBasket((current) => (current.includes(operator.clickTarget!) ? current : [...current, operator.clickTarget!]));
      }}
      onClearFocus={() => {
        operator.setOperatorZoneId(null);
        operator.setFocusSlug('');
      }}
      onClearTargetBasket={() => operator.setTargetBasket([])}
      onFocusElite={verificationTargets.elite ? () => {
        operator.setOperatorZoneId(null);
        operator.setFocusSlug(String(verificationTargets.elite?.company?.slug || verificationTargets.elite?.company?.id || ''));
      } : undefined}
      onFocusHero={verificationTargets.hero ? () => {
        operator.setOperatorZoneId(null);
        operator.setFocusSlug(String(verificationTargets.hero?.company?.slug || verificationTargets.hero?.company?.id || ''));
      } : undefined}
      onFocusPremium={verificationTargets.premium ? () => {
        operator.setOperatorZoneId(null);
        operator.setFocusSlug(String(verificationTargets.premium?.company?.slug || verificationTargets.premium?.company?.id || ''));
      } : undefined}
      onSelectZone={(zoneId) => {
        operator.setFocusSlug('');
        operator.setOperatorZoneId(zoneId);
      }}
      onSetMark={() => {
        const [x, y, z] = playerPos as [number, number, number];
        operator.setMarkedPoint([x, y, z]);
      }}
      onToggleDebug={() => operator.setDebug((value) => !value)}
      onToggleLayer={(layerName) => operator.setLayerStates((value) => ({ ...value, [layerName]: !value[layerName] }))}
      onToggleSection={(section) => {
        operator.setSectionStates((value) => ({ ...value, [section]: !value[section] }));
        if (section === 'stadium') {
          operator.setLayerStates((value) => ({ ...value, stadium: !value.stadium }));
        }
      }}
      operatorZoneId={operator.operatorZoneId}
      operatorZoneLabel={operator.operatorZone?.label ?? null}
      operatorZoneFixRoutes={operator.operatorZoneFixRoutes}
      operatorZoneValidation={operator.operatorZoneValidation}
      sceneVersion={sceneVersion}
      sectionStates={operator.sectionStates}
      session={session}
      targetBasket={operator.targetBasket}
      zones={resolvedReviewZones}
    />
  );

  return {
    debug: operator.debug,
    effectiveStartViewOverride,
    layer,
    runtimeFocusIsolation: session.enabled && Boolean(operator.operatorZoneId),
    runtimeHighlightedTargets: session.enabled
      ? Array.from(new Set([
        ...(operator.operatorZone?.expectedKeyObjectIds ?? []),
        ...operator.targetBasket,
      ]))
      : [],
    runtimeLayerToggles: session.enabled ? operator.layerStates : undefined,
    runtimeSectionToggles: session.enabled ? operator.sectionStates : undefined,
    session,
  };
}

import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import type { SponsorCta } from '../../lib/sponsorBoothPresentation';
import { EXPO_FEATURE_FLAGS } from '../../state/expoRuntime';
import type { ExpoBoothPlacement } from '../../layout-engine';
import { usePlayerColliderRegistration } from '../world';
import {
  bindBoothPresentation,
  buildBoothTierState,
  BoothVisualAssembly,
  handleBoothAction,
  openShowcaseRoom,
  trackBoothSelection,
} from './index';

export function DistrictBooth({
  districtVisual,
  placement,
  playerPosition,
}: {
  districtVisual: {
    districtGlow: string;
    expressionMode: string;
    groundAccent: string;
    shellAccent: string;
  };
  placement: ExpoBoothPlacement;
  playerPosition: [number, number, number];
}) {
  const nav = useNavigate();
  const company = placement.company;
  const { booth, presentation } = useMemo(
    () => bindBoothPresentation(company, placement),
    [company, placement]
  );
  const boothColliderRef = useRef<THREE.Group>(null);
  usePlayerColliderRegistration(boothColliderRef, `district-booth-${String(company?.id || company?.name || 'unknown')}`);

  const tierState = buildBoothTierState({
    booth,
    companySponsorTier: company?.sponsorTier,
    districtVisual,
    nodeType: placement.nodeType,
    playerPosition,
    position: placement.position,
    presentation,
    skylineDensityEnabled: EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity,
  });
  const boothId = String(booth?.id ?? placement.id);
  const openRoom = () => openShowcaseRoom({
    analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
    boothId,
    company,
    navigate: nav,
    presentation,
    sectorName: placement.sectorName,
  });

  const onAction = (action: SponsorCta) => {
    handleBoothAction({
      action,
      analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
      boothId,
      company,
      navigate: nav,
      presentation,
      sectorName: placement.sectorName,
    });
  };

  return (
    <group
      name={`booth:${placement.id}`}
      position={placement.position}
      rotation={placement.rotation}
      onClick={(event) => {
        event.stopPropagation();
        trackBoothSelection({
          analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
          boothId,
          company,
          nodeType: placement.nodeType,
          presentation,
          sectorName: placement.sectorName,
        });
        openRoom();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <BoothVisualAssembly
        accentColor={placement.color}
        boothColliderRef={boothColliderRef}
        fallbackMonogram={presentation.fallbackIdentity.monogram}
        onAction={onAction}
        presentation={presentation}
        tierState={{ ...tierState, districtVisual }}
      />
    </group>
  );
}

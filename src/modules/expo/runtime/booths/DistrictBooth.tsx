import { Html } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';
import type { SponsorCta } from '../../lib/sponsorBoothPresentation';
import { EXPO_FEATURE_FLAGS } from '../../state/expoRuntime';
import type { ExpoBoothPlacement } from '../../layout-engine';
import { getBoothProductPreviewCardForBooth } from '../boothProduct';
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
  const [isBoothHovered, setIsBoothHovered] = useState(false);
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
  const boothActionMetrics = useMemo(
    () => getBoothArchitectureMetrics(presentation.template),
    [presentation.template]
  );
  const boothActionOffsetX = (boothActionMetrics.footprintSize[0] * 0.5) + 1.15;
  const boothActionPosition: [number, number, number] = [
    boothActionOffsetX,
    Math.max(2.45, boothActionMetrics.ctaPosition[1] + 1.05),
    Math.max(boothActionMetrics.ctaPosition[2] - 0.9, 2.8),
  ];
  const playerDistanceToBooth = Math.hypot(
    playerPosition[0] - placement.position[0],
    playerPosition[2] - placement.position[2]
  );
  const boothActionRevealDistance = Math.max(...boothActionMetrics.footprintSize) * 1.35;
  const showBoothAction = isBoothHovered || playerDistanceToBooth <= boothActionRevealDistance;
  const boothProductPreviewCard = getBoothProductPreviewCardForBooth({
    boothId,
    companyId: company?.id,
    placementId: placement.id,
    runtimeBoothId: booth?.id,
  });
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
  const selectBoothAndOpenRoom = () => {
    trackBoothSelection({
      analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
      boothId,
      company,
      nodeType: placement.nodeType,
      presentation,
      sectorName: placement.sectorName,
    });
    openRoom();
  };

  return (
    <group
      name={`booth:${placement.id}`}
      position={placement.position}
      rotation={placement.rotation}
      onClick={(event) => {
        event.stopPropagation();
        selectBoothAndOpenRoom();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
        setIsBoothHovered(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        setIsBoothHovered(false);
      }}
    >
      {showBoothAction && (
        <Html
          center
          distanceFactor={18}
          position={boothActionPosition}
          style={{ pointerEvents: 'auto' }}
          zIndexRange={[70, 20]}
        >
          <button
            type="button"
            aria-label={`Open ${company?.name ?? 'sponsor'} booth`}
            onClick={(event) => {
              event.stopPropagation();
              selectBoothAndOpenRoom();
            }}
            style={{
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(10, 22, 32, 0.94), rgba(26, 55, 74, 0.9))',
              border: `1px solid ${placement.color}`,
              borderRadius: '999px',
              boxShadow: `0 0 18px ${placement.color}55, 0 10px 24px rgba(0, 0, 0, 0.28)`,
              color: '#f4fbff',
              cursor: 'pointer',
              display: 'inline-flex',
              flexDirection: 'column',
              fontFamily: 'inherit',
              fontSize: '11px',
              fontWeight: 800,
              gap: '2px',
              letterSpacing: '0.12em',
              lineHeight: 1,
              minWidth: '112px',
              padding: '9px 14px 8px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Open booth
            <span
              style={{
                color: '#bfeeff',
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                opacity: 0.82,
              }}
            >
              click / enter
            </span>
          </button>
        </Html>
      )}
      <BoothVisualAssembly
        accentColor={placement.color}
        boothColliderRef={boothColliderRef}
        boothProductPreviewCard={boothProductPreviewCard}
        districtThemeId={placement.districtThemeId}
        fallbackMonogram={presentation.fallbackIdentity.monogram}
        onAction={onAction}
        presentation={presentation}
        tierState={{ ...tierState, districtVisual }}
      />
    </group>
  );
}

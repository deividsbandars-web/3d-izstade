import { Text } from '@react-three/drei';
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
  const boothActionPosition: [number, number, number] = [
    0,
    Math.max(2.15, boothActionMetrics.ctaPosition[1] + 0.72),
    Math.max(boothActionMetrics.ctaPosition[2] + 0.58, 3.2),
  ];
  const playerDistanceToBooth = Math.hypot(
    playerPosition[0] - placement.position[0],
    playerPosition[2] - placement.position[2]
  );
  const boothActionRevealDistance = Math.max(720, Math.max(...boothActionMetrics.footprintSize) * 1.35);
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
        <group name="booth-open-affordance" position={boothActionPosition}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.7, 0.74, 0.18]} />
            <meshStandardMaterial color="#0b1624" emissive={placement.color} emissiveIntensity={0.08} metalness={0.08} roughness={0.42} />
          </mesh>
          <mesh position={[0, 0, 0.105]}>
            <boxGeometry args={[4.2, 0.08, 0.04]} />
            <meshBasicMaterial color={placement.color} toneMapped={false} />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#f4fbff"
            fontSize={0.26}
            fontWeight={800}
            letterSpacing={0.08}
            position={[0, 0.12, 0.16]}
          >
            OPEN BOOTH
          </Text>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#bfeeff"
            fontSize={0.13}
            fontWeight={700}
            letterSpacing={0.12}
            position={[0, -0.18, 0.17]}
          >
            CLICK / ENTER
          </Text>
        </group>
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

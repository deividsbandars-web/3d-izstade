import { Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';
import { buildExpoBoothWeb3DRoomRoute } from '../../lib/expoBoothRoutes';
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
  const web3dRoomPresentation = useMemo(
    () => ({
      demoRoomPath: buildExpoBoothWeb3DRoomRoute(presentation.demoRoomPath),
      template: presentation.template,
    }),
    [presentation.demoRoomPath, presentation.template]
  );
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
    presentation: web3dRoomPresentation,
    sectorName: placement.sectorName,
  });

  const onAction = (action: SponsorCta) => {
    handleBoothAction({
      action,
      analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
      boothId,
      company,
      navigate: nav,
      presentation: action.kind === 'demo_room' ? web3dRoomPresentation : presentation,
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
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <group name="booth-open-affordance" position={boothActionPosition}>
        <mesh castShadow receiveShadow onClick={(event) => { event.stopPropagation(); selectBoothAndOpenRoom(); }}>
          <boxGeometry args={[7.4, 1.18, 0.22]} />
          <meshStandardMaterial color="#0b1624" emissive={placement.color} emissiveIntensity={0.08} metalness={0.08} roughness={0.42} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <boxGeometry args={[6.65, 0.1, 0.05]} />
          <meshBasicMaterial color={placement.color} toneMapped={false} />
        </mesh>
        <Text
          anchorX="center"
          anchorY="middle"
          color="#f4fbff"
          fontSize={0.34}
          fontWeight={800}
          letterSpacing={0.08}
          position={[0, 0.22, 0.18]}
        >
          OPEN BOOTH
        </Text>
        <Text
          anchorX="center"
          anchorY="middle"
          color="#bfeeff"
          fontSize={0.16}
          fontWeight={700}
          letterSpacing={0.12}
          position={[0, -0.2, 0.19]}
        >
          PRESS E / USE HUD BUTTON
        </Text>
      </group>
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

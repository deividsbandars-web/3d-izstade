import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';
import { buildExpoBoothWeb3DRoomRoute } from '../../lib/expoBoothRoutes';
import { EXPO_FEATURE_FLAGS } from '../../state/expoRuntime';
import type { ExpoBoothPlacement } from '../../layout-engine';
import { getBoothProductPreviewCardForBooth } from '../boothProduct';
import { usePlayerColliderRegistration } from '../world';
import {
  bindBoothPresentation,
  buildBoothTierState,
  BoothVisualAssembly,
  openShowcaseRoom,
  trackBoothSelection,
} from './index';

function BoothEntryKiosk({
  accentColor,
  label,
  onEnter,
  position,
}: {
  accentColor: string;
  label: string;
  onEnter: () => void;
  position: [number, number, number];
}) {
  const safeLabel = label.trim() || 'Open Booth';

  return (
    <group
      name="booth-entry-kiosk"
      position={position}
      userData={{
        expoBoothEntryKiosk: true,
        expoInteractionOwner: 'DistrictBooth',
      }}
    >
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 0.48, 1.06]} />
        <meshStandardMaterial color="#142233" emissive={accentColor} emissiveIntensity={0.04} metalness={0.12} roughness={0.46} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.78, 0.78, 0.34]} />
        <meshStandardMaterial color="#e8f6ff" emissive={accentColor} emissiveIntensity={0.08} metalness={0.08} roughness={0.24} />
      </mesh>
      <mesh
        position={[0, 0.62, 0.2]}
        onClick={(event) => {
          event.stopPropagation();
          onEnter();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[0.62, 0.48, 0.08]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.22} metalness={0.06} roughness={0.26} />
      </mesh>
      <Text position={[0, 0.73, 0.252]} fontSize={0.13} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={0.52}>
        ENTER
      </Text>
      <Text position={[0, 0.5, 0.252]} fontSize={0.075} color="#dbeafe" anchorX="center" anchorY="middle" maxWidth={0.54}>
        BOOTH
      </Text>
      <Text position={[0, 1.12, 0.02]} fontSize={0.11} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={1.4}>
        {safeLabel}
      </Text>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[0.72, 0.82, 0.08, 24]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.1} metalness={0.08} roughness={0.38} />
      </mesh>
    </group>
  );
}

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
  const boothInteractionMetrics = useMemo(
    () => getBoothArchitectureMetrics(presentation.template),
    [presentation.template]
  );
  const boothInteractionHitSize: [number, number, number] = [
    Math.max(boothInteractionMetrics.colliderSize[0], boothInteractionMetrics.footprintSize[0]),
    Math.max(4.2, boothInteractionMetrics.colliderSize[1] * 0.78),
    Math.max(boothInteractionMetrics.colliderSize[2], boothInteractionMetrics.footprintSize[1]),
  ];
  const boothInteractionHitPosition: [number, number, number] = [
    0,
    boothInteractionHitSize[1] * 0.5,
    0,
  ];
  const entryKioskPosition: [number, number, number] = [
    -Math.max(2.8, boothInteractionMetrics.footprintSize[0] * 0.38),
    0,
    Math.max(4.2, boothInteractionMetrics.footprintSize[1] * 0.5 + 1.35),
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
      <mesh
        name="booth-interaction-hit-area"
        position={boothInteractionHitPosition}
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
        <boxGeometry args={boothInteractionHitSize} />
        <meshBasicMaterial depthWrite={false} opacity={0} transparent />
      </mesh>
      <BoothVisualAssembly
        accentColor={placement.color}
        boothColliderRef={boothColliderRef}
        boothProductPreviewCard={boothProductPreviewCard}
        districtThemeId={placement.districtThemeId}
        fallbackMonogram={presentation.fallbackIdentity.monogram}
        presentation={presentation}
        tierState={{ ...tierState, districtVisual }}
      />
      <BoothEntryKiosk
        accentColor={districtVisual.shellAccent || placement.color}
        label={presentation.displayName}
        onEnter={selectBoothAndOpenRoom}
        position={entryKioskPosition}
      />
    </group>
  );
}

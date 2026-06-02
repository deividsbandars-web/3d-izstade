import { useCallback, useEffect, useMemo, useRef } from 'react';
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

const BOOTH_ENTRY_PORTAL_TRIGGER_RADIUS = 1.45;

function BoothEntryPortal({
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
  const lastEnterRequestRef = useRef(0);
  const requestEnter = () => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastEnterRequestRef.current < 500) {
      return;
    }

    lastEnterRequestRef.current = now;
    onEnter();
  };

  const handleEnterPointer = (event: { preventDefault?: () => void; stopPropagation: () => void }) => {
    event.preventDefault?.();
    event.stopPropagation();
    requestEnter();
  };

  return (
    <group
      name="booth-entry-portal"
      position={position}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onPointerDown={handleEnterPointer}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
      userData={{
        expoBoothEntryPortal: true,
        expoInteractionOwner: 'DistrictBooth',
      }}
    >
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[1.18, 1.34, 0.08, 40]} />
        <meshStandardMaterial color="#0f1b2c" emissive={accentColor} emissiveIntensity={0.1} metalness={0.1} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.092, 0]} receiveShadow>
        <cylinderGeometry args={[0.88, 0.94, 0.035, 40]} />
        <meshBasicMaterial color={accentColor} opacity={0.32} transparent toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`portal-post-${side}`} position={[side * 0.72, 1.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 2.1, 0.18]} />
          <meshStandardMaterial color="#142233" emissive={accentColor} emissiveIntensity={0.12} metalness={0.16} roughness={0.32} />
        </mesh>
      ))}
      <mesh position={[0, 2.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.62, 0.18, 0.18]} />
        <meshStandardMaterial color="#142233" emissive={accentColor} emissiveIntensity={0.14} metalness={0.18} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.18, 0.025]}>
        <torusGeometry args={[0.8, 0.032, 12, 56]} />
        <meshBasicMaterial color={accentColor} toneMapped={false} />
      </mesh>
      <mesh
        name="booth-entry-portal-trigger"
        position={[0, 1.08, 0]}
        onPointerDown={handleEnterPointer}
        userData={{
          expoBoothEntryPortalTrigger: true,
          expoInteractionOwner: 'DistrictBooth',
        }}
      >
        <boxGeometry args={[2.08, 2.36, 1.54]} />
        <meshBasicMaterial depthWrite={false} opacity={0} transparent />
      </mesh>
      <Text position={[0, 1.34, 0.14]} fontSize={0.16} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={0.9}>
        ENTER
      </Text>
      <Text position={[0, 1.04, 0.14]} fontSize={0.1} color="#dbeafe" anchorX="center" anchorY="middle" maxWidth={0.9}>
        BOOTH ROOM
      </Text>
      <Text position={[0, 2.48, 0.04]} fontSize={0.105} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={1.7}>
        {safeLabel}
      </Text>
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
  const lastRoomOpenRequestRef = useRef(0);
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
  const entryPortalArmedRef = useRef(true);
  const entryPortalPosition = useMemo<[number, number, number]>(() => [
    -Math.max(3.2, boothInteractionMetrics.footprintSize[0] * 0.42),
    0,
    Math.max(4.8, boothInteractionMetrics.footprintSize[1] * 0.5 + 1.7),
  ], [boothInteractionMetrics.footprintSize]);
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
  const openRoom = useCallback(() => openShowcaseRoom({
    analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
    boothId,
    company,
    navigate: nav,
    presentation: web3dRoomPresentation,
    sectorName: placement.sectorName,
  }), [boothId, company, nav, placement.sectorName, web3dRoomPresentation]);

  const selectBoothAndOpenRoom = useCallback(() => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastRoomOpenRequestRef.current < 500) {
      return;
    }

    lastRoomOpenRequestRef.current = now;
    trackBoothSelection({
      analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
      boothId,
      company,
      nodeType: placement.nodeType,
      presentation,
      sectorName: placement.sectorName,
    });
    openRoom();
  }, [boothId, company, openRoom, placement.nodeType, placement.sectorName, presentation]);

  const entryPortalDistance = useMemo(() => {
    const boothYaw = placement.rotation?.[1] ?? 0;
    const deltaX = playerPosition[0] - placement.position[0];
    const deltaZ = playerPosition[2] - placement.position[2];
    const cos = Math.cos(-boothYaw);
    const sin = Math.sin(-boothYaw);
    const localX = deltaX * cos - deltaZ * sin;
    const localZ = deltaX * sin + deltaZ * cos;

    return Math.hypot(localX - entryPortalPosition[0], localZ - entryPortalPosition[2]);
  }, [entryPortalPosition, placement.position, placement.rotation, playerPosition]);

  useEffect(() => {
    if (entryPortalDistance > BOOTH_ENTRY_PORTAL_TRIGGER_RADIUS) {
      entryPortalArmedRef.current = true;
      return;
    }

    if (!entryPortalArmedRef.current) {
      return;
    }

    entryPortalArmedRef.current = false;
    selectBoothAndOpenRoom();
  }, [entryPortalDistance, selectBoothAndOpenRoom]);

  return (
    <group
      name={`booth:${placement.id}`}
      position={placement.position}
      rotation={placement.rotation}
      onPointerDown={(event) => {
        event.stopPropagation();
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
        boothProductPreviewCard={boothProductPreviewCard}
        districtThemeId={placement.districtThemeId}
        fallbackMonogram={presentation.fallbackIdentity.monogram}
        presentation={presentation}
        tierState={{ ...tierState, districtVisual }}
      />
      <BoothEntryPortal
        accentColor={districtVisual.shellAccent || placement.color}
        label={presentation.displayName}
        onEnter={selectBoothAndOpenRoom}
        position={entryPortalPosition}
      />
    </group>
  );
}

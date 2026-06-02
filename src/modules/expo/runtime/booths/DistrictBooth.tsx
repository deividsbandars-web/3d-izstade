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

const BOOTH_ENTRY_PORTAL_TRIGGER_RADIUS = 2.35;

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
      <mesh position={[0, 0.052, 0]} receiveShadow>
        <boxGeometry args={[3.1, 0.08, 1.72]} />
        <meshStandardMaterial color="#101827" emissive={accentColor} emissiveIntensity={0.12} metalness={0.08} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <boxGeometry args={[2.58, 0.035, 1.08]} />
        <meshBasicMaterial color={accentColor} opacity={0.42} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.128, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.86, 48]} />
        <meshBasicMaterial color="#f8fafc" opacity={0.58} side={THREE.DoubleSide} transparent toneMapped={false} />
      </mesh>
      <Text
        position={[0, 0.165, 0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.23}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.25}
      >
        ENTER BOOTH
      </Text>
      {[-1, 1].map((side) => (
        <mesh key={`portal-side-rail-${side}`} position={[side * 1.62, 0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.48, 1.56]} />
          <meshStandardMaterial color="#142233" emissive={accentColor} emissiveIntensity={0.14} metalness={0.16} roughness={0.32} />
        </mesh>
      ))}
      <mesh
        name="booth-entry-portal-trigger"
        position={[0, 0.85, 0]}
        onPointerDown={handleEnterPointer}
        userData={{
          expoBoothEntryPortalTrigger: true,
          expoInteractionOwner: 'DistrictBooth',
        }}
      >
        <boxGeometry args={[3.5, 1.7, 2.4]} />
        <meshBasicMaterial depthWrite={false} opacity={0} transparent />
      </mesh>
      <Text position={[0, 0.74, 0.92]} fontSize={0.13} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={2.6}>
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
    0,
    0,
    Math.max(4.35, boothInteractionMetrics.footprintSize[1] * 0.5 + 1.15),
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

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

const BOOTH_ENTRY_PORTAL_TRIGGER_RADIUS = 2.75;

function BoothEntryPortal({
  accentColor,
  label,
  lowDetail = false,
  onEnter,
  position,
  rotationY = 0,
}: {
  accentColor: string;
  label: string;
  lowDetail?: boolean;
  onEnter: () => void;
  position: [number, number, number];
  rotationY?: number;
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

  if (lowDetail) {
    return (
      <group name="booth-entry-portal booth-entry-portal-low-detail" position={position} rotation={[0, rotationY, 0]}>
        <mesh position={[0, 0.62, 0]} onPointerDown={handleEnterPointer}>
          <boxGeometry args={[3.9, 1.24, 0.2]} />
          <meshStandardMaterial color="#102031" emissive={accentColor} emissiveIntensity={0.14} roughness={0.42} />
        </mesh>
        <Text position={[0, 0.67, 0.12]} fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={3.2}>
          {safeLabel}
        </Text>
        <mesh
          name="booth-entry-portal-trigger"
          position={[0, 0.7, 0]}
          onPointerDown={handleEnterPointer}
          userData={{ expoBoothEntryPortalTrigger: true, expoInteractionOwner: 'DistrictBooth' }}
        >
          <boxGeometry args={[4.4, 1.5, 1.8]} />
          <meshBasicMaterial depthWrite={false} opacity={0} transparent visible={false} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      name="booth-entry-portal"
      position={position}
      rotation={[0, rotationY, 0]}
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
      <mesh position={[0, 0.054, 0]} receiveShadow>
        <boxGeometry args={[4.15, 0.08, 2.12]} />
        <meshStandardMaterial color="#0b2033" emissive={accentColor} emissiveIntensity={0.18} metalness={0.08} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.112, 0]}>
        <boxGeometry args={[3.52, 0.038, 1.42]} />
        <meshBasicMaterial color={accentColor} opacity={0.78} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.128, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 1.06, 56]} />
        <meshBasicMaterial color="#f8fafc" opacity={0.78} side={THREE.DoubleSide} transparent toneMapped={false} />
      </mesh>
      <Text
        position={[0, 0.165, 0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.2}
      >
        ENTER BOOTH
      </Text>
      {[-1, 1].map((side) => (
        <mesh key={`portal-side-rail-${side}`} position={[side * 2.12, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 0.56, 1.92]} />
          <meshStandardMaterial color="#142233" emissive={accentColor} emissiveIntensity={0.2} metalness={0.16} roughness={0.32} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={`walk-in-entry-beacon-${side}`} position={[side * 2.48, 0, 0.12]}>
          <mesh position={[0, 1.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.18, 2.16, 0.18]} />
            <meshBasicMaterial color="#e8f7ff" toneMapped={false} />
          </mesh>
          <mesh position={[0, 1.16, 0.13]}>
            <boxGeometry args={[0.28, 1.72, 0.05]} />
            <meshBasicMaterial color={accentColor} opacity={0.9} transparent toneMapped={false} />
          </mesh>
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[0.46, 0.18, 0.34]} />
            <meshBasicMaterial color={accentColor} opacity={0.82} transparent toneMapped={false} />
          </mesh>
        </group>
      ))}
      <group position={[0, 0, 0.18]}>
        {[-1, 1].map((side) => (
          <mesh key={`walk-in-portal-upright-${side}`} position={[side * 1.76, 0.94, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.24, 1.68, 0.22]} />
            <meshStandardMaterial color="#e8f7ff" emissive={accentColor} emissiveIntensity={0.3} metalness={0.12} roughness={0.28} />
          </mesh>
        ))}
        <mesh position={[0, 1.68, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.78, 0.24, 0.22]} />
          <meshStandardMaterial color="#e8f7ff" emissive={accentColor} emissiveIntensity={0.32} metalness={0.12} roughness={0.26} />
        </mesh>
        <mesh position={[0, 1.69, 0.14]}>
          <boxGeometry args={[3.18, 0.08, 0.08]} />
          <meshBasicMaterial color={accentColor} opacity={0.86} transparent toneMapped={false} />
        </mesh>
        <Text position={[0, 1.96, 0.16]} fontSize={0.17} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={3.1}>
          BOOTH ENTRY
        </Text>
      </group>
      <mesh
        position={[0, 0.82, 1.12]}
        castShadow
        receiveShadow
        onPointerDown={handleEnterPointer}
      >
        <boxGeometry args={[3.25, 0.86, 0.12]} />
        <meshStandardMaterial color="#0b1726" emissive={accentColor} emissiveIntensity={0.22} metalness={0.12} roughness={0.28} />
      </mesh>
      <Text position={[0, 0.96, 1.195]} fontSize={0.2} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={2.8}>
        WALK IN
      </Text>
      <Text position={[0, 0.69, 1.2]} fontSize={0.13} color="#dbeafe" anchorX="center" anchorY="middle" maxWidth={2.8}>
        BOOTH ROOM
      </Text>
      <mesh
        name="booth-entry-portal-trigger"
        position={[0, 0.86, 0.1]}
        onPointerDown={handleEnterPointer}
        userData={{
          expoBoothEntryPortalTrigger: true,
          expoInteractionOwner: 'DistrictBooth',
        }}
      >
        <boxGeometry args={[4.65, 1.72, 2.9]} />
        <meshBasicMaterial depthWrite={false} opacity={0} transparent visible={false} />
      </mesh>
      <Text position={[0, 1.31, 1.18]} fontSize={0.115} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={3.15}>
        {safeLabel}
      </Text>
    </group>
  );
}

function getBoothEntryPortalDistance({
  placementPosition,
  placementRotation,
  playerPosition,
  portalPositions,
}: {
  placementPosition: [number, number, number];
  placementRotation?: [number, number, number];
  playerPosition: [number, number, number];
  portalPositions: [number, number, number][];
}) {
  const boothYaw = placementRotation?.[1] ?? 0;
  const deltaX = playerPosition[0] - placementPosition[0];
  const deltaZ = playerPosition[2] - placementPosition[2];
  const cos = Math.cos(-boothYaw);
  const sin = Math.sin(-boothYaw);
  const localX = deltaX * cos - deltaZ * sin;
  const localZ = deltaX * sin + deltaZ * cos;

  return portalPositions.reduce((nearest, portalPosition) => {
    const distance = Math.hypot(localX - portalPosition[0], localZ - portalPosition[2]);
    return Math.min(nearest, distance);
  }, Number.POSITIVE_INFINITY);
}

export function DistrictBooth({
  districtVisual,
  lowDetail = false,
  placement,
  playerPosition,
}: {
  districtVisual: {
    districtGlow: string;
    expressionMode: string;
    groundAccent: string;
    shellAccent: string;
  };
  lowDetail?: boolean;
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
  const entryPortalPositions = useMemo<Array<{ position: [number, number, number]; rotationY: number }>>(() => {
    const offsetZ = Math.max(5.65, boothInteractionMetrics.footprintSize[1] * 0.5 + 2.18);
    return [
      { position: [0, 0, offsetZ], rotationY: 0 },
      { position: [0, 0, -offsetZ], rotationY: Math.PI },
    ];
  }, [boothInteractionMetrics.footprintSize]);
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
    forceDocumentNavigation: true,
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

  const entryPortalDistance = useMemo(() => getBoothEntryPortalDistance({
    placementPosition: placement.position,
    placementRotation: placement.rotation,
    playerPosition,
    portalPositions: entryPortalPositions.map((entry) => entry.position),
  }), [entryPortalPositions, placement.position, placement.rotation, playerPosition]);

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
        lowDetail={lowDetail}
        presentation={presentation}
        tierState={{ ...tierState, districtVisual }}
      />
      {entryPortalPositions.map((entryPortal) => (
        <BoothEntryPortal
          key={`booth-entry-portal-${entryPortal.position[2]}`}
          accentColor={districtVisual.shellAccent || placement.color}
          label={presentation.displayName}
          lowDetail={lowDetail}
          onEnter={selectBoothAndOpenRoom}
          position={entryPortal.position}
          rotationY={entryPortal.rotationY}
        />
      ))}
    </group>
  );
}

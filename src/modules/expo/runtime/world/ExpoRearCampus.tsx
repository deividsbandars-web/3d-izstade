import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';
import { buildRearCampusZonePlan, EXPO_CANONICAL_DISTRICT_STRIDE } from '../planning';
import type { ExpoQualitySettings } from './quality/expoQualitySettings';
import { useWorldInspectionRegistry } from './inspection/worldInspectionState';
import { buildStadiumWorldObjectRegistry } from './inspection/worldObjectRegistry';
import { WorldCityScreenAssignments } from './WorldCityScreenAssignments';
import { WorldCityMasses } from './WorldCityMasses';
import { WorldCityScreenSockets } from './WorldCityScreenSockets';
import { WorldCityScreenSurfaces } from './WorldCityScreenSurfaces';
import { ExpoRearCampusRecoveredStructures } from './ExpoRearCampusRecoveredStructures';
import { ExpoRearCampusStructures } from './ExpoRearCampusStructures';
import { buildRearCampusScreenHostShells } from './rearCampusScreenHosts';
import type { RearCampusScreenHostShell } from './rearCampusScreenHosts';
import {
  buildInstancedTransformMatrix,
  clearExpoInstancingTargetStats,
  publishExpoInstancingTargetStats,
} from './performance/expoInstancingUtils';
import {
  buildRenderedRearCampusRegistryPlan,
  filterRenderedRearCampusSidePavilions,
} from './rearCampusRenderPolicy';
import {
  ColliderMaterial,
  usePlayerColliderRegistration,
} from './WorldSceneSupport';
import { ExpoZoneGroup } from './zones/ExpoZoneGroup';
import {
  resolveExpoZoneRuntimeState,
  type ExpoZoneRuntimeState,
} from './zones/expoZoneRuntimeState';

const EMPTY_PLANNING_GEOMETRY = {
  arrivalPlanes: [],
  arrivalGatewayMasses: [],
  boothForecourtPlanes: [],
  boulevardEdgeMasses: [],
  discoveryEdgeMasses: [],
  discoveryLandmarkMasses: [],
  discoverySupportMasses: [],
  observatoryMasses: [],
  promenadeAxisPlanes: [],
  rightSupportMasses: [],
  showcaseMasses: [],
  showcasePlazas: [],
  signatureMasses: [],
  stadiumReserve: {
    centerX: 0,
    centerZ: 0,
    halfDepth: 0,
    halfWidth: 0,
  },
  supportEdgeMasses: [],
  skybridgeMasses: [],
  towers: [],
};

function resolvePerimeterMaterial(connector: { accent: string; id: string }) {
  switch (connector.accent) {
    case 'cap':
      return { color: '#98a4ad', emissiveIntensity: 0.03, metalness: 0.06, roughness: 0.66 };
    case 'rail':
      return { color: '#a7b3bc', emissiveIntensity: 0.032, metalness: 0.07, roughness: 0.62 };
    case 'post':
      return { color: '#8f9ca6', emissiveIntensity: 0.026, metalness: 0.055, roughness: 0.68 };
    case 'gate':
      return { color: '#aeb9c2', emissiveIntensity: 0.038, metalness: 0.08, roughness: 0.58 };
    default:
      return {
        color: connector.id.includes('rear-wall') ? '#81909a' : '#798893',
        emissiveIntensity: connector.id.includes('rear-wall') ? 0.022 : 0.018,
        metalness: 0.05,
        roughness: connector.id.includes('rear-wall') ? 0.78 : 0.8,
      };
  }
}

function RearCampusScreenHostShellInstances({
  accent,
  shells,
}: {
  accent: string;
  shells: RearCampusScreenHostShell[];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return undefined;
    }

    shells.forEach((shell, index) => {
      mesh.setMatrixAt(index, buildInstancedTransformMatrix({
        position: shell.position,
        rotation: shell.rotation,
        scale: shell.size,
      }, matrix));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    publishExpoInstancingTargetStats({
      estimatedDrawCallReduction: Math.max(0, shells.length - 1),
      instanceCount: shells.length,
      label: 'rear campus screen host shells',
      replacedMeshCount: shells.length,
      targetId: 'rear-campus-screen-host-shells',
    });

    return () => {
      clearExpoInstancingTargetStats('rear-campus-screen-host-shells');
    };
  }, [matrix, shells]);

  if (shells.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, shells.length]}
      name="rear-campus-screen-host-shells:instanced"
      receiveShadow
      userData={{
        expoInstancingTarget: 'rear-campus-screen-host-shells',
        expoInstancingInstanceCount: shells.length,
        expoInstancingReplacedMeshCount: shells.length,
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#73828c"
        emissive={accent}
        emissiveIntensity={0.025}
        roughness={0.78}
        metalness={0.05}
      />
    </instancedMesh>
  );
}

export function ExpoRearCampus({
  boothPlacements,
  playerPosition,
  qualitySettings,
  visualProfile,
  zoneRuntimeState,
}: {
  boothPlacements: ExpoBoothPlacement[];
  playerPosition: [number, number, number];
  qualitySettings: ExpoQualitySettings;
  visualProfile: ExpoWorldVisualProfile;
  zoneRuntimeState?: ExpoZoneRuntimeState;
}) {
  const campusColliderRef = useRef<THREE.Group>(null);
  const rearCampusPlan = useMemo(
    () => buildRearCampusZonePlan({
      geometry: EMPTY_PLANNING_GEOMETRY,
      inputs: {
        boothPlacements,
        districtPrograms: [],
        districtStride: EXPO_CANONICAL_DISTRICT_STRIDE,
        visualProfile,
      },
    }),
    [boothPlacements, visualProfile]
  );
  const rearCampus = rearCampusPlan.zoneExtension?.rearCampus;
  const campusCenterZ = rearCampus?.campusCenterZ ?? -2880;
  const stadiumBackWallZ = rearCampus?.stadiumBackWallZ ?? campusCenterZ - 1520;
  const accent = visualProfile.global.hudAccent;
  usePlayerColliderRegistration(campusColliderRef, 'rear-campus-collider');
  const filteredStadiumSidePavilions = filterRenderedRearCampusSidePavilions(rearCampus?.sidePavilions ?? []);
  const filteredStadiumLandmarkTowers = (rearCampus?.landmarkTowers ?? []).filter(() => false);
  const perimeterConnectors = useMemo(
    () => rearCampus?.perimeterConnectors ?? [],
    [rearCampus],
  );
  const renderedRearCampusMasses = useMemo(() => {
    const perimeterConnectorIds = new Set(perimeterConnectors.map((connector) => connector.id));
    return rearCampusPlan.masses.filter((mass) => !perimeterConnectorIds.has(mass.id));
  }, [perimeterConnectors, rearCampusPlan.masses]);
  const screenHostShells = useMemo(
    () => buildRearCampusScreenHostShells(rearCampusPlan.screenSurfaces),
    [rearCampusPlan.screenSurfaces]
  );
  const effectiveZoneRuntimeState = useMemo(
    () => zoneRuntimeState ?? resolveExpoZoneRuntimeState({
      playerPosition,
      qualitySettings,
      runtimeCaptureSafe: false,
    }),
    [playerPosition, qualitySettings, zoneRuntimeState],
  );

  const stadiumInspectionEntries = useMemo(() => buildStadiumWorldObjectRegistry({
    campusCenterZ,
    rearCampusPlan: buildRenderedRearCampusRegistryPlan(rearCampusPlan),
  }), [campusCenterZ, rearCampusPlan]);
  useWorldInspectionRegistry('stadium', stadiumInspectionEntries);

  return (
    <ExpoZoneGroup
      groupId="rear-campus-root"
      name="expo-rear-campus"
      runtimeState={effectiveZoneRuntimeState}
      zoneId="rearCampus"
    >
      <ExpoZoneGroup
        canHideInLowQuality
        groupId="rear-campus-perimeter"
        name="rear-campus-perimeter-shell"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="perimeter"
      >
        {perimeterConnectors.map((connector) => {
          const material = resolvePerimeterMaterial(connector);
          return (
            <mesh
              key={connector.id}
              name={`stadium-structure:${connector.id}`}
              position={connector.position}
              receiveShadow
            >
              <boxGeometry args={connector.size} />
              <meshStandardMaterial
                color={material.color}
                emissive={accent}
                emissiveIntensity={material.emissiveIntensity}
                roughness={material.roughness}
                metalness={material.metalness}
              />
            </mesh>
          );
        })}
      </ExpoZoneGroup>

      <ExpoZoneGroup
        groupId="rear-campus-structures"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="rearCampus"
      >
        <ExpoRearCampusRecoveredStructures
          accent={accent}
          campusCenterZ={campusCenterZ}
          enableHeavyShadows={false}
        />
        <WorldCityMasses
          masses={renderedRearCampusMasses}
          meshNamePrefix="stadium-structure"
          stadiumReserve={EMPTY_PLANNING_GEOMETRY.stadiumReserve}
          visualProfile={visualProfile}
        />
        <ExpoRearCampusStructures
          accent={accent}
          campusCenterZ={campusCenterZ}
          enableHeavyShadows={false}
          screenFeeds={[]}
          sidePavilions={filteredStadiumSidePavilions}
          towers={filteredStadiumLandmarkTowers}
        />
      </ExpoZoneGroup>

      <ExpoZoneGroup
        groupId="rear-campus-screens"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="demoArena"
      >
        <group name="rear-campus-screen-host-shells">
          <RearCampusScreenHostShellInstances accent={accent} shells={screenHostShells} />
        </group>
        <WorldCityScreenSurfaces
          playerPosition={playerPosition}
          qualitySettings={qualitySettings}
          stadiumReserve={EMPTY_PLANNING_GEOMETRY.stadiumReserve}
          surfaces={rearCampusPlan.screenSurfaces}
        />
        <WorldCityScreenSockets
          playerPosition={playerPosition}
          sockets={rearCampusPlan.screenSockets}
          stadiumReserve={EMPTY_PLANNING_GEOMETRY.stadiumReserve}
        />
        <WorldCityScreenAssignments
          assignments={rearCampusPlan.assignments}
          boothPlacements={boothPlacements}
          playerPosition={playerPosition}
          qualitySettings={qualitySettings}
          surfaces={rearCampusPlan.screenSurfaces}
          sockets={rearCampusPlan.screenSockets}
        />
      </ExpoZoneGroup>
      <ExpoZoneGroup
        groupId="rear-campus-colliders"
        name="rear-campus-collider"
        runtimeState={effectiveZoneRuntimeState}
        zoneId="rearCampus"
      >
        <group ref={campusColliderRef}>
          {[-1, 1].map((side) => (
            <mesh key={`rear-campus-gateway-collider-${side}`} position={[side * 1260, 168, campusCenterZ + 980]} rotation={[0, 0, 0]}>
              <boxGeometry args={[126, 336, 126]} />
              <ColliderMaterial color="#f97316" />
            </mesh>
          ))}
          <mesh position={[0, 208, stadiumBackWallZ]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[2860, 416, 860]} />
            <ColliderMaterial color="#f97316" />
          </mesh>
        </group>
      </ExpoZoneGroup>
    </ExpoZoneGroup>
  );
}

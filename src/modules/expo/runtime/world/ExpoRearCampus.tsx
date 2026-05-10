import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';
import { buildRearCampusZonePlan, EXPO_CANONICAL_DISTRICT_STRIDE } from '../planning';
import { useWorldInspectionRegistry } from './inspection/worldInspectionState';
import { buildStadiumWorldObjectRegistry } from './inspection/worldObjectRegistry';
import { WorldCityScreenAssignments } from './WorldCityScreenAssignments';
import { WorldCityScreenSockets } from './WorldCityScreenSockets';
import { WorldCityScreenSurfaces } from './WorldCityScreenSurfaces';
import { buildRearCampusScreenHostShells } from './rearCampusScreenHosts';
import {
  ColliderMaterial,
  usePlayerColliderRegistration,
} from './WorldSceneSupport';

const EMPTY_PLANNING_GEOMETRY = {
  arrivalPlanes: [],
  arrivalGatewayMasses: [],
  boothForecourtPlanes: [],
  boulevardEdgeMasses: [],
  discoveryEdgeMasses: [],
  discoveryLandmarkMasses: [],
  discoverySupportMasses: [],
  mediaWallMasses: [],
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

export function ExpoRearCampus({
  boothPlacements,
  playerPosition,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  playerPosition: [number, number, number];
  visualProfile: ExpoWorldVisualProfile;
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
  const filteredStadiumForecourts = (rearCampus?.forecourts ?? []).filter(() => false);
  const filteredStadiumSidePavilions = (rearCampus?.sidePavilions ?? []).filter(() => false);
  const filteredStadiumLandmarkTowers = (rearCampus?.landmarkTowers ?? []).filter(() => false);
  const perimeterConnectors = rearCampus?.perimeterConnectors ?? [];
  const screenHostShells = useMemo(
    () => buildRearCampusScreenHostShells(rearCampusPlan.screenSurfaces),
    [rearCampusPlan.screenSurfaces]
  );

  const stadiumInspectionEntries = useMemo(() => buildStadiumWorldObjectRegistry({
    campusCenterZ,
    rearCampusPlan: {
      ...rearCampusPlan,
      assignments: rearCampusPlan.assignments,
      planes: filteredStadiumForecourts.map((plane) => ({
        color: plane.color,
        id: plane.id,
        position: plane.position,
        role: 'decorative',
        size: plane.size,
      })),
      screenSockets: rearCampusPlan.screenSockets,
      screenSurfaces: rearCampusPlan.screenSurfaces,
      towers: rearCampusPlan.towers,
      zoneExtension: {
        rearCampus: rearCampus
          ? {
              ...rearCampus,
              forecourts: filteredStadiumForecourts,
              landmarkTowers: filteredStadiumLandmarkTowers,
              sidePavilions: filteredStadiumSidePavilions,
            }
          : undefined,
      },
    },
  }), [campusCenterZ, filteredStadiumForecourts, filteredStadiumLandmarkTowers, filteredStadiumSidePavilions, rearCampus, rearCampusPlan]);
  useWorldInspectionRegistry('stadium', stadiumInspectionEntries);

  return (
    <group name="expo-rear-campus">
      <group name="rear-campus-perimeter-shell">
        {perimeterConnectors.map((connector) => (
          <mesh
            key={connector.id}
            name={`stadium-structure:${connector.id}`}
            position={connector.position}
            receiveShadow
          >
            <boxGeometry args={connector.size} />
            <meshStandardMaterial
              color={connector.accent === 'cap' ? '#98a4ad' : connector.id.includes('rear-wall') ? '#81909a' : '#798893'}
              emissive={accent}
              emissiveIntensity={connector.accent === 'cap' ? 0.03 : connector.id.includes('rear-wall') ? 0.022 : 0.018}
              roughness={connector.accent === 'cap' ? 0.66 : connector.id.includes('rear-wall') ? 0.78 : 0.8}
              metalness={connector.accent === 'cap' ? 0.06 : 0.05}
            />
          </mesh>
        ))}
      </group>

      <group name="rear-campus-screen-host-shells">
        {screenHostShells.map((shell) => (
          <mesh
            key={shell.id}
            name={`stadium-structure:${shell.id}`}
            position={shell.position}
            rotation={shell.rotation}
            receiveShadow
          >
            <boxGeometry args={shell.size} />
            <meshStandardMaterial
              color="#73828c"
              emissive={accent}
              emissiveIntensity={0.025}
              roughness={0.78}
              metalness={0.05}
            />
          </mesh>
        ))}
      </group>
      <WorldCityScreenSurfaces
        playerPosition={playerPosition}
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
        playerPosition={playerPosition}
        sockets={rearCampusPlan.screenSockets}
      />
      <group ref={campusColliderRef} name="rear-campus-collider">
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
    </group>
  );
}


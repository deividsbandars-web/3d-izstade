import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { ExpoArchitecturalMassMaterial } from '../WorldSceneSupport';
import { ExpoRearCampus as RuntimeExpoRearCampus } from '../ExpoRearCampus';
import { WorldCitySkeleton } from '../WorldCitySkeleton';
import type { ExpoBoothPlacement } from '../../../layout-engine';
import type { ExpoDistrictProgramSummary, ExpoWorldVisualProfile } from '../../../world-contract';

export function Guests({ guests: _guests }: { guests: any[] }) {
  return (
    <group>
      {_guests.map((guest: any) => (
        <group key={guest.id} position={guest.position}>
          {guest.isSpeaking && (
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[1.5, 16, 16]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.1} />
            </mesh>
          )}
          <mesh position={[0, 1, 0]} castShadow>
            <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
            <meshStandardMaterial color={guest.color || '#3b82f6'} />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffdbac" />
          </mesh>
          <Html position={[0, 2.8, 0]} center>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              {guest.isSpeaking && <div style={{ fontSize: '12px' }}>🎙️</div>}
              <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                User_{guest.id.substring(0, 4)}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function getDistrictVisualProfile(
  sectorId: string | null | undefined,
  clusterIndex: number | undefined,
  visualProfile: ExpoWorldVisualProfile,
) {
  return (sectorId ? visualProfile.districts.find((district) => district.sectorId === sectorId) : undefined)
    ?? visualProfile.districts.find((district) => district.clusterIndex === clusterIndex)
    ?? visualProfile.districts[0];
}

function isInsideSponsorFrontageReserve(
  point: [number, number, number],
  boothPlacements: ExpoBoothPlacement[],
  options?: {
    frontDepth?: number;
    rearDepth?: number;
    sideWidth?: number;
    radius?: number;
  },
) {
  const frontDepth = options?.frontDepth ?? 520;
  const rearDepth = options?.rearDepth ?? 220;
  const sideWidth = options?.sideWidth ?? 260;
  const radius = options?.radius ?? 340;

  return boothPlacements.some((booth) => {
    const dx = point[0] - booth.position[0];
    const dz = point[2] - booth.position[2];
    const yaw = booth.rotation?.[1] ?? 0;
    const cos = Math.cos(-yaw);
    const sin = Math.sin(-yaw);
    const localX = (dx * cos) - (dz * sin);
    const localZ = (dx * sin) + (dz * cos);
    const distanceSq = (dx * dx) + (dz * dz);

    const inFrontageLane = Math.abs(localX) < sideWidth && localZ > -rearDepth && localZ < frontDepth;
    const inFrontageRadius = distanceSq < (radius * radius);

    return inFrontageLane || inFrontageRadius;
  });
}

function filterReservedSponsorFrontageEntries<T extends { position: [number, number, number] }>(
  entries: T[],
  boothPlacements: ExpoBoothPlacement[],
  options?: {
    frontDepth?: number;
    rearDepth?: number;
    sideWidth?: number;
    radius?: number;
  },
) {
  return entries.filter((entry) => !isInsideSponsorFrontageReserve(entry.position, boothPlacements, options));
}

function getStadiumReserve(_boothPlacements: ExpoBoothPlacement[]) {
  return {
    centerX: -10000,
    centerZ: -10000,
    halfWidth: 1,
    halfDepth: 1,
  };
}

function isInsideStadiumReserve(point: [number, number, number], reserve: ReturnType<typeof getStadiumReserve>) {
  return (
    Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth &&
    Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth
  );
}

function overlapsStadiumReserve(
  point: [number, number, number],
  reserve: ReturnType<typeof getStadiumReserve>,
  footprint?: [number, number] | [number, number, number] | number,
) {
  if (typeof footprint === 'number') {
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + footprint &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + footprint
    );
  }

  if (Array.isArray(footprint)) {
    const halfX = footprint[0] * 0.5;
    const halfZ = (footprint.length === 3 ? footprint[2] : footprint[1]) * 0.5;
    return (
      Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth + halfX &&
      Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth + halfZ
    );
  }

  return isInsideStadiumReserve(point, reserve);
}

function ExpoCityForeground({
  boothPlacements,
  districtPrograms,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  void visualProfile;
  const stadiumReserve = useMemo(() => getStadiumReserve(boothPlacements), [boothPlacements]);
  const cityStreetMoments = useMemo(() => {
    const entries = districtPrograms.flatMap((district, districtIndex) => {
      const baseZ = -196 - (districtIndex * 548);
      const isActive = district.expressionMode === 'active-commercial';
      const isCalm = district.expressionMode === 'calm-dwell';
      const boulevardColor = isActive ? '#1a2531' : isCalm ? '#202a33' : '#1c2730';
      const farStreetColor = isActive ? '#33424f' : isCalm ? '#3b4953' : '#36454f';
      const connectorColor = isActive ? '#aebfcd' : '#b8c4cf';

      return [
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-left`,
          position: [-228, 0.014, baseZ - 72] as [number, number, number],
          size: [84, 436] as [number, number],
          color: boulevardColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-right`,
          position: [228, 0.014, baseZ - 88] as [number, number, number],
          size: [84, 452] as [number, number],
          color: boulevardColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-far-left`,
          position: [-474, 0.014, baseZ - 204] as [number, number, number],
          size: [96, 404] as [number, number],
          color: farStreetColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-street-far-right`,
          position: [474, 0.014, baseZ - 228] as [number, number, number],
          size: [96, 404] as [number, number],
          color: farStreetColor,
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-cross-link-near`,
          position: [0, 0.016, baseZ + 84] as [number, number, number],
          size: [612, 28] as [number, number],
          color: '#d7e0e8',
        },
        {
          id: `${district.sectorId ?? district.clusterIndex}-cross-link-mid`,
          position: [0, 0.016, baseZ - 126] as [number, number, number],
          size: [764, 24] as [number, number],
          color: connectorColor,
        },
      ];
    });
    return filterReservedSponsorFrontageEntries(entries, boothPlacements, { frontDepth: 540, rearDepth: 180, sideWidth: 220, radius: 280 });
  }, [districtPrograms, boothPlacements]);

  return (
    <group name="expo-city-foreground">
      {cityStreetMoments.filter((street) => !overlapsStadiumReserve(street.position, stadiumReserve, street.size)).map((street) => (
        <mesh key={street.id} position={street.position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={street.size} />
          <meshStandardMaterial color={street.color} roughness={0.82} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, 2, 0]} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <ExpoArchitecturalMassMaterial fallbackColor="#000000" />
      </mesh>
    </group>
  );
}

void ExpoCityForeground;
void getDistrictVisualProfile;

export function CleanExpoCitySkeleton({
  boothPlacements,
  districtPrograms,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  return <WorldCitySkeleton boothPlacements={boothPlacements} districtPrograms={districtPrograms} visualProfile={visualProfile} />;
}

export function ExpoRearCampus({
  boothPlacements,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  visualProfile: ExpoWorldVisualProfile;
}) {
  return <RuntimeExpoRearCampus boothPlacements={boothPlacements} visualProfile={visualProfile} />;
}

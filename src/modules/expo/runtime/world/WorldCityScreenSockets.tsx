import * as THREE from 'three';

type CityScreenSocket = {
  color: string;
  frameSize: [number, number];
  id: string;
  kind: 'hero_wall' | 'tower_crown' | 'tower_side' | 'wall';
  position: [number, number, number];
  rotation: [number, number, number];
  surfaceId: string;
};

type StadiumReserve = {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
};

function overlapsStadiumReserve(
  point: [number, number, number],
  reserve: StadiumReserve,
  footprint?: [number, number] | [number, number, number] | number
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

  return (
    Math.abs(point[0] - reserve.centerX) <= reserve.halfWidth &&
    Math.abs(point[2] - reserve.centerZ) <= reserve.halfDepth
  );
}

export function WorldCityScreenSockets({
  playerPosition,
  sockets,
  stadiumReserve,
}: {
  playerPosition: [number, number, number];
  sockets: CityScreenSocket[];
  stadiumReserve: StadiumReserve;
}) {
  return (
    <>
      {sockets
        .filter((socket) => {
          if (overlapsStadiumReserve(socket.position, stadiumReserve, socket.frameSize)) {
            return false;
          }

          const dx = socket.position[0] - playerPosition[0];
          const dz = socket.position[2] - playerPosition[2];
          const distanceSq = (dx * dx) + (dz * dz);
          const maxDistance = socket.kind === 'hero_wall' || socket.kind === 'tower_crown' ? 1650 : 1180;
          return distanceSq <= maxDistance * maxDistance;
        })
        .map((socket) => (
          <group key={socket.id} position={socket.position} rotation={socket.rotation}>
            <mesh>
              <planeGeometry args={socket.frameSize} />
              <meshBasicMaterial color={socket.color} transparent opacity={socket.kind === 'hero_wall' ? 0.1 : 0.07} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(socket.frameSize[0], socket.frameSize[1])]} />
              <lineBasicMaterial color={socket.color} transparent opacity={socket.kind === 'hero_wall' ? 0.82 : 0.62} />
            </lineSegments>
            {(socket.kind === 'hero_wall' || socket.kind === 'tower_crown') && (
              <mesh position={[0, socket.kind === 'tower_crown' ? 0 : socket.frameSize[1] * 0.5 + 0.6, 0]}>
                <boxGeometry args={[socket.kind === 'hero_wall' ? socket.frameSize[0] * 0.28 : socket.frameSize[0] * 0.22, 0.36, 0.22]} />
                <meshBasicMaterial color={socket.color} transparent opacity={0.9} />
              </mesh>
            )}
          </group>
        ))}
    </>
  );
}

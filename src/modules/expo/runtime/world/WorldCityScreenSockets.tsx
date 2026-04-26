import * as THREE from 'three';

import type { CanonicalPrimitive, CityScreenSocket } from '../planning/types';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

function renderPrimitive(primitive: CanonicalPrimitive, key: string) {
  if (primitive.kind === 'box') {
    return (
      <mesh key={key} position={primitive.position} rotation={primitive.rotation}>
        <boxGeometry args={primitive.size} />
        <meshStandardMaterial color={primitive.color} emissive={primitive.emissive} emissiveIntensity={primitive.emissiveIntensity ?? 0} metalness={primitive.metalness ?? 0.38} roughness={primitive.roughness ?? 0.34} />
      </mesh>
    );
  }

  if (primitive.kind === 'plane') {
    return (
      <mesh key={key} position={primitive.position} rotation={primitive.rotation}>
        <planeGeometry args={primitive.size} />
        <meshBasicMaterial color={primitive.color} transparent={primitive.transparent} opacity={primitive.opacity} />
      </mesh>
    );
  }

  return null;
}

export function WorldCityScreenSockets({
  playerPosition,
  sockets,
  stadiumReserve: _stadiumReserve,
}: {
  playerPosition: [number, number, number];
  sockets: CityScreenSocket[];
  stadiumReserve: StadiumReserve;
}) {
  void _stadiumReserve;
  return (
    <>
      {sockets
        .filter((socket) => {
          if (socket.renderIntent?.visible === false) {
            return false;
          }

          const dx = socket.position[0] - playerPosition[0];
          const dz = socket.position[2] - playerPosition[2];
          const distanceSq = (dx * dx) + (dz * dz);
          const maxDistance = socket.renderIntent?.maxDistance ?? 1040;
          return distanceSq <= maxDistance * maxDistance;
        })
        .map((socket) => (
          <group key={socket.id} name={`world-city-screen-socket:${socket.kind}:${socket.id}`} position={socket.position} rotation={socket.rotation}>
            {(socket.renderIntent?.primitives ?? []).map((primitive, index) => renderPrimitive(primitive, `${socket.id}:${primitive.kind}:${index}`))}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(socket.frameSize[0] * 0.96, socket.frameSize[1] * 0.96, (socket.renderIntent?.frameDepth ?? 1.9) * 0.4)]} />
              <lineBasicMaterial color={socket.color} transparent opacity={socket.kind === 'hero_wall' ? 0.38 : 0.26} />
            </lineSegments>
          </group>
        ))}
    </>
  );
}

import type { CanonicalPrimitive, CityScreenSurface } from '../planning/types';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

function renderPrimitive(primitive: CanonicalPrimitive, key: string) {
  if (primitive.kind === 'box') {
    return (
      <mesh key={key} position={primitive.position} rotation={primitive.rotation}>
        <boxGeometry args={primitive.size} />
        <meshStandardMaterial
          color={primitive.color}
          emissive={primitive.emissive}
          emissiveIntensity={primitive.emissiveIntensity ?? 0}
          metalness={primitive.metalness ?? 0.38}
          roughness={primitive.roughness ?? 0.42}
          transparent={primitive.transparent}
          opacity={primitive.opacity}
        />
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

export function WorldCityScreenSurfaces({
  playerPosition,
  stadiumReserve: _stadiumReserve,
  surfaces,
}: {
  playerPosition: [number, number, number];
  stadiumReserve: StadiumReserve;
  surfaces: CityScreenSurface[];
}) {
  void _stadiumReserve;
  return (
    <>
      {surfaces
        .filter((surface) => {
          if (surface.renderIntent?.visible === false) {
            return false;
          }

          const dx = surface.position[0] - playerPosition[0];
          const dz = surface.position[2] - playerPosition[2];
          const distanceSq = (dx * dx) + (dz * dz);
          const maxDistance = surface.renderIntent?.maxDistance ?? 1240;
          return distanceSq <= maxDistance * maxDistance;
        })
        .map((surface) => {
          const primitives = surface.renderIntent?.primitives ?? [];

          return (
            <group key={surface.id} name={`world-city-screen-surface:${surface.role}:${surface.id}`} position={surface.position} rotation={surface.rotation}>
              {primitives.map((primitive, index) => renderPrimitive(primitive, `${surface.id}:${primitive.kind}:${index}`))}
            </group>
          );
        })}
    </>
  );
}

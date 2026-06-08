import type { CanonicalPrimitive, CityScreenSurface } from '../planning/types';
import { WorldCityScreenHousingInstances } from './WorldCityScreenHousingInstances';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

function renderPrimitive(primitive: CanonicalPrimitive, key: string) {
  if (primitive.kind === 'box') {
    return null;
  }

  if (primitive.kind === 'plane') {
    return (
      <mesh key={key} name={key} position={primitive.position} rotation={primitive.rotation} renderOrder={4}>
        <planeGeometry args={primitive.size} />
        <meshBasicMaterial
          color={primitive.color}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
          transparent={primitive.transparent}
          opacity={primitive.opacity}
          toneMapped={false}
        />
      </mesh>
    );
  }

  return null;
}

function getSurfaceHitPlaneOffset(surface: CityScreenSurface) {
  const housingDepth = surface.renderIntent?.housingDepth ?? surface.size[2];

  if (surface.role === 'tower-crown' || surface.role === 'tower-side') {
    return Math.max(0.32, housingDepth * 0.18);
  }

  return Math.max(0.4, housingDepth * 0.22);
}

function shouldCullDistantScreens() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('screenDistanceCulling') === '1';
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
  const cullDistantScreens = shouldCullDistantScreens();
  const visibleSurfaces = surfaces.filter((surface) => {
    if (surface.renderIntent?.visible === false) {
      return false;
    }

    if (!cullDistantScreens) {
      return true;
    }

    const dx = surface.position[0] - playerPosition[0];
    const dz = surface.position[2] - playerPosition[2];
    const distanceSq = (dx * dx) + (dz * dz);
    const maxDistance = surface.renderIntent?.maxDistance ?? 1240;
    return distanceSq <= maxDistance * maxDistance;
  });

  return (
    <>
      <WorldCityScreenHousingInstances surfaces={visibleSurfaces} />
      {visibleSurfaces.map((surface) => {
          const primitives = surface.renderIntent?.primitives ?? [];
          const hitPlaneOffset = getSurfaceHitPlaneOffset(surface);

          return (
            <group key={surface.id} name={`world-city-screen-surface:${surface.role}:${surface.id}`} position={surface.position} rotation={surface.rotation}>
              <mesh name={`world-city-screen-surface-hit:${surface.id}`} position={[0, 0, hitPlaneOffset]} renderOrder={0}>
                <planeGeometry args={[surface.size[0], surface.size[1]]} />
                <meshBasicMaterial
                  transparent
                  opacity={0}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              {primitives.map((primitive, index) => renderPrimitive(primitive, `${surface.id}:${primitive.kind}:${index}`))}
            </group>
          );
        })}
    </>
  );
}

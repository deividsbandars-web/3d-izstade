import type { CityPlane, StadiumReserve } from './WorldCitySkeletonLayout';

const STRUCTURAL_CITY_GROUND_COLOR = '#6f7c85';

function resolveStructuralCityPlaneTone(id: string) {
  void id;
  return STRUCTURAL_CITY_GROUND_COLOR;
}

function filterVisibleStructuralCityPlanes(planes: CityPlane[]) {
  return planes.filter((plane) => plane.role === 'structural');
}

function PlaneLayer({
  planes,
  roughness,
}: {
  planes: CityPlane[];
  roughness: number;
}) {
  return (
    <>
      {planes.map((plane) => (
        <group key={plane.id} name={`city-plane:${plane.id}`} position={plane.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={8}>
            <planeGeometry args={plane.size} />
            <meshStandardMaterial
              color={resolveStructuralCityPlaneTone(plane.id)}
              roughness={Math.max(roughness, 0.88)}
              metalness={0.01}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function WorldCityPlanes({
  arrivalPlanes,
  promenadeAxisPlanes: _promenadeAxisPlanes,
  showcasePlazas: _showcasePlazas,
  boothForecourtPlanes: _boothForecourtPlanes,
  stadiumReserve: _stadiumReserve,
}: {
  arrivalPlanes: CityPlane[];
  promenadeAxisPlanes: CityPlane[];
  showcasePlazas: CityPlane[];
  boothForecourtPlanes: CityPlane[];
  stadiumReserve: StadiumReserve;
}) {
  void _promenadeAxisPlanes;
  void _showcasePlazas;
  void _boothForecourtPlanes;
  void _stadiumReserve;
  // Stadium/city perimeter connectors are owned by ExpoRearCampus, not by city structural planes.
  const structuralArrivalPlanes = filterVisibleStructuralCityPlanes(arrivalPlanes);

  return (
    <group name="world-ground:city-structural-planes">
      <PlaneLayer planes={structuralArrivalPlanes} roughness={0.72} />
    </group>
  );
}

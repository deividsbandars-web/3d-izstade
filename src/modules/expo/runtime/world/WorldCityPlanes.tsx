import type { StadiumReserve } from './WorldCitySkeletonLayout';

type CityPlane = {
  id: string;
  position: [number, number, number];
  size: [number, number];
  color: string;
};

const STRUCTURAL_CITY_GROUND_COLOR = '#6f7c85';
const MIN_STRUCTURAL_CITY_PLANE_AREA = 140_000;

function isDecorativePlane(id: string) {
  return (
    id.includes('carpet') ||
    id.includes('ribbon') ||
    id.includes('band') ||
    id.includes('threshold') ||
    id.includes('connector') ||
    id.includes('pocket') ||
    id.includes('pad') ||
    id.includes('inner') ||
    id.includes('gallery') ||
    id.includes('terminal') ||
    id.includes('front-court') ||
    id.includes('front-threshold') ||
    id.includes('outer-pocket')
  );
}

function resolveStructuralCityPlaneTone(id: string) {
  void id;
  return STRUCTURAL_CITY_GROUND_COLOR;
}

function filterVisibleStructuralCityPlanes(planes: CityPlane[]) {
  return planes.filter((plane) => {
    if (isDecorativePlane(plane.id)) {
      return false;
    }

    const area = plane.size[0] * plane.size[1];
    return area >= MIN_STRUCTURAL_CITY_PLANE_AREA;
  });
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
  const structuralArrivalPlanes = filterVisibleStructuralCityPlanes(arrivalPlanes);

  return (
    <group name="world-ground:city-structural-planes">
      <PlaneLayer planes={structuralArrivalPlanes} roughness={0.72} />
    </group>
  );
}

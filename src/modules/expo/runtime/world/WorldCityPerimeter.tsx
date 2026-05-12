import type { StadiumReserve } from '../planning/types';
import { buildCityPerimeterConnectors } from './WorldCityPerimeterLayout';

function resolveCityPerimeterMaterial() {
  return {
    color: '#8a99a4',
    emissiveIntensity: 0.018,
    metalness: 0.05,
    roughness: 0.76,
  };
}

export function WorldCityPerimeter({
  accent,
  stadiumReserve,
}: {
  accent: string;
  stadiumReserve: StadiumReserve;
}) {
  const material = resolveCityPerimeterMaterial();

  return (
    <group name="city-perimeter:controlled">
      {buildCityPerimeterConnectors(stadiumReserve).map((connector) => {
        const isLongX = connector.size[0] >= connector.size[2];
        const capSize: [number, number, number] = isLongX
          ? [connector.size[0] * 0.98, 4, Math.max(6, connector.size[2] * 0.72)]
          : [Math.max(6, connector.size[0] * 0.72), 4, connector.size[2] * 0.98];
        const capY = connector.position[1] + (connector.size[1] * 0.5) + 2;

        return (
          <group key={connector.id} name={`city-perimeter:${connector.id}`}>
            <mesh position={connector.position} receiveShadow>
              <boxGeometry args={connector.size} />
              <meshStandardMaterial
                color={material.color}
                emissive={accent}
                emissiveIntensity={material.emissiveIntensity}
                roughness={material.roughness}
                metalness={material.metalness}
              />
            </mesh>
            <mesh position={[connector.position[0], capY, connector.position[2]]} receiveShadow>
              <boxGeometry args={capSize} />
              <meshStandardMaterial
                color="#a8b4bd"
                emissive={accent}
                emissiveIntensity={0.04}
                roughness={0.62}
                metalness={0.07}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

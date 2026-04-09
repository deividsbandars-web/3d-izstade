import * as THREE from 'three';

type WaterCourtPlane = {
  id: string;
  position: [number, number, number];
  size: [number, number];
  color: string;
};

export function WorldCityWaterCourt({
  planes,
}: {
  planes: WaterCourtPlane[];
}) {
  return (
    <>
      {planes.map((plane) => (
        <mesh key={plane.id} position={plane.position} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={plane.size} />
          <meshStandardMaterial
            color={plane.color}
            emissive={plane.color}
            emissiveIntensity={0.08}
            roughness={0.22}
            metalness={0.12}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

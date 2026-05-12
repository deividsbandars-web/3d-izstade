import type { CampusPavilion, CampusTower } from './ExpoRearCampusLayout';

type CampusScreenFeed = {
  accentColor: string;
  id: string;
  imageUrl: string | null;
};

export function ExpoRearCampusStructures({
  accent,
  enableHeavyShadows,
  screenFeeds,
  sidePavilions,
  towers,
}: {
  accent: string;
  campusCenterZ: number;
  enableHeavyShadows: boolean;
  screenFeeds: CampusScreenFeed[];
  sidePavilions: CampusPavilion[];
  towers: CampusTower[];
}) {
  void screenFeeds;
  void towers;

  return (
    <group name="rear-campus-support-pavilions">
      {sidePavilions.map((pavilion) => {
        const [width, height, depth] = pavilion.size;
        const bodyDepth = depth * 0.62;
        const bodyOffsetZ = -(depth * 0.18);
        const accentX = pavilion.accentSide * (width * 0.5 - Math.max(6, width * 0.045));

        return (
          <group key={pavilion.id} name={`stadium-pavilion:${pavilion.id}`} position={pavilion.position}>
            <mesh position={[0, 8, bodyOffsetZ]} receiveShadow>
              <boxGeometry args={[width * 1.08, 16, bodyDepth * 1.08]} />
              <meshStandardMaterial color="#6f7d87" roughness={0.78} metalness={0.05} emissive={accent} emissiveIntensity={0.018} />
            </mesh>
            <mesh position={[0, height * 0.5, bodyOffsetZ]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[width, height, bodyDepth]} />
              <meshStandardMaterial color="#83929c" roughness={0.68} metalness={0.06} emissive={accent} emissiveIntensity={0.03} />
            </mesh>
            <mesh position={[0, height + 10, bodyOffsetZ - (depth * 0.03)]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[width * 1.12, 20, bodyDepth * 0.86]} />
              <meshStandardMaterial color="#a3b0b9" roughness={0.56} metalness={0.08} emissive={accent} emissiveIntensity={0.045} />
            </mesh>
            <mesh position={[accentX, height * 0.58, bodyOffsetZ + (bodyDepth * 0.12)]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[Math.max(8, width * 0.09), height * 0.72, Math.max(18, bodyDepth * 0.28)]} />
              <meshStandardMaterial color="#5f7280" roughness={0.58} metalness={0.08} emissive={accent} emissiveIntensity={0.052} />
            </mesh>
            <mesh position={[-accentX, height * 0.62, bodyOffsetZ - (bodyDepth * 0.16)]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[Math.max(6, width * 0.062), height * 0.52, Math.max(14, bodyDepth * 0.2)]} />
              <meshStandardMaterial color="#74848f" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.034} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

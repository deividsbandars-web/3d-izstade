import {
  RECOVERED_REAR_CAMPUS_STRUCTURES,
  resolveRecoveredRearCampusGroupPosition,
} from './rearCampusRecoveredStructures';

export function ExpoRearCampusRecoveredStructures({
  accent,
  campusCenterZ,
  enableHeavyShadows,
}: {
  accent: string;
  campusCenterZ: number;
  enableHeavyShadows: boolean;
}) {
  const groupPosition = (id: string) => {
    const structure = RECOVERED_REAR_CAMPUS_STRUCTURES.find((entry) => entry.id === id);
    if (!structure) {
      throw new Error(`Unknown recovered rear campus structure: ${id}`);
    }
    return resolveRecoveredRearCampusGroupPosition(structure, campusCenterZ);
  };

  return (
    <group name="rear-campus-recovered-structures">
      <group name="stadium-structure:rear-campus-stage-monolith-canopy" position={groupPosition('rear-campus-stage-monolith-canopy')}>
        <mesh position={[0, 10, 0]} receiveShadow>
          <boxGeometry args={[564, 20, 176]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.026} />
        </mesh>
        <mesh position={[-164, 110, -12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[112, 200, 118]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.055} />
        </mesh>
        <mesh position={[164, 110, -12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[112, 200, 118]} />
          <meshStandardMaterial color="#84919a" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 96, 10]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[216, 156, 96]} />
          <meshStandardMaterial color="#6f7b84" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 220, -4]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[472, 24, 168]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 192, -76]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[308, 28, 18]} />
          <meshStandardMaterial color="#9aa7b0" roughness={0.5} metalness={0.08} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 54, 66]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[248, 18, 38]} />
          <meshStandardMaterial color="#90a5b3" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-mega-civic-hall" position={groupPosition('rear-campus-mega-civic-hall')}>
        <mesh position={[0, 18, 0]} receiveShadow>
          <boxGeometry args={[724, 28, 324]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[0, 136, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[428, 236, 196]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-214, 94, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[152, 152, 142]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[214, 94, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[152, 152, 142]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 264, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[488, 18, 216]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 312, -12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[292, 56, 118]} />
          <meshStandardMaterial color="#90a5b3" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[0, 346, -88]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[196, 12, 18]} />
          <meshStandardMaterial color="#9aa7b0" roughness={0.5} metalness={0.08} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-linked-mini-skyline" position={groupPosition('rear-campus-linked-mini-skyline')}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <boxGeometry args={[744, 18, 312]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[-286, 102, -38]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[88, 204, 92]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-134, 156, 42]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[102, 312, 96]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[28, 222, -8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[112, 444, 102]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[188, 176, 36]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[94, 352, 94]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[336, 124, -22]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[82, 248, 88]} />
          <meshStandardMaterial color="#c4d2dc" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[-206, 214, 2]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[138, 16, 34]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[106, 286, 10]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[168, 16, 36]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[260, 186, 6]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[120, 14, 32]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.56} metalness={0.06} emissive={accent} emissiveIntensity={0.07} />
        </mesh>
        <mesh position={[-56, 54, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[96, 18, 72]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[154, 54, -12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[82, 16, 58]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-petal-tower" position={groupPosition('rear-campus-petal-tower')}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <cylinderGeometry args={[98, 118, 20, 32]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 262, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[34, 46, 524, 28]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 198, 56]} rotation={[0.18, 0, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[18, 34, 336, 20]} />
          <meshStandardMaterial color="#c9d6e0" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[48, 214, -20]} rotation={[0.08, 0, -0.72]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[16, 30, 372, 20]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-46, 208, -26]} rotation={[0.08, 0, 0.72]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[16, 30, 356, 20]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 472, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[14, 22, 96, 20]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.5} metalness={0.08} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 548, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <sphereGeometry args={[26, 20, 20]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.42} metalness={0.12} emissive={accent} emissiveIntensity={0.14} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-bridge-linked-campus" position={groupPosition('rear-campus-bridge-linked-campus')}>
        <mesh position={[-214, 116, -24]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[176, 228, 132]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, 176, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[224, 348, 154]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[236, 134, 28]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[188, 264, 136]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-108, 228, -8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[192, 18, 54]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[118, 264, 8]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[208, 18, 54]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.54} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 72, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[128, 18, 42]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-helix-spire" position={groupPosition('rear-campus-helix-spire')}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <cylinderGeometry args={[112, 132, 20, 36]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[0, 312, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[26, 42, 624, 24]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.58} metalness={0.08} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[0, 112, 0]} rotation={[0.08, 0, 0.42]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[228, 14, 22]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.1} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 212, 0]} rotation={[0.08, 0, 1.08]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[252, 14, 22]} />
          <meshStandardMaterial color="#84919a" roughness={0.56} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 318, 0]} rotation={[0.08, 0, 1.82]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[272, 14, 22]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.1} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 426, 0]} rotation={[0.08, 0, 2.46]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[246, 14, 22]} />
          <meshStandardMaterial color="#84919a" roughness={0.56} metalness={0.08} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 536, 0]} rotation={[0.08, 0, 3.1]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[214, 12, 20]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.1} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 676, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <cylinderGeometry args={[8, 16, 172, 18]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.56} metalness={0.1} emissive={accent} emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 784, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <octahedronGeometry args={[28, 0]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.4} metalness={0.14} emissive={accent} emissiveIntensity={0.16} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-grand-prism-citadel" position={groupPosition('rear-campus-grand-prism-citadel')}>
        <mesh position={[0, 14, 0]} receiveShadow>
          <boxGeometry args={[596, 20, 224]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[-118, 176, -16]} rotation={[0, 0, -0.12]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[114, 352, 72]} />
          <meshStandardMaterial color="#84919a" roughness={0.68} metalness={0.05} emissive={accent} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[34, 228, 18]} rotation={[0, 0, 0.08]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[126, 456, 84]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[172, 142, 6]} rotation={[0, 0, 0.2]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[68, 284, 52]} />
          <meshStandardMaterial color="#6f7b84" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-void-courtyard-monument" position={groupPosition('rear-campus-void-courtyard-monument')}>
        <mesh position={[0, 16, 0]} receiveShadow>
          <boxGeometry args={[612, 22, 348]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.025} />
        </mesh>
        <mesh position={[-188, 188, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[144, 376, 132]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[188, 188, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[144, 376, 132]} />
          <meshStandardMaterial color="#84919a" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 188, -108]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[236, 376, 116]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 188, 108]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[236, 376, 116]} />
          <meshStandardMaterial color="#84919a" roughness={0.64} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 386, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[236, 20, 236]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.08} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 92, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[118, 18, 118]} />
          <meshStandardMaterial color="#8fa5b2" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-twin-void-monolith" position={groupPosition('rear-campus-twin-void-monolith')}>
        <mesh position={[0, 12, 0]} receiveShadow>
          <boxGeometry args={[276, 18, 168]} />
          <meshStandardMaterial color="#84919a" roughness={0.74} metalness={0.04} emissive={accent} emissiveIntensity={0.024} />
        </mesh>
        <mesh position={[-82, 244, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[72, 488, 44]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.6} metalness={0.06} emissive={accent} emissiveIntensity={0.06} />
        </mesh>
        <mesh position={[82, 232, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[64, 464, 44]} />
          <meshStandardMaterial color="#84919a" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 92, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[92, 18, 30]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.66} metalness={0.05} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 494, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[118, 14, 24]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.52} metalness={0.08} emissive={accent} emissiveIntensity={0.09} />
        </mesh>
        <mesh position={[0, 586, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[22, 168, 22]} />
          <meshStandardMaterial color="#98a4ad" roughness={0.62} metalness={0.06} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-orbital-scoregate" position={groupPosition('rear-campus-orbital-scoregate')}>
        <mesh position={[0, 16, 0]} receiveShadow>
          <boxGeometry args={[1520, 32, 260]} />
          <meshStandardMaterial color="#687783" roughness={0.76} metalness={0.06} emissive={accent} emissiveIntensity={0.026} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={`scoregate-pylon-${side}`}>
            <mesh position={[side * 620, 360, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[160, 720, 180]} />
              <meshStandardMaterial color={side < 0 ? '#8d9ca7' : '#778690'} roughness={0.62} metalness={0.08} emissive={accent} emissiveIntensity={0.055} />
            </mesh>
            <mesh position={[side * 620, 748, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[214, 34, 214]} />
              <meshStandardMaterial color="#a9b7c1" roughness={0.5} metalness={0.12} emissive={accent} emissiveIntensity={0.12} />
            </mesh>
            <mesh position={[side * 490, 532, 112]} rotation={[0, 0, side * 0.28]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[310, 24, 36]} />
              <meshStandardMaterial color="#90a4af" roughness={0.5} metalness={0.12} emissive={accent} emissiveIntensity={0.11} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 738, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[1320, 88, 150]} />
          <meshStandardMaterial color="#9aa8b2" roughness={0.52} metalness={0.1} emissive={accent} emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 500, 118]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[920, 380, 44]} />
          <meshStandardMaterial color="#172635" roughness={0.44} metalness={0.2} emissive={accent} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 500, 144]} castShadow={false} receiveShadow>
          <boxGeometry args={[820, 300, 6]} />
          <meshStandardMaterial color="#07111f" roughness={0.28} metalness={0.12} emissive="#38bdf8" emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[0, 92, 88]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[780, 52, 112]} />
          <meshStandardMaterial color="#7d8b96" roughness={0.66} metalness={0.08} emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[-370, 620, 70]} rotation={[0, 0, -0.32]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[420, 28, 42]} />
          <meshStandardMaterial color="#b7c6d0" roughness={0.46} metalness={0.12} emissive="#38bdf8" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[370, 620, 70]} rotation={[0, 0, 0.32]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[420, 28, 42]} />
          <meshStandardMaterial color="#b7c6d0" roughness={0.46} metalness={0.12} emissive="#38bdf8" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[0, 588, 128]}>
          <torusGeometry args={[548, 8, 12, 96]} />
          <meshStandardMaterial color="#c7d7e2" roughness={0.4} metalness={0.16} emissive="#38bdf8" emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0, 588, 130]} scale={[0.68, 0.68, 1]}>
          <torusGeometry args={[548, 5, 10, 96]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.34} metalness={0.18} emissive="#38bdf8" emissiveIntensity={0.24} />
        </mesh>
      </group>

      <group name="stadium-structure:rear-campus-entry-pulse-arches" position={groupPosition('rear-campus-entry-pulse-arches')}>
        {[-1, 1].map((side) => (
          <group key={`entry-pulse-arch-${side}`}>
            <mesh position={[side * 950, 14, 0]} receiveShadow>
              <boxGeometry args={[360, 28, 220]} />
              <meshStandardMaterial color="#74828d" roughness={0.76} metalness={0.06} emissive={accent} emissiveIntensity={0.024} />
            </mesh>
            <mesh position={[side * 1120, 190, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[78, 380, 96]} />
              <meshStandardMaterial color="#8c9aa5" roughness={0.6} metalness={0.08} emissive={accent} emissiveIntensity={0.065} />
            </mesh>
            <mesh position={[side * 760, 220, 0]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[92, 440, 108]} />
              <meshStandardMaterial color="#a3b1bc" roughness={0.54} metalness={0.1} emissive={accent} emissiveIntensity={0.09} />
            </mesh>
            <mesh position={[side * 940, 342, 82]} rotation={[0, 0, side * 0.18]} castShadow={enableHeavyShadows} receiveShadow>
              <boxGeometry args={[360, 20, 28]} />
              <meshStandardMaterial color="#bfdbfe" roughness={0.42} metalness={0.14} emissive="#7dd3fc" emissiveIntensity={0.16} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 474, 0]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[1900, 56, 92]} />
          <meshStandardMaterial color="#aebbc5" roughness={0.5} metalness={0.1} emissive={accent} emissiveIntensity={0.11} />
        </mesh>
        <mesh position={[0, 414, -96]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[1640, 24, 34]} />
          <meshStandardMaterial color="#91c7da" roughness={0.42} metalness={0.14} emissive="#7dd3fc" emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[0, 414, 96]} castShadow={enableHeavyShadows} receiveShadow>
          <boxGeometry args={[1640, 24, 34]} />
          <meshStandardMaterial color="#91c7da" roughness={0.42} metalness={0.14} emissive="#7dd3fc" emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[0, 268, 0]} scale={[1.92, 0.64, 1]}>
          <torusGeometry args={[420, 7, 12, 96]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.38} metalness={0.16} emissive="#7dd3fc" emissiveIntensity={0.14} />
        </mesh>
        <mesh position={[0, 268, 0]} scale={[1.32, 0.44, 1]}>
          <torusGeometry args={[420, 4, 10, 96]} />
          <meshStandardMaterial color="#67e8f9" roughness={0.34} metalness={0.18} emissive="#67e8f9" emissiveIntensity={0.18} />
        </mesh>
      </group>
    </group>
  );
}

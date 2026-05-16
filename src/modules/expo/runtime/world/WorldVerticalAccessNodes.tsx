import { Text } from '@react-three/drei';
import type { ExpoVerticalAccessNode } from '../planning/types';

function isNodeActive(node: ExpoVerticalAccessNode, playerPosition: [number, number, number]) {
  const distanceXZ = Math.hypot(playerPosition[0] - node.position[0], playerPosition[2] - node.position[2]);
  const nodePlayerY = Math.max(5, node.position[1]);
  const distanceY = Math.abs(playerPosition[1] - nodePlayerY);
  return distanceXZ <= node.radius && distanceY <= Math.max(18, node.radius * 0.65);
}

function labelForNode(node: ExpoVerticalAccessNode) {
  const action = node.mode === 'ladder'
    ? 'LADDER'
    : node.mode === 'ramp'
      ? 'RAMP'
      : node.mode === 'stair'
        ? 'STAIR'
        : node.mode === 'jump-pad'
          ? 'JUMP'
          : 'LIFT';

  if (node.targetLevel === 'level-2') {
    return `${action}\nLEVEL 2`;
  }
  if (node.targetLevel === 'ground') {
    return `${action}\nGROUND`;
  }
  return `${action}\n${node.targetLevel.toUpperCase()}`;
}

function colorForNode(node: ExpoVerticalAccessNode, active: boolean) {
  if (active) {
    return '#67e8f9';
  }

  switch (node.mode) {
    case 'ladder':
      return '#fbbf24';
    case 'ramp':
    case 'stair':
      return '#a3e635';
    case 'jump-pad':
      return '#f472b6';
    case 'lift':
    default:
      return '#22d3ee';
  }
}

function isGeneratedPhysicsAccessNode(node: ExpoVerticalAccessNode) {
  return node.id.startsWith('physics-access-');
}

export function WorldVerticalAccessNodes({
  accessNodes,
  playerPosition,
}: {
  accessNodes: ExpoVerticalAccessNode[];
  playerPosition: [number, number, number];
}) {
  return (
    <group name="vertical-access-nodes">
      {accessNodes.map((node) => {
        const active = isNodeActive(node, playerPosition);
        const generatedPhysicsAccess = isGeneratedPhysicsAccessNode(node);
        const padRadius = Math.max(10, Math.min(18, node.radius * 0.42));
        const triggerRadius = Math.max(padRadius + 4, node.radius);
        const accent = colorForNode(node, active);

        return (
          <group
            key={node.id}
            name={`vertical-access-node:${node.id}`}
            position={node.position}
            userData={generatedPhysicsAccess ? { expoInspectionTransparent: true } : undefined}
          >
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[padRadius, padRadius, 0.16, 48]} />
              <meshStandardMaterial
                color={active ? '#dff9ff' : '#8fb7c4'}
                emissive={accent}
                emissiveIntensity={active ? 0.14 : 0.045}
                metalness={0.18}
                roughness={0.48}
              />
            </mesh>
            <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[triggerRadius, 0.72, 8, 72]} />
              <meshBasicMaterial
                color={accent}
                transparent
                opacity={active ? 0.38 : generatedPhysicsAccess ? 0.1 : 0.18}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, 8, 0]}>
              <cylinderGeometry args={[1.2, 1.2, 16, 18]} />
              <meshStandardMaterial
                color="#536673"
                emissive={accent}
                emissiveIntensity={active ? 0.08 : 0.035}
                roughness={0.58}
                metalness={0.12}
              />
            </mesh>
            {(!generatedPhysicsAccess || active) && (
              <Text
                anchorX="center"
                anchorY="middle"
                color="#f8fafc"
                fontSize={generatedPhysicsAccess ? 4.4 : 5.4}
                maxWidth={42}
                position={[0, 17.2, -padRadius - 4]}
              >
                {labelForNode(node)}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}

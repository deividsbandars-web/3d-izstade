import { Text } from '@react-three/drei';
import { SponsorTextureSurface } from '../booths';
import type { CanonicalPrimitive, CityScreenAssignment, CityScreenSocket } from '../planning/types';

function renderPrimitive(primitive: CanonicalPrimitive, key: string) {
  if (primitive.kind === 'plane') {
    return (
      <mesh key={key} position={primitive.position} rotation={primitive.rotation}>
        <planeGeometry args={primitive.size} />
        <meshBasicMaterial color={primitive.color} transparent={primitive.transparent} opacity={primitive.opacity} />
      </mesh>
    );
  }

  if (primitive.kind === 'texture-plane') {
    if (!primitive.url) {
      return (
        <mesh key={key} position={primitive.position}>
          <planeGeometry args={primitive.size} />
          <meshBasicMaterial color={primitive.fallbackColor} transparent opacity={primitive.opacity ?? 0.22} />
        </mesh>
      );
    }

    return (
      <mesh key={key} position={primitive.position}>
        <planeGeometry args={primitive.size} />
        <SponsorTextureSurface fallbackColor={primitive.fallbackColor} opacity={primitive.opacity ?? 0.92} url={primitive.url} />
      </mesh>
    );
  }

  if (primitive.kind === 'text') {
    return (
      <Text
        key={key}
        anchorX="center"
        anchorY="middle"
        color={primitive.color}
        fontSize={primitive.size}
        maxWidth={primitive.maxWidth}
        outlineBlur={primitive.outlineBlur}
        outlineColor={primitive.outlineColor}
        outlineWidth={primitive.outlineWidth}
        position={primitive.position}
      >
        {primitive.text}
      </Text>
    );
  }

  return null;
}

export function WorldCityScreenAssignments({
  assignments,
  playerPosition,
  sockets,
}: {
  assignments: CityScreenAssignment[];
  playerPosition: [number, number, number];
  sockets: CityScreenSocket[];
}) {
  const socketById = new Map(sockets.map((socket) => [socket.id, socket]));

  return (
    <group name="world-city-screen-assignments">
      {assignments.map((assignment) => {
        const socket = socketById.get(assignment.socketId);
        if (!socket) {
          return null;
        }

        const dx = socket.position[0] - playerPosition[0];
        const dz = socket.position[2] - playerPosition[2];
        const distanceSq = (dx * dx) + (dz * dz);
        const distance = Math.sqrt(distanceSq);
        const intent = assignment.renderIntent;
        const maxDistance = intent?.maxDistance ?? 980;
        if (distanceSq > maxDistance * maxDistance) {
          return null;
        }

        const detailDistance = intent?.detailDistance ?? 700;
        const subtitleDistance = intent?.subtitleDistance ?? 480;
        const detailMode = distance <= subtitleDistance ? 'near' : distance <= detailDistance ? 'mid' : 'far';
        const primitives = (intent?.primitives ?? []).filter((primitive) => {
          if (primitive.kind !== 'text') {
            return true;
          }

          if (primitive.text === assignment.subtitle) {
            return detailMode === 'near';
          }

          if (primitive.text === assignment.label) {
            return distance <= (intent?.showCenterTitleDistance ?? detailDistance);
          }

          if (primitive.text === assignment.tier.toUpperCase()) {
            return distance <= detailDistance;
          }

          return true;
        });

        return (
          <group key={assignment.id} name={`world-city-screen:${intent?.semanticMode ?? 'wayfinding'}:${assignment.id}`} position={socket.position} rotation={socket.rotation}>
            {primitives.map((primitive, index) => renderPrimitive(primitive, `${assignment.id}:${primitive.kind}:${index}`))}
          </group>
        );
      })}
    </group>
  );
}

import { Text } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackExpoScreenRouteClicked } from '../../lib/expoAnalytics';
import { SponsorTextureSurface } from '../booths';
import { resolveSponsorScreenInteraction } from '../../lib/sponsorScreenInteractionResolver';
import type { CanonicalPrimitive, CityScreenAssignment, CityScreenSocket } from '../planning/types';

function getHighlightedOpacity(opacity: number | undefined, fallback: number) {
  return Math.min(1, (opacity ?? fallback) + 0.12);
}

function renderPrimitive(primitive: CanonicalPrimitive, key: string, highlighted: boolean) {
  if (primitive.kind === 'plane') {
    return (
      <mesh key={key} position={primitive.position} rotation={primitive.rotation} renderOrder={8}>
        <planeGeometry args={primitive.size} />
        <meshBasicMaterial
          color={primitive.color}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
          transparent={primitive.transparent}
          opacity={highlighted ? getHighlightedOpacity(primitive.opacity, 1) : primitive.opacity}
          toneMapped={false}
        />
      </mesh>
    );
  }

  if (primitive.kind === 'texture-plane') {
    if (!primitive.url) {
      return (
        <mesh key={key} position={primitive.position} renderOrder={9}>
          <planeGeometry args={primitive.size} />
          <meshBasicMaterial
            color={primitive.fallbackColor}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-5}
            polygonOffsetUnits={-5}
            transparent
            opacity={highlighted ? getHighlightedOpacity(primitive.opacity, 0.22) : primitive.opacity ?? 0.22}
            toneMapped={false}
          />
        </mesh>
      );
    }

    return (
      <mesh key={key} position={primitive.position} renderOrder={9}>
        <planeGeometry args={primitive.size} />
        <SponsorTextureSurface
          fallbackColor={primitive.fallbackColor}
          opacity={highlighted ? getHighlightedOpacity(primitive.opacity, 0.92) : primitive.opacity ?? 0.92}
          url={primitive.url}
        />
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
        renderOrder={10}
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
  const navigate = useNavigate();
  const [hoveredAssignmentId, setHoveredAssignmentId] = useState<string | null>(null);
  const socketById = new Map(sockets.map((socket) => [socket.id, socket]));
  const operatorReviewEnabled =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('operator') === '1';

  useEffect(() => () => {
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'auto';
    }
  }, []);

  return (
    <group name="world-city-screen-assignments">
      {assignments.map((assignment) => {
        const socket = socketById.get(assignment.socketId);
        if (!socket) {
          return null;
        }

        const resolvedAction = resolveSponsorScreenInteraction({
          companyId: assignment.companyId,
          id: assignment.id,
          label: assignment.subtitle,
          title: assignment.label,
        });
        const isRouteAction = resolvedAction.kind === 'route';
        const isHighlighted = hoveredAssignmentId === assignment.id;

        const dx = socket.position[0] - playerPosition[0];
        const dz = socket.position[2] - playerPosition[2];
        const distanceSq = (dx * dx) + (dz * dz);
        const distance = Math.sqrt(distanceSq);
        const intent = assignment.renderIntent;
        const maxDistance = intent?.maxDistance ?? 980;
        if (!operatorReviewEnabled && distanceSq > maxDistance * maxDistance) {
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
          <group
            key={assignment.id}
            name={`world-city-screen:${intent?.semanticMode ?? 'wayfinding'}:${assignment.id}`}
            position={socket.position}
            rotation={socket.rotation}
            onClick={isRouteAction
              ? (event) => {
                  event.stopPropagation();
                  trackExpoScreenRouteClicked(
                    { id: resolvedAction.companyId },
                    {
                      route: resolvedAction.analytics.route,
                      screenActionKind: resolvedAction.analytics.actionKind,
                      screenAssignmentId: assignment.id,
                      screenLabel: resolvedAction.analytics.label,
                      screenSourceId: resolvedAction.analytics.sourceId,
                    },
                  );
                  navigate(resolvedAction.route);
                }
              : undefined}
            onPointerOver={isRouteAction
              ? () => {
                  setHoveredAssignmentId(assignment.id);
                  if (typeof document !== 'undefined') {
                    document.body.style.cursor = 'pointer';
                  }
                }
              : undefined}
            onPointerOut={isRouteAction
              ? () => {
                  setHoveredAssignmentId((current) => (current === assignment.id ? null : current));
                  if (typeof document !== 'undefined') {
                    document.body.style.cursor = 'auto';
                  }
                }
              : undefined}
          >
            {primitives.map((primitive, index) =>
              renderPrimitive(primitive, `${assignment.id}:${primitive.kind}:${index}`, isRouteAction && isHighlighted),
            )}
          </group>
        );
      })}
    </group>
  );
}

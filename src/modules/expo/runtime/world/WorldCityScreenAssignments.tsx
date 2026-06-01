import { Text } from '@react-three/drei';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackExpoScreenRouteClicked } from '../../lib/expoAnalytics';
import { SponsorTextureSurface } from '../booths';
import { resolveSponsorScreenInteraction } from '../../lib/sponsorScreenInteractionResolver';
import type { CanonicalPrimitive, CityScreenAssignment, CityScreenSocket } from '../planning/types';

function isOpaquePrimitive(opacity: number | undefined) {
  return (opacity ?? 1) >= 0.999;
}

function shouldCullDistantScreens() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('screenDistanceCulling') === '1';
}

function renderPrimitive(primitive: CanonicalPrimitive, key: string) {
  if (primitive.kind === 'plane') {
    const isOpaque = isOpaquePrimitive(primitive.opacity);
    const rearRotation: [number, number, number] = [
      primitive.rotation?.[0] ?? 0,
      (primitive.rotation?.[1] ?? 0) + Math.PI,
      primitive.rotation?.[2] ?? 0,
    ];
    return (
      <Fragment key={key}>
        <mesh key={`${key}:front`} position={primitive.position} rotation={primitive.rotation} renderOrder={8}>
          <planeGeometry args={primitive.size} />
          <meshBasicMaterial
            color={primitive.color}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
            transparent={primitive.transparent || !isOpaque}
            opacity={primitive.opacity}
            toneMapped={false}
          />
        </mesh>
        <mesh key={`${key}:rear`} position={primitive.position} rotation={rearRotation} renderOrder={8}>
          <planeGeometry args={primitive.size} />
          <meshBasicMaterial
            color={primitive.color}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
            transparent={primitive.transparent || !isOpaque}
            opacity={primitive.opacity}
            toneMapped={false}
          />
        </mesh>
      </Fragment>
    );
  }

  if (primitive.kind === 'texture-plane') {
    const isOpaque = isOpaquePrimitive(primitive.opacity);
    if (!primitive.url) {
      return (
        <Fragment key={key}>
          <mesh key={`${key}:front`} position={primitive.position} renderOrder={9}>
            <planeGeometry args={primitive.size} />
            <meshBasicMaterial
              color={primitive.fallbackColor}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-5}
              polygonOffsetUnits={-5}
              transparent={!isOpaque}
              opacity={primitive.opacity ?? 0.22}
              toneMapped={false}
            />
          </mesh>
          <mesh key={`${key}:rear`} position={primitive.position} rotation={[0, Math.PI, 0]} renderOrder={9}>
            <planeGeometry args={primitive.size} />
            <meshBasicMaterial
              color={primitive.fallbackColor}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-5}
              polygonOffsetUnits={-5}
              transparent={!isOpaque}
              opacity={primitive.opacity ?? 0.22}
              toneMapped={false}
            />
          </mesh>
        </Fragment>
      );
    }

    return (
      <Fragment key={key}>
        <mesh key={`${key}:front`} position={primitive.position} renderOrder={9}>
          <planeGeometry args={primitive.size} />
          <SponsorTextureSurface
            depthWrite={false}
            fallbackColor={primitive.fallbackColor}
            opacity={primitive.opacity ?? 0.92}
            url={primitive.url}
          />
        </mesh>
        <mesh key={`${key}:rear`} position={primitive.position} rotation={[0, Math.PI, 0]} renderOrder={9}>
          <planeGeometry args={primitive.size} />
          <SponsorTextureSurface
            depthWrite={false}
            fallbackColor={primitive.fallbackColor}
            opacity={primitive.opacity ?? 0.92}
            url={primitive.url}
          />
        </mesh>
      </Fragment>
    );
  }

  if (primitive.kind === 'text') {
    return (
      <Fragment key={key}>
        <Text
          key={`${key}:front`}
          anchorX="center"
          anchorY="middle"
          color={primitive.color}
          fontSize={primitive.size}
          maxWidth={primitive.maxWidth}
          outlineBlur={primitive.outlineBlur}
          outlineColor={primitive.outlineColor}
          outlineWidth={primitive.outlineWidth}
          position={[primitive.position[0], primitive.position[1], primitive.position[2] + 0.34]}
          renderOrder={30}
        >
          {primitive.text}
        </Text>
        <Text
          key={`${key}:rear`}
          anchorX="center"
          anchorY="middle"
          color={primitive.color}
          fontSize={primitive.size}
          maxWidth={primitive.maxWidth}
          outlineBlur={primitive.outlineBlur}
          outlineColor={primitive.outlineColor}
          outlineWidth={primitive.outlineWidth}
          position={[primitive.position[0], primitive.position[1], primitive.position[2] - 0.34]}
          rotation={[0, Math.PI, 0]}
          renderOrder={30}
        >
          {primitive.text}
        </Text>
      </Fragment>
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
  const socketById = new Map(sockets.map((socket) => [socket.id, socket]));
  const cullDistantScreens = shouldCullDistantScreens();

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

        const dx = socket.position[0] - playerPosition[0];
        const dz = socket.position[2] - playerPosition[2];
        const distanceSq = (dx * dx) + (dz * dz);
        const distance = Math.sqrt(distanceSq);
        const intent = assignment.renderIntent;
        const maxDistance = intent?.maxDistance ?? 980;
        if (cullDistantScreens && distanceSq > maxDistance * maxDistance) {
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
          >
            {primitives.map((primitive, index) =>
              renderPrimitive(primitive, `${assignment.id}:${primitive.kind}:${index}`),
            )}
          </group>
        );
      })}
    </group>
  );
}

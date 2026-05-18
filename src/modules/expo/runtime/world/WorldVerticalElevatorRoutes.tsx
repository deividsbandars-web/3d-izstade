import { useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { ExpoVerticalElevatorRoute } from '../planning/types';
import {
  buildElevatorRouteSegments,
  getElevatorRouteTotalLength,
  resolveElevatorRoutePosition,
} from '../planning/vertical/elevatorRouteMotion';

function WorldVerticalElevatorRouteVisual({ route }: { route: ExpoVerticalElevatorRoute }) {
  const cabinRef = useRef<Group>(null);
  const segments = useMemo(() => buildElevatorRouteSegments(route.waypoints), [route.waypoints]);
  const totalLength = useMemo(() => getElevatorRouteTotalLength(segments), [segments]);
  const fallbackPosition = route.waypoints[0] ?? [0, 0, 0];

  useFrame((state) => {
    const position = resolveElevatorRoutePosition({
      elapsedTime: state.clock.getElapsedTime(),
      fallbackPosition,
      route,
      segments,
      totalLength,
    });
    cabinRef.current?.position.set(position[0], position[1], position[2]);
  });

  return (
    <group name={`vertical-elevator-route:${route.id}`}>
      {segments.map((segment, index) => (
        <group key={`${route.id}:shaft:${index}`} position={segment.midpoint}>
          {[-route.railSpacing * 0.5, route.railSpacing * 0.5].map((railOffsetX) => (
            <mesh key={`${route.id}:rail:${index}:${railOffsetX}`} position={[railOffsetX, 0, 0]}>
              <boxGeometry args={[3.6, Math.max(4, segment.verticalHeight), 3.6]} />
              <meshStandardMaterial
                color="#bdefff"
                emissive={route.accentColor}
                emissiveIntensity={0.08}
                metalness={0.34}
                roughness={0.3}
              />
            </mesh>
          ))}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[route.railSpacing + 8, Math.max(4, segment.verticalHeight), 1.4]} />
            <meshBasicMaterial
              color={route.accentColor}
              depthWrite={false}
              opacity={0.12}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {route.waypoints.map((station, index) => (
        <group key={`${route.id}:station:${index}`} position={station}>
          <mesh position={[0, -route.cabinSize[1] * 0.56, 0]}>
            <boxGeometry args={route.stationSize} />
            <meshStandardMaterial
              color="#6f8796"
              emissive={route.accentColor}
              emissiveIntensity={0.035}
              metalness={0.18}
              roughness={0.42}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[route.railSpacing * 0.82, 1.4, 8, 64]} />
            <meshBasicMaterial
              color={route.accentColor}
              depthWrite={false}
              opacity={0.32}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      <group ref={cabinRef} name={`vertical-elevator-cabin:${route.id}`} position={fallbackPosition}>
        <mesh>
          <boxGeometry args={route.cabinSize} />
          <meshStandardMaterial
            color="#c7f7ff"
            emissive={route.accentColor}
            emissiveIntensity={0.18}
            metalness={0.24}
            opacity={0.94}
            roughness={0.22}
            transparent
          />
        </mesh>
        <mesh position={[0, (route.rideable?.floorPlayerOffsetY ?? ((route.cabinSize[1] * -0.5) + 12)) - 8, 0]}>
          <boxGeometry args={[route.cabinSize[0] * 0.96, 7.5, route.cabinSize[2] * 0.96]} />
          <meshStandardMaterial
            color="#17242c"
            emissive={route.accentColor}
            emissiveIntensity={0.08}
            metalness={0.22}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 0, route.cabinSize[2] * 0.52]}>
          <boxGeometry args={[route.cabinSize[0] * 0.74, route.cabinSize[1] * 0.7, 1.8]} />
          <meshBasicMaterial
            color="#ecfeff"
            depthWrite={false}
            opacity={0.34}
            transparent
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, route.cabinSize[1] * 0.55, 0]}>
          <boxGeometry args={[route.cabinSize[0] * 1.08, 4, route.cabinSize[2] * 1.08]} />
          <meshStandardMaterial
            color="#a5f3fc"
            emissive={route.accentColor}
            emissiveIntensity={0.22}
            metalness={0.3}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, -route.cabinSize[1] * 0.55, 0]}>
          <boxGeometry args={[route.cabinSize[0] * 1.08, 4, route.cabinSize[2] * 1.08]} />
          <meshStandardMaterial
            color="#78c8dd"
            emissive={route.accentColor}
            emissiveIntensity={0.12}
            metalness={0.28}
            roughness={0.32}
          />
        </mesh>
        <Text
          anchorX="center"
          anchorY="middle"
          color="#001018"
          fontSize={9}
          position={[0, -route.cabinSize[1] * 0.08, route.cabinSize[2] * 0.57]}
        >
          LIFT
        </Text>
      </group>
    </group>
  );
}

export function WorldVerticalElevatorRoutes({
  routes,
}: {
  routes: ExpoVerticalElevatorRoute[];
}) {
  if (routes.length === 0) {
    return null;
  }

  return (
    <group name="vertical-elevator-routes">
      {routes.map((route) => (
        <WorldVerticalElevatorRouteVisual key={route.id} route={route} />
      ))}
    </group>
  );
}

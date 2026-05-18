import { useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { ExpoVerticalElevatorRoute } from '../planning/types';

type RouteSegment = {
  end: [number, number, number];
  length: number;
  midpoint: [number, number, number];
  start: [number, number, number];
  verticalHeight: number;
};

function distance3d(start: [number, number, number], end: [number, number, number]) {
  return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}

function buildRouteSegments(waypoints: [number, number, number][]): RouteSegment[] {
  return waypoints.slice(0, -1).map((start, index) => {
    const end = waypoints[index + 1];

    return {
      end,
      length: distance3d(start, end),
      midpoint: [
        (start[0] + end[0]) * 0.5,
        (start[1] + end[1]) * 0.5,
        (start[2] + end[2]) * 0.5,
      ],
      start,
      verticalHeight: Math.abs(end[1] - start[1]),
    };
  });
}

function pingPong(progress: number) {
  return progress < 0.5
    ? progress * 2
    : (1 - progress) * 2;
}

function easeInOutSine(progress: number) {
  return 0.5 - (Math.cos(progress * Math.PI) * 0.5);
}

function sampleRoutePosition(
  segments: RouteSegment[],
  totalLength: number,
  fallback: [number, number, number],
  progress: number,
): [number, number, number] {
  if (segments.length === 0 || totalLength <= 0) {
    return fallback;
  }

  let remainingDistance = totalLength * progress;
  for (const segment of segments) {
    if (remainingDistance > segment.length) {
      remainingDistance -= segment.length;
      continue;
    }

    const localProgress = segment.length <= 0 ? 0 : remainingDistance / segment.length;
    return [
      segment.start[0] + ((segment.end[0] - segment.start[0]) * localProgress),
      segment.start[1] + ((segment.end[1] - segment.start[1]) * localProgress),
      segment.start[2] + ((segment.end[2] - segment.start[2]) * localProgress),
    ];
  }

  return segments[segments.length - 1].end;
}

function WorldVerticalElevatorRouteVisual({ route }: { route: ExpoVerticalElevatorRoute }) {
  const cabinRef = useRef<Group>(null);
  const segments = useMemo(() => buildRouteSegments(route.waypoints), [route.waypoints]);
  const totalLength = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.length, 0),
    [segments],
  );
  const fallbackPosition = route.waypoints[0] ?? [0, 0, 0];

  useFrame((state) => {
    const cycle = Math.max(6, route.cycleSeconds);
    const rawProgress = ((state.clock.getElapsedTime() / cycle) + route.phase) % 1;
    const progress = easeInOutSine(pingPong(rawProgress));
    const position = sampleRoutePosition(segments, totalLength, fallbackPosition, progress);
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
            color="#dff9ff"
            emissive={route.accentColor}
            emissiveIntensity={0.18}
            metalness={0.24}
            opacity={0.78}
            roughness={0.22}
            transparent
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

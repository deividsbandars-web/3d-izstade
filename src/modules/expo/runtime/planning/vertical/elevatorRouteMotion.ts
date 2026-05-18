import type { ExpoVerticalElevatorRoute } from './verticalCitySystem';

export type ExpoVerticalElevatorRouteSegment = {
  end: [number, number, number];
  length: number;
  midpoint: [number, number, number];
  start: [number, number, number];
  verticalHeight: number;
};

function distance3d(start: [number, number, number], end: [number, number, number]) {
  return Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
}

function pingPong(progress: number) {
  return progress < 0.5
    ? progress * 2
    : (1 - progress) * 2;
}

function easeInOutSine(progress: number) {
  return 0.5 - (Math.cos(progress * Math.PI) * 0.5);
}

export function buildElevatorRouteSegments(waypoints: [number, number, number][]): ExpoVerticalElevatorRouteSegment[] {
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

export function getElevatorRouteTotalLength(segments: ExpoVerticalElevatorRouteSegment[]) {
  return segments.reduce((sum, segment) => sum + segment.length, 0);
}

export function sampleElevatorRoutePosition(
  segments: ExpoVerticalElevatorRouteSegment[],
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

export function resolveElevatorRoutePosition(args: {
  elapsedTime: number;
  fallbackPosition: [number, number, number];
  route: ExpoVerticalElevatorRoute;
  segments: ExpoVerticalElevatorRouteSegment[];
  totalLength: number;
}) {
  const cycle = Math.max(6, args.route.cycleSeconds);
  const rawProgress = ((args.elapsedTime / cycle) + args.route.phase) % 1;
  const progress = easeInOutSine(pingPong(rawProgress));

  return sampleElevatorRoutePosition(
    args.segments,
    args.totalLength,
    args.fallbackPosition,
    progress,
  );
}

export function resolveElevatorRideablePlayerY(route: ExpoVerticalElevatorRoute, cabinCenterY: number) {
  const floorPlayerOffsetY = route.rideable?.floorPlayerOffsetY
    ?? ((route.cabinSize[1] * -0.5) + 12);

  return cabinCenterY + floorPlayerOffsetY;
}

export function resolveElevatorRideableFootprint(route: ExpoVerticalElevatorRoute): [number, number] {
  return route.rideable?.footprintSize ?? [
    route.cabinSize[0] * 0.86,
    route.cabinSize[2] * 0.86,
  ];
}

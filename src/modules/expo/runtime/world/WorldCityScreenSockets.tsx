import type { CityScreenSocket } from '../planning/types';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

export function WorldCityScreenSockets({
  playerPosition: _playerPosition,
  sockets: _sockets,
  stadiumReserve: _stadiumReserve,
}: {
  playerPosition: [number, number, number];
  sockets: CityScreenSocket[];
  stadiumReserve: StadiumReserve;
}) {
  void _playerPosition;
  void _sockets;
  void _stadiumReserve;

  // Screen sockets remain the logical anchor layer for assignments,
  // diagnostics, and review tooling, but no longer render as a second
  // visible frame. The visible construction now belongs to the surface
  // assembly so city screens read as one mounted object instead of two
  // overlapping frames.
  return null;
}

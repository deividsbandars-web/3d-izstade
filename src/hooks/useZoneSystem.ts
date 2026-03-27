import { useMemo } from "react";
import { ZoneSystem, type Zone } from "../modules/city/ZoneSystem";

const zoneSystem = new ZoneSystem();

export function useZoneSystem(playerPos: [number, number, number]) {
  const activeZone = useMemo<Zone | null>(
    () => zoneSystem.getActiveZone(playerPos) ?? null,
    [playerPos]
  );

  return {
    activeZone,
    removeZonesByPrefix: zoneSystem.removeZonesByPrefix.bind(zoneSystem),
    replaceZonesByPrefix: zoneSystem.replaceZonesByPrefix.bind(zoneSystem),
    zoneSystem,
  };
}

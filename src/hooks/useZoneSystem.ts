import { useEffect, useState } from "react";
import { ZoneSystem, type Zone } from "../modules/city/ZoneSystem";

const zoneSystem = new ZoneSystem();

export function useZoneSystem(playerPos: [number, number, number]) {
  const [activeZone, setActiveZone] = useState<Zone | null>(null);

  useEffect(() => {
    const zone = zoneSystem.getActiveZone(playerPos);
    setActiveZone(zone || null);
  }, [playerPos]);

  return {
    activeZone,
    zoneSystem,
  };
}

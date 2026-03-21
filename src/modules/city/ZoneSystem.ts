export type ZoneType = "web" | "pixelstream";

export interface Zone {
  id: string;
  type: ZoneType;
  position: [number, number, number];
  radius: number;
  streamId?: string;
}

export class ZoneSystem {
  zones: Zone[] = [];

  addZone(zone: Zone) {
    this.zones.push(zone);
  }

  getZones() {
    return this.zones;
  }

  getActiveZone(playerPos: [number, number, number]) {
    return this.zones.find((zone) => {
      const dx = playerPos[0] - zone.position[0];
      const dz = playerPos[2] - zone.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      return dist < zone.radius;
    });
  }
}

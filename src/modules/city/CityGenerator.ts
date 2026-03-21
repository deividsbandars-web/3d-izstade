import * as THREE from "three";
import type { ProcessedAsset, AssetType } from "../../utils/proAssetPipeline";
import { ZoneSystem } from "./ZoneSystem";

type CityConfig = {
  gridSize: number;
  spacing: number;
};

export class CityGenerator {
  scene: THREE.Scene;
  objects: ProcessedAsset[];
  zoneSystem: ZoneSystem | null;
  occupied: Set<string> = new Set();

  constructor(scene: THREE.Scene, objects: ProcessedAsset[], zoneSystem: ZoneSystem | null = null) {
    this.scene = scene;
    this.objects = objects;
    this.zoneSystem = zoneSystem;
  }

  private key(x: number, z: number) { return `${x}_${z}`; }
  private isOccupied(x: number, z: number) { return this.occupied.has(this.key(x, z)); }
  private markOccupied(x: number, z: number) { this.occupied.add(this.key(x, z)); }

  getRandomByType(type: AssetType): ProcessedAsset | undefined {
    const filtered = this.objects.filter(o => o.type === type);
    if (filtered.length === 0) return undefined;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  private isRoadZone(x: number, z: number) {
    return (x % 4 === 0) || (z % 4 === 0);
  }

  generate(config: CityConfig) {
    const { gridSize, spacing } = config;

    for (let x = -gridSize; x < gridSize; x++) {
      for (let z = -gridSize; z < gridSize; z++) {
        if (this.isOccupied(x, z)) continue;

        let posX = x * spacing;
        let posZ = z * spacing;
        const isRoad = this.isRoadZone(x, z);

        let targetType: AssetType;

        // 🚀 PRO DISTRIBUTION LOGIC
        if (isRoad) {
           targetType = "road";
        } else {
           const r = Math.random();
           if (r < 0.6) targetType = "building";
           else if (r < 0.85) targetType = "booth";
           else if (r < 0.95) targetType = "nature";
           else targetType = "landmark";
        }

        const obj = this.getRandomByType(targetType);
        if (!obj && isRoad) { this.markOccupied(x, z); continue; }
        if (!obj) continue;

        // 🚀 SAFE CLONE (Mēs izdarīsim šo vēlāk Expo3D ar SkeletonUtils, te paņemam reference)
        const clone = obj.object.clone();

        // 🚀 MICRO OFFSET (Visual killer fix)
        if (targetType !== "road") {
          posX += (Math.random() - 0.5) * 1.5;
          posZ += (Math.random() - 0.5) * 1.5;
        }

        // 🚀 STRICT ROTATION LOGIC
        const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        if (targetType === "nature") {
           clone.rotation.y = Math.random() * Math.PI * 2;
           clone.scale.multiplyScalar(0.8 + Math.random() * 0.4);
        } else {
           clone.rotation.y = rotations[Math.floor(Math.random() * 4)];
           if (targetType === "building" || targetType === "landmark" || targetType === "booth") {
              clone.scale.y *= (0.8 + Math.random() * 0.6); 
           }
        }

        clone.position.set(posX, 0, posZ);

        // 🚀 PERFORMANCE GOLD
        clone.matrixAutoUpdate = false;
        clone.updateMatrix();

        this.scene.add(clone);
        this.markOccupied(x, z);

        // 🚀 AUTO ZONE BINDING
        if (targetType === "booth" && this.zoneSystem) {
          this.zoneSystem.addZone({
            id: `booth_${x}_${z}`,
            type: "pixelstream",
            position: [posX, 0, posZ],
            radius: 8, // Lielāks rādiuss, lai vieglāk trāpīt
            streamId: `stream_${x}_${z}`
          });
        }
      }
    }
  }
}
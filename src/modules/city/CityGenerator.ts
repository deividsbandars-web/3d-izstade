import * as THREE from "three";
import type { ProcessedAsset, AssetType } from "../../utils/proAssetPipeline";
import { ZoneSystem } from "./ZoneSystem";
import { InstancedCityLayer } from "./InstancedCityLayer";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

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

    // 🧠 1. INSTANCE GROUPING LOGIC (Krātuve masveida renderēšanai)
    const instanceGroups: Record<string, any[]> = {};

    for (let x = -gridSize; x < gridSize; x++) {
      for (let z = -gridSize; z < gridSize; z++) {
        if (this.isOccupied(x, z)) continue;

        let posX = x * spacing;
        let posZ = z * spacing;
        const isRoad = this.isRoadZone(x, z);

        let targetType: AssetType;

        // PRO DISTRIBUTION LOGIC
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

        // MICRO OFFSET (Visual killer fix)
        if (targetType !== "road") {
          posX += (Math.random() - 0.5) * 1.5;
          posZ += (Math.random() - 0.5) * 1.5;
        }

        // CALCULATE TRANSFORMS
        let rotY = 0;
        let scaleVec = new THREE.Vector3(1, 1, 1);
        
        const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        
        if (targetType === "nature") {
           rotY = Math.random() * Math.PI * 2;
           const s = 0.8 + Math.random() * 0.4;
           scaleVec.set(s, s, s);
        } else {
           rotY = rotations[Math.floor(Math.random() * 4)];
           if (targetType === "building" || targetType === "landmark" || targetType === "booth") {
              scaleVec.y = 0.8 + Math.random() * 0.6; 
           }
        }

        // 🧠 2. SORTING: INSTANCED vs CLONED
        // Masveida objekti iet uz Instancing (1 draw call)
        if (targetType === "building" || targetType === "road" || targetType === "nature") {
          if (!instanceGroups[obj.id]) instanceGroups[obj.id] = [];
          
          instanceGroups[obj.id].push({
            position: [posX, 0, posZ],
            rotation: rotY,
            scaleVec: scaleVec,
            baseData: obj // Saglabājam datus priekš Raycast Click support
          });
          
          this.markOccupied(x, z);
          continue; // Pārejam pie nākamā, NEPievienojot scene!
        }

        // Interaktīvie objekti paliek kā Clones (individuāla loģika)
        if (targetType === "booth" || targetType === "landmark") {
          const clone = SkeletonUtils.clone(obj.object);
          
          clone.position.set(posX, 0, posZ);
          clone.rotation.y = rotY;
          clone.scale.copy(scaleVec);

          // PERFORMANCE BOOST
          clone.matrixAutoUpdate = false;
          clone.updateMatrix();

          this.scene.add(clone);
          this.markOccupied(x, z);

          // AUTO ZONE BINDING
          if (targetType === "booth" && this.zoneSystem) {
            this.zoneSystem.addZone({
              id: `booth_${x}_${z}`,
              type: "pixelstream",
              position: [posX, 0, posZ],
              radius: 8,
              streamId: `stream_${x}_${z}`
            });
          }
        }
      }
    }

    // 🏗️ 3. BUILD INSTANCED MESHES (Pēc galvenā cikla)
    const instancer = new InstancedCityLayer(this.scene);

    Object.entries(instanceGroups).forEach(([key, items]) => {
      const baseObj = this.objects.find(o => o.id === key);
      if (!baseObj) return;

      // Atrodam pirmo derīgo Mesh no bāzes objekta
      let mesh: THREE.Mesh | null = null;
      baseObj.object.traverse((child: any) => {
        if (child.isMesh && !mesh) mesh = child;
      });

      if (!mesh) return;

      const instanced = instancer.createInstanceGroup(key, mesh, items.length);
      
      // 🎯 CLICK SUPPORT (Pro Workaround)
      // Saglabājam instance datus, lai Raycaster varētu pateikt, kurš konkrēti ir uzklikšķināts
      instanced.userData.instances = items;

      items.forEach((item, i) => {
        instancer.setInstance(
          instanced,
          i,
          new THREE.Vector3(...item.position),
          item.rotation,
          item.scaleVec
        );
      });

      instancer.finalize(instanced);
    });
    
    console.log(`[Instancing] Compressed ${Object.keys(instanceGroups).length} heavy asset groups into single draw calls.`);
  }
}

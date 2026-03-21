import * as THREE from 'three';
import { normalizeModel } from './threeUtils';

interface ValidationOptions {
  autoFix?: boolean;
  targetSize?: number;
}

/**
 * Smart Model Validator & Optimizer
 * Analyzes GLTF models for production readiness, performance bottlenecks, and geometric alignment.
 */
export const validateModel = (scene: THREE.Object3D, options: ValidationOptions = {}) => {
  const { autoFix = false, targetSize = 20 } = options;

  // Ensure matrix world is calculated for accurate bounding box
  scene.updateMatrixWorld(true);

  const getBoxData = (obj: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { box, size, center, position: obj.position.clone() };
  };

  const before = getBoxData(scene);
  
  // Metrics accumulation
  let vertexCount = 0;
  let meshCount = 0;
  let hasUnbakedRotation = false;
  const textures = new Set<THREE.Texture>();

  scene.traverse((child) => {
    // 1. Mesh & Vertex Counting
    if ((child as THREE.Mesh).isMesh) {
      meshCount++;
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry;
      if (geometry.attributes.position) {
        vertexCount += geometry.attributes.position.count;
      }

      // 2. Texture Analysis
      const material = mesh.material as any;
      if (material) {
        const matArray = Array.isArray(material) ? material : [material];
        matArray.forEach((m) => {
          // Check all properties for textures (map, normalMap, roughnessMap, etc.)
          Object.keys(m).forEach((key) => {
            if (m[key] && (m[key] as THREE.Texture).isTexture) {
              textures.add(m[key]);
            }
          });
        });
      }
    }

    // 3. Rotation Check (Unbaked rotations)
    if (child.rotation.x !== 0 || child.rotation.y !== 0 || child.rotation.z !== 0) {
      hasUnbakedRotation = true;
    }
  });

  const results = {
    isValid: true,
    warnings: [] as string[],
    performance: {
      vertices: vertexCount,
      textures: textures.size,
      meshes: meshCount
    }
  };

  console.group(`[Smart Validator] ${scene.name || 'Unnamed Asset'}`);

  // --- PERFORMANCE VALIDATION ---
  if (vertexCount > 300000) {
    console.warn(`⚠️ HIGH POLYGON COUNT: ${vertexCount.toLocaleString()} vertices. Optimal is < 100k.`);
    results.warnings.push("PERF_HIGH_POLY");
  }

  if (textures.size > 10) {
    console.warn(`⚠️ HIGH TEXTURE COUNT: ${textures.size} unique textures. Consider atlas or shared materials.`);
    results.warnings.push("PERF_HIGH_TEXTURE_COUNT");
  }

  // --- GEOMETRIC VALIDATION ---
  
  // Check for Mesh Existence
  if (meshCount === 0) {
    console.error("❌ INVALID MODEL: No meshes found in hierarchy.");
    results.warnings.push("GEO_NO_MESHES");
    results.isValid = false;
  }

  // Pivot Check (Horizontal)
  if (Math.abs(before.center.x) > 0.1 || Math.abs(before.center.z) > 0.1) {
    console.warn("⚠️ MODEL NOT CENTERED");
    results.warnings.push("GEO_NOT_CENTERED");
    results.isValid = false;
  }

  // Grounding Check (Vertical)
  if (Math.abs(before.box.min.y) > 0.05) {
    console.warn("⚠️ MODEL NOT GROUNDED (Y=0)");
    results.warnings.push("GEO_NOT_GROUNDED");
    results.isValid = false;
  }

  // Rotation Check
  if (hasUnbakedRotation) {
    console.warn("⚠️ MODEL HAS UNBAKED ROTATIONS (Traverse detected non-zero rotations)");
    results.warnings.push("GEO_UNBAKED_ROTATION");
  }

  // Scale Check
  const maxDim = Math.max(before.size.x, before.size.y, before.size.z);
  if (maxDim > 500 || maxDim < 0.1) {
    console.warn(`⚠️ EXTREME SCALE: ${maxDim.toFixed(2)}m. Expected range 0.1m - 500m.`);
    results.warnings.push("GEO_EXTREME_SCALE");
    results.isValid = false;
  }

  // --- AUTO-FIX LOGIC ---
  if (autoFix && !results.isValid) {
    console.log("🔧 autoFix is TRUE. Normalizing model...");
    normalizeModel(scene, targetSize);
    
    // Refresh data for comparison
    scene.updateMatrixWorld(true);
    const after = getBoxData(scene);

    console.log("📊 COMPARISON (BEFORE vs AFTER):");
    console.table({
      "Metric": ["Bounding Box Size", "Center (X, Z)", "Min Y (Ground)", "Position Y"],
      "BEFORE": [
        `${before.size.x.toFixed(2)}, ${before.size.y.toFixed(2)}, ${before.size.z.toFixed(2)}`,
        `${before.center.x.toFixed(2)}, ${before.center.z.toFixed(2)}`,
        before.box.min.y.toFixed(2),
        before.position.y.toFixed(2)
      ],
      "AFTER": [
        `${after.size.x.toFixed(2)}, ${after.size.y.toFixed(2)}, ${after.size.z.toFixed(2)}`,
        `${after.center.x.toFixed(2)}, ${after.center.z.toFixed(2)}`,
        after.box.min.y.toFixed(2),
        after.position.y.toFixed(2)
      ]
    });
  } else if (!results.isValid) {
    console.log("💡 Suggestion: Call validateModel(scene, { autoFix: true }) to fix geometric alignment.");
  }

  console.groupEnd();
  return results;
};

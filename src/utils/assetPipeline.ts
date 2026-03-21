import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { validateModel } from './modelValidator';

interface PipelineOptions {
  autoFix?: boolean;
  targetSize?: number;
  lowPrecision?: boolean;
  optimizeGeometry?: boolean;
}

// Global cache to prevent redundant network requests and parsing
const modelCache = new Map<string, Promise<THREE.Group>>();
const gltfLoader = new GLTFLoader();

/**
 * Advanced 3D Asset Pipeline
 * Standardizes model loading, validation, and production-grade optimization.
 */
export const assetPipeline = {
  /**
   * Loads a model from URL with caching and optimization.
   */
  loadModel: async (url: string, options: PipelineOptions = {}): Promise<THREE.Group> => {
    const { 
      autoFix = true, 
      targetSize = 20, 
      lowPrecision = false,
      optimizeGeometry = true 
    } = options;

    // Return from cache if available
    if (modelCache.has(url)) {
      console.log(`[Pipeline] Cache hit for: ${url}`);
      const cachedScene = await modelCache.get(url)!;
      return cachedScene.clone(); // Clone to prevent shared state issues
    }

    const loadPromise = new Promise<THREE.Group>((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf: any) => {
          const scene = gltf.scene as THREE.Group;

          // 1. Validation Phase
          validateModel(scene, { autoFix, targetSize });

          // 2. Deep Optimization Phase
          scene.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;

              // --- Geometry Optimization ---
              if (optimizeGeometry && mesh.geometry) {
                const originalVertexCount = mesh.geometry.attributes.position?.count || 0;
                
                // Deduplicate vertices to reduce memory and indexing overhead
                mesh.geometry = BufferGeometryUtils.mergeVertices(mesh.geometry);
                
                const newVertexCount = mesh.geometry.attributes.position?.count || 0;
                if (newVertexCount < originalVertexCount) {
                  console.log(`[Pipeline Opt] Optimized ${mesh.name}: Merged ${originalVertexCount - newVertexCount} duplicate vertices.`);
                }
              }

              // --- Texture & Material Optimization ---
              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat: any) => {
                  if (lowPrecision) mat.precision = 'lowp';
                  
                  // Scan materials for unoptimized textures
                  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'].forEach(texKey => {
                    const texture = mat[texKey] as THREE.Texture;
                    if (texture && texture.isTexture) {
                      // Check for extreme resolutions
                      const image = texture.image as HTMLImageElement;
                      if (image && typeof image.width === 'number') {
                        if (image.width > 2048 || image.height > 2048) {
                          console.warn(`[Pipeline Warning] Asset [${url}] uses large texture: ${image.width}x${image.height} in ${texKey}. Target < 2048px.`);
                        }
                      }

                      texture.anisotropy = 1;
                      texture.minFilter = THREE.LinearMipmapLinearFilter;
                    }
                  });
                });
              }

              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          console.log(`[Pipeline] Processed asset: ${url}`);
          resolve(scene);
        },
        (xhr: ProgressEvent) => {
          const percent = (xhr.loaded / xhr.total) * 100;
          if (percent < 100) console.log(`[Pipeline] Progress [${url}]: ${percent.toFixed(0)}%`);
        },
        (error: any) => {
          console.error(`[Pipeline Error] Failed to load ${url}`, error);
          reject(error);
        }
      );
    });

    modelCache.set(url, loadPromise);
    return loadPromise;
  },

  /**
   * Manual processing for already loaded scenes.
   */
  processScene: (scene: THREE.Object3D, options: PipelineOptions = {}) => {
    const { autoFix = true, targetSize = 20 } = options;
    validateModel(scene, { autoFix, targetSize });
    return scene;
  },

  /**
   * Clears the asset cache
   */
  clearCache: () => {
    modelCache.clear();
    console.log(`[Pipeline] Asset cache cleared.`);
  }
};

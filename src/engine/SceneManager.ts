import * as THREE from 'three';
import { assetPipeline } from '../utils/assetPipeline';

interface SceneObject {
  id: string;
  url: string;
  object: THREE.Object3D;
  boxHelper?: THREE.BoxHelper;
}

interface AddObjectOptions {
  id?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  targetSize?: number;
  snapToGrid?: boolean;
  gridSize?: number;
}

/**
 * SceneManager
 * Central authority for object tracking, placement, and scene-wide debugging.
 */
export class SceneManager {
  private scene: THREE.Scene;
  private registry: Map<string, SceneObject> = new Map();
  private debugMode: boolean = false;
  private axesHelper?: THREE.AxesHelper;
  private gridHelper?: THREE.GridHelper;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Loads and adds an object to the scene with normalization and tracking.
   */
  async addObject(url: string, options: AddObjectOptions = {}): Promise<THREE.Object3D> {
    const {
      id = Math.random().toString(36).substring(7),
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      targetSize = 20,
      snapToGrid = false,
      gridSize = 1
    } = options;

    // Load through pipeline
    const model = await assetPipeline.loadModel(url, { targetSize });
    
    // Assign ID and metadata
    model.name = id;
    
    // Apply transformations
    model.scale.multiplyScalar(scale);
    model.rotation.set(rotation[0], rotation[1], rotation[2]);
    model.position.set(position[0], position[1], position[2]);

    if (snapToGrid) {
      this.applyGridSnapping(model, gridSize);
    }

    // Add to registry
    const sceneObject: SceneObject = {
      id,
      url,
      object: model
    };

    if (this.debugMode) {
      const helper = new THREE.BoxHelper(model, 0xffff00);
      sceneObject.boxHelper = helper;
      this.scene.add(helper);
    }

    this.registry.set(id, sceneObject);
    this.scene.add(model);

    console.log(`[SceneManager] Added object ${id} from ${url}`);
    return model;
  }

  /**
   * Snaps an object to the grid and ensures grounding.
   */
  private applyGridSnapping(object: THREE.Object3D, gridSize: number) {
    object.position.x = Math.round(object.position.x / gridSize) * gridSize;
    object.position.z = Math.round(object.position.z / gridSize) * gridSize;
    // Y remains 0 as normalizeModel grounds it, but we can force it here
    object.position.y = 0; 
  }

  /**
   * Toggles debug helpers for all registered objects.
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;

    // Toggle axes and grid
    if (enabled) {
      if (!this.axesHelper) this.axesHelper = new THREE.AxesHelper(50);
      if (!this.gridHelper) this.gridHelper = new THREE.GridHelper(200, 20);
      this.scene.add(this.axesHelper);
      this.scene.add(this.gridHelper);
    } else {
      if (this.axesHelper) this.scene.remove(this.axesHelper);
      if (this.gridHelper) this.scene.remove(this.gridHelper);
    }

    // Toggle bounding boxes
    this.registry.forEach((item) => {
      if (enabled) {
        if (!item.boxHelper) {
          item.boxHelper = new THREE.BoxHelper(item.object, 0xffff00);
        }
        this.scene.add(item.boxHelper);
      } else if (item.boxHelper) {
        this.scene.remove(item.boxHelper);
      }
    });
  }

  /**
   * Removes an object from the scene and registry.
   */
  removeObject(id: string) {
    const item = this.registry.get(id);
    if (item) {
      this.scene.remove(item.object);
      if (item.boxHelper) this.scene.remove(item.boxHelper);
      this.registry.delete(id);
      console.log(`[SceneManager] Removed object: ${id}`);
    }
  }

  /**
   * Returns an object by its registry ID.
   */
  getObject(id: string) {
    return this.registry.get(id)?.object;
  }

  /**
   * Updates all debug helpers (useful if objects moved).
   */
  updateHelpers() {
    if (!this.debugMode) return;
    this.registry.forEach((item) => {
      if (item.boxHelper) item.boxHelper.update();
    });
  }
}

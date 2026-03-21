import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { SceneManager } from './SceneManager';

interface SceneLayoutItem {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/**
 * EditorSystem
 * Extends the scene with interactive manipulation, selection, and persistence logic.
 */
export class EditorSystem {
  private sceneManager: SceneManager;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private transformControls: TransformControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  public selectedId: string | null = null;
  public snapEnabled: boolean = false;
  public gridSize: number = 1;

  constructor(sceneManager: SceneManager, camera: THREE.Camera, domElement: HTMLElement, scene: THREE.Scene) {
    this.sceneManager = sceneManager;
    this.camera = camera;
    this.domElement = domElement;

    // Initialize Transform Controls
    this.transformControls = new TransformControls(this.camera, this.domElement);
    scene.add(this.transformControls as any);

    // Sync transform controls with snapping
    this.transformControls.addEventListener('dragging-changed', (event: any) => {
      if (event.value) {
        console.log('[Editor] Dragging started');
      }
    });

    // Listen for mouse clicks for selection
    this.domElement.addEventListener('click', (e) => this.onMouseClick(e));
  }

  /**
   * Toggles grid snapping for Move/Rotate/Scale operations.
   */
  setSnapping(enabled: boolean, size: number = 1) {
    this.snapEnabled = enabled;
    this.gridSize = size;
    this.transformControls.setTranslationSnap(enabled ? size : null);
    this.transformControls.setRotationSnap(enabled ? THREE.MathUtils.degToRad(15) : null);
    this.transformControls.setScaleSnap(enabled ? 0.25 : null);
    console.log(`[Editor] Snapping: ${enabled ? 'ENABLED' : 'OFF'} (${size}m)`);
  }

  /**
   * Handles object selection via raycasting.
   */
  private onMouseClick(event: MouseEvent) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const clickableObjects: THREE.Object3D[] = [];
    (this.sceneManager as any).registry.forEach((item: any) => {
      clickableObjects.push(item.object);
    });

    const intersects = this.raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
      let target: THREE.Object3D | null = intersects[0].object;
      while (target && target.parent && !target.name) {
        target = target.parent;
      }

      if (target && target.name) {
        this.selectObject(target.name);
      }
    } else {
      this.selectObject(null);
    }
  }

  /**
   * Selects an object and attaches transform controls.
   */
  selectObject(id: string | null) {
    this.selectedId = id;
    if (id) {
      const obj = this.sceneManager.getObject(id);
      if (obj) {
        this.transformControls.attach(obj);
        console.log(`[Editor] Selected: ${id}`);
      }
    } else {
      this.transformControls.detach();
      console.log(`[Editor] Deselected all.`);
    }
  }

  /**
   * Exports the current scene configuration to a JSON string.
   */
  saveLayout(): string {
    const layout: SceneLayoutItem[] = [];
    (this.sceneManager as any).registry.forEach((item: any) => {
      const obj = item.object;
      layout.push({
        id: item.id,
        url: item.url,
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z]
      });
    });

    const json = JSON.stringify(layout, null, 2);
    console.log(`[Editor] Layout exported (${layout.length} objects).`);
    return json;
  }

  /**
   * Imports and reconstructs a scene from a JSON layout.
   */
  async loadLayout(json: string) {
    try {
      const layout: SceneLayoutItem[] = JSON.parse(json);
      console.log(`[Editor] Loading layout with ${layout.length} objects...`);

      for (const item of layout) {
        await this.sceneManager.addObject(item.url, {
          id: item.id,
          position: item.position,
          rotation: item.rotation,
          scale: item.scale[0],
        });
      }
      console.log(`[Editor] Layout loaded successfully.`);
    } catch (e) {
      console.error(`[Editor] Failed to load layout:`, e);
    }
  }

  /**
   * Switch between Translate, Rotate, and Scale modes.
   */
  setMode(mode: 'translate' | 'rotate' | 'scale') {
    this.transformControls.setMode(mode);
  }
}

import * as fs from 'fs';
import * as path from 'path';

interface ObjectState {
  id: string;
  url: string;
  position: number[];
  rotation: number[];
  scale: number[];
  ownerId: string;
}

interface SceneData {
  objects: Record<string, ObjectState>;
  lastUpdated: number;
}

/**
 * PersistenceManager
 * Handles file-based storage of the 3D scene state and manages object ownership.
 */
export class PersistenceManager {
  private filePath: string;
  private ownershipMap: Map<string, string> = new Map(); // objectId -> userId

  constructor(filename: string = 'scene_state.json') {
    this.filePath = path.join(process.cwd(), filename);
  }

  /**
   * Saves the current scene state to a JSON file.
   */
  save(objects: Map<string, any>) {
    try {
      const data: SceneData = {
        objects: Object.fromEntries(objects),
        lastUpdated: Date.now()
      };
      
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`[Persistence] Scene state saved to ${this.filePath}`);
    } catch (e) {
      console.error('[Persistence] Error saving scene state:', e);
    }
  }

  /**
   * Loads the scene state from the JSON file.
   */
  load(): Map<string, ObjectState> {
    const registry = new Map<string, ObjectState>();
    
    if (!fs.existsSync(this.filePath)) {
      console.warn(`[Persistence] No save file found at ${this.filePath}. Starting fresh.`);
      return registry;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data: SceneData = JSON.parse(raw);
      
      for (const [id, state] of Object.entries(data.objects)) {
        registry.set(id, state);
        if (state.ownerId) {
          this.ownershipMap.set(id, state.ownerId);
        }
      }
      
      console.log(`[Persistence] Loaded ${registry.size} objects from storage.`);
    } catch (e) {
      console.error('[Persistence] Error loading scene state:', e);
    }

    return registry;
  }

  /**
   * Sets the owner of an object.
   */
  setOwner(objectId: string, userId: string) {
    this.ownershipMap.set(objectId, userId);
  }

  /**
   * Checks if a user is the owner of an object.
   */
  isOwner(objectId: string, userId: string): boolean {
    const owner = this.ownershipMap.get(objectId);
    return owner === userId;
  }

  /**
   * Gets the owner ID of an object.
   */
  getOwner(objectId: string): string | null {
    return this.ownershipMap.get(objectId) || null;
  }

  /**
   * Removes ownership data when an object is deleted.
   */
  removeOwnership(objectId: string) {
    this.ownershipMap.delete(objectId);
  }
}

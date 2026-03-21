import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

interface Project {
  id: string;
  ownerId: string;
  name: string;
  sceneFile: string;
}

/**
 * ProjectManager
 * Manages multiple 3D scenes (projects) per user and persists project metadata.
 */
export class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private storageDir: string;

  constructor(storageDir: string = 'data/projects') {
    this.storageDir = path.join(process.cwd(), storageDir);
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Creates a new project for a user.
   */
  createProject(ownerId: string, name: string): Project {
    const projectId = uuidv4();
    const project: Project = {
      id: projectId,
      ownerId,
      name,
      sceneFile: `scene_${projectId}.json`
    };

    this.projects.set(projectId, project);
    this.saveMetadata();
    console.log(`[Projects] Created project "${name}" for user ${ownerId}`);
    return project;
  }

  /**
   * Retrieves all projects belonging to a specific user.
   */
  getUserProjects(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.ownerId === userId);
  }

  /**
   * Returns project details.
   */
  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  /**
   * Persists project metadata to a central file.
   */
  private saveMetadata() {
    const metaPath = path.join(this.storageDir, 'metadata.json');
    const data = Object.fromEntries(this.projects);
    fs.writeFileSync(metaPath, JSON.stringify(data, null, 2));
  }

  /**
   * Loads existing project metadata.
   */
  loadMetadata() {
    const metaPath = path.join(this.storageDir, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const data = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      this.projects = new Map(Object.entries(data));
      console.log(`[Projects] Loaded ${this.projects.size} projects from storage.`);
    }
  }
}

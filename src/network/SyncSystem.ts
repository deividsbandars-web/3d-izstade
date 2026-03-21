import * as THREE from 'three';
import { SceneManager } from '../engine/SceneManager';

interface SyncMessage {
  type: 'transform' | 'create' | 'delete';
  id: string;
  senderId: string;
  data: any;
}

/**
 * SyncSystem
 * Manages real-time synchronization of scene objects across multiple clients via WebSockets.
 */
export class SyncSystem {
  private socket: WebSocket | null = null;
  private sceneManager: SceneManager;
  private url: string;
  private clientId: string = Math.random().toString(36).substring(7);

  constructor(sceneManager: SceneManager, url: string) {
    this.sceneManager = sceneManager;
    this.url = url;
    this.connect();
  }

  /**
   * Initializes WebSocket connection and sets up listeners.
   */
  private connect() {
    console.log(`[SyncSystem] Connecting to ${this.url}...`);
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log(`[SyncSystem] Connected. Client ID: ${this.clientId}`);
    };

    this.socket.onmessage = (event) => {
      try {
        const msg: SyncMessage = JSON.parse(event.data);
        
        // Ignore messages from self
        if (msg.senderId === this.clientId) return;

        switch (msg.type) {
          case 'transform':
            this.handleRemoteTransform(msg.id, msg.data);
            break;
          case 'delete':
            this.sceneManager.removeObject(msg.id);
            break;
        }
      } catch (e) {
        console.error('[SyncSystem] Failed to process message:', e);
      }
    };

    this.socket.onclose = () => {
      console.warn('[SyncSystem] Socket closed. Reconnecting in 3s...');
      setTimeout(() => this.connect(), 3000);
    };
  }

  /**
   * Applies remote transform data to local objects.
   */
  private handleRemoteTransform(id: string, data: any) {
    const obj = this.sceneManager.getObject(id);
    if (obj) {
      if (data.position) obj.position.fromArray(data.position);
      if (data.rotation) obj.rotation.fromArray(data.rotation);
      if (data.scale) obj.scale.fromArray(data.scale);
      
      // Force update of debug helpers if they are visible
      this.sceneManager.updateHelpers();
    }
  }

  /**
   * Broadcasts local object state to all other clients.
   * Throttling should be handled by the caller or a separate utility.
   */
  broadcastTransform(id: string, object: THREE.Object3D) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const payload: SyncMessage = {
      type: 'transform',
      id,
      senderId: this.clientId,
      data: {
        position: object.position.toArray(),
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        scale: object.scale.toArray()
      }
    };

    this.socket.send(JSON.stringify(payload));
  }

  /**
   * Broadcasts object deletion.
   */
  broadcastDelete(id: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const payload: SyncMessage = {
      type: 'delete',
      id,
      senderId: this.clientId,
      data: null
    };

    this.socket.send(JSON.stringify(payload));
  }
}

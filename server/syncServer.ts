import { WebSocketServer, WebSocket } from 'ws';

interface SyncMessage {
  type: 'transform' | 'create' | 'delete' | 'sync_state';
  id: string;
  senderId: string;
  data: any;
}

interface ObjectState {
  url: string;
  position: number[];
  rotation: number[];
  scale: number[];
}

/**
 * SyncServer
 * Authoritative WebSocket server for maintaining and broadcasting 3D scene state.
 */
class SyncServer {
  private wss: WebSocketServer;
  private state: Map<string, ObjectState> = new Map();

  constructor(port: number = 8888) {
    this.wss = new WebSocketServer({ port });
    this.init();
    console.log(`[SyncServer] running on port ${port}`);
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[SyncServer] New client connected');

      // 1. Initial State Sync
      this.sendInitialState(ws);

      ws.on('message', (data: string) => {
        try {
          const msg: SyncMessage = JSON.parse(data);
          if (this.isValid(msg)) {
            this.handleMessage(msg, ws);
          }
        } catch (e) {
          console.error('[SyncServer] Invalid message format');
        }
      });

      ws.on('close', () => console.log('[SyncServer] Client disconnected'));
    });
  }

  private isValid(msg: SyncMessage): boolean {
    return !!(msg.type && msg.id && msg.senderId);
  }

  private handleMessage(msg: SyncMessage, sender: WebSocket) {
    switch (msg.type) {
      case 'create':
        this.state.set(msg.id, msg.data);
        break;
      case 'transform':
        const current = this.state.get(msg.id);
        if (current) {
          this.state.set(msg.id, { ...current, ...msg.data });
        }
        break;
      case 'delete':
        this.state.delete(msg.id);
        break;
    }

    // Broadcast to everyone else
    this.broadcast(msg, sender);
  }

  private broadcast(msg: SyncMessage, sender: WebSocket) {
    const data = JSON.stringify(msg);
    this.wss.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private sendInitialState(ws: WebSocket) {
    const stateObj: Record<string, ObjectState> = {};
    this.state.forEach((value, key) => {
      stateObj[key] = value;
    });

    ws.send(JSON.stringify({
      type: 'sync_state',
      data: stateObj
    }));
  }
}

new SyncServer();

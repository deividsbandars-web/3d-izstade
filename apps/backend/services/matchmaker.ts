import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface Instance {
  id: string;
  status: 'IDLE' | 'BUSY';
  lastSeen: number;
}

export const registerInstance = async (instanceId: string) => {
  const instance: Instance = {
    id: instanceId,
    status: 'IDLE',
    lastSeen: Date.now(),
  };
  await redis.hset('ps_instances', instanceId, JSON.stringify(instance));
};

export const updateHeartbeat = async (instanceId: string) => {
  const data = await redis.hget('ps_instances', instanceId);
  if (data) {
    const instance: Instance = JSON.parse(data);
    instance.lastSeen = Date.now();
    await redis.hset('ps_instances', instanceId, JSON.stringify(instance));
  }
};

export const getAvailableInstance = async (): Promise<string | null> => {
  const allInstances = await redis.hgetall('ps_instances');
  const now = Date.now();
  const timeout = 30000; // 30 seconds

  for (const [id, data] of Object.entries(allInstances)) {
    const instance: Instance = JSON.parse(data);
    if (instance.status === 'IDLE' && (now - instance.lastSeen) < timeout) {
      // Mark as BUSY
      instance.status = 'BUSY';
      await redis.hset('ps_instances', id, JSON.stringify(instance));
      return id;
    }
  }
  return null;
};

export const releaseInstance = async (instanceId: string) => {
  const data = await redis.hget('ps_instances', instanceId);
  if (data) {
    const instance: Instance = JSON.parse(data);
    instance.status = 'IDLE';
    await redis.hset('ps_instances', instanceId, JSON.stringify(instance));
  }
};

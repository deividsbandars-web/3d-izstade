type RedisListener = (...args: unknown[]) => void;

function createNoopAsync<T>(value: T) {
  return Promise.resolve(value);
}

export default class Redis {
  constructor(..._args: unknown[]) {}

  on(_event: string, _listener: RedisListener) {
    return this;
  }

  publish(..._args: unknown[]) {
    return createNoopAsync(0);
  }

  subscribe(..._args: unknown[]) {
    return createNoopAsync(0);
  }

  zadd(..._args: unknown[]) {
    return createNoopAsync(0);
  }

  zrangebyscore(..._args: unknown[]) {
    return createNoopAsync<string[]>([]);
  }

  zrem(..._args: unknown[]) {
    return createNoopAsync(0);
  }

  quit() {
    return createNoopAsync('OK');
  }

  disconnect() {
    return undefined;
  }
}

import { AsyncLocalStorage } from 'node:async_hooks';

const MAX_ARRAY_ITEMS = 50;
const MAX_LOG_DEPTH = 5;
const MAX_OBJECT_KEYS = 50;
const MAX_STRING_LENGTH = 2_000;
const logContextStorage = new AsyncLocalStorage();

const sensitiveKeys = new Set([
  'accesstoken',
  'apikey',
  'authorization',
  'bearer',
  'cookie',
  'credential',
  'idtoken',
  'password',
  'refreshtoken',
  'secret',
  'setcookie',
  'token',
]);

function normalizeSensitiveKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSensitiveKey(key) {
  const normalized = normalizeSensitiveKey(key);
  return sensitiveKeys.has(normalized)
    || normalized.endsWith('apikey')
    || normalized.endsWith('password')
    || normalized.endsWith('secret')
    || normalized.endsWith('secretkey')
    || normalized.endsWith('token')
    || normalized.startsWith('authorization')
    || normalized.startsWith('cookie');
}

function truncate(value, maximumLength = MAX_STRING_LENGTH) {
  return value.length > maximumLength
    ? `${value.slice(0, maximumLength)}...[truncated]`
    : value;
}

function sanitizeLogValue(value, includeStack, seen = new WeakSet(), depth = 0) {
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return value ?? null;
  }
  if (typeof value === 'string') {
    return truncate(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'function' || typeof value === 'symbol') {
    return String(value);
  }
  if (depth >= MAX_LOG_DEPTH) {
    return '[max-depth]';
  }
  if (value instanceof Error) {
    return {
      message: truncate(value.message),
      name: value.name,
      ...(includeStack && value.stack ? { stack: truncate(value.stack, 4_000) } : {}),
    };
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value !== 'object') {
    return String(value);
  }
  if (seen.has(value)) {
    return '[circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeLogValue(item, includeStack, seen, depth + 1));
  }

  const result = {};
  for (const [key, entry] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
    result[key] = isSensitiveKey(key)
      ? '[redacted]'
      : sanitizeLogValue(entry, includeStack, seen, depth + 1);
  }
  return result;
}

function isProductionRuntime(rawEnv) {
  return [rawEnv.NODE_ENV, rawEnv.APP_ENV, rawEnv.VERCEL_ENV]
    .some((value) => value?.trim().toLowerCase() === 'production');
}

export function resolveBackendLogMode(rawEnv = process.env) {
  return isProductionRuntime(rawEnv) ? 'production' : 'development';
}

export function runWithLogContext(context, callback) {
  return logContextStorage.run(context, callback);
}

function mergeContext(boundContext) {
  return {
    ...logContextStorage.getStore(),
    ...boundContext,
  };
}

export function createBackendLogger(options = {}) {
  const mode = options.mode ?? resolveBackendLogMode();
  const now = options.now ?? (() => new Date());
  const sink = options.sink ?? console;
  const boundContext = options.context ?? {};

  const formatMessage = (level, module, message, data) => {
    const context = mergeContext(boundContext);
    const timestamp = now().toISOString();
    const safeData = data === undefined ? undefined : sanitizeLogValue(data, mode === 'development');
    const requestId = context.requestId || undefined;

    if (mode === 'production') {
      return JSON.stringify({
        ...(safeData === undefined ? {} : { data: safeData }),
        level,
        message: truncate(message),
        module,
        ...(requestId ? { requestId } : {}),
        timestamp,
      });
    }

    const contextText = requestId ? ` [requestId=${requestId}]` : '';
    const dataText = safeData === undefined ? '' : ` ${JSON.stringify(safeData)}`;
    return `[${timestamp}] [${level}] [${module}]${contextText} ${truncate(message)}${dataText}`;
  };

  const write = (level, module, message, data) => {
    if (level === 'DEBUG' && mode === 'production') {
      return;
    }

    const formatted = formatMessage(level, module, message, data);
    if (level === 'ERROR') {
      sink.error(formatted);
    } else if (level === 'WARN') {
      sink.warn(formatted);
    } else if (level === 'DEBUG') {
      sink.debug(formatted);
    } else {
      sink.info(formatted);
    }
  };

  return {
    _formatMessage: formatMessage,
    debug: (module, message, data) => write('DEBUG', module, message, data),
    error: (module, message, data) => write('ERROR', module, message, data),
    info: (module, message, data) => write('INFO', module, message, data),
    warn: (module, message, data) => write('WARN', module, message, data),
    withContext: (context) => createBackendLogger({
      ...options,
      context: { ...boundContext, ...context },
      mode,
      now,
      sink,
    }),
  };
}

export const logger = createBackendLogger();

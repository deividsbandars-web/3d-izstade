import './env.js';

import express from 'express';
import helmet from 'helmet';
import * as expoController from './controllers/expoController.js';
import { getBackendRuntimeEnv } from './config/runtimeEnv.js';
import { logger } from './lib/logger.js';
import { createBackendCorsMiddleware } from './middleware/corsPolicy.js';
import { createHttpAccessLogMiddleware } from './middleware/httpAccessLog.js';
import { requestContext } from './middleware/requestContext.js';
import { ue5AuthMiddleware } from './middleware/ue5Auth.js';
import { createApiRouter } from './routes/api.js';
import { landingRouter } from './routes/landing.js';

const app = express();
let backendRuntimeEnv: ReturnType<typeof getBackendRuntimeEnv>;
try {
  backendRuntimeEnv = getBackendRuntimeEnv();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error('BackendEnv', 'Failed to resolve backend runtime environment', { code: message });
  process.exit(1);
}
const apiRoutes = createApiRouter({
  pixelStreamingRoutesEnabled: backendRuntimeEnv.pixelStreamingRoutesEnabled,
});
const port = backendRuntimeEnv.port;

app.set('trust proxy', backendRuntimeEnv.trustProxyHops > 0 ? backendRuntimeEnv.trustProxyHops : false);
app.use(requestContext);
app.use(createHttpAccessLogMiddleware());
app.use(helmet());
app.use(createBackendCorsMiddleware(backendRuntimeEnv.corsAllowedOrigins));
app.use(express.json({
  verify: (req, _res, buffer) => {
    if ('originalUrl' in req && req.originalUrl === '/api/billing/webhook') {
      (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    }
  },
}));

if (backendRuntimeEnv.pixelStreamingRoutesEnabled) {
  app.get('/api/expo/cities', ue5AuthMiddleware, expoController.getCitiesList);
}
app.use('/api', apiRoutes);
app.use('/lp', landingRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  logger.info('BackendServer', 'Backend server started', { port });
  if (backendRuntimeEnv.pixelStreamingRoutesEnabled) {
    logger.info('BackendServer', 'Pixel Streaming operator routes enabled');
  }
});

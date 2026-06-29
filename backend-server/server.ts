import './env.js';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import * as expoController from './controllers/expoController.js';
import { getBackendRuntimeEnv } from './config/runtimeEnv.js';
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
  console.error('[backend-env] Failed to resolve backend runtime environment.');
  console.error(`[backend-env] ${message}`);
  console.error('[backend-env] Required for GALA/expo-scene backend: SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  console.error('[backend-env] Required only when PIXEL_STREAMING_ROUTES_ENABLED=true: SIGNALING_STATUS_BASE_URL and UE5_SECRET_KEY.');
  process.exit(1);
}
const apiRoutes = createApiRouter({
  pixelStreamingRoutesEnabled: backendRuntimeEnv.pixelStreamingRoutesEnabled,
});
const port = backendRuntimeEnv.port;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(requestContext);

if (backendRuntimeEnv.pixelStreamingRoutesEnabled) {
  app.get('/api/expo/cities', ue5AuthMiddleware, expoController.getCitiesList);
}
app.use('/api', apiRoutes);
app.use('/lp', landingRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend Server running at http://localhost:${port}`);
  if (backendRuntimeEnv.pixelStreamingRoutesEnabled) {
    console.log(`Hardened City Network API active at http://localhost:${port}/api/expo/cities`);
  }
});

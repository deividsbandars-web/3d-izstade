import './env.js';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import * as expoController from './controllers/expoController.js';
import { getBackendRuntimeEnv } from './config/runtimeEnv.js';
import { requestContext } from './middleware/requestContext.js';
import { ue5AuthMiddleware } from './middleware/ue5Auth.js';
import { router as apiRoutes } from './routes/api.js';
import { landingRouter } from './routes/landing.js';

const app = express();
const backendRuntimeEnv = getBackendRuntimeEnv();
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

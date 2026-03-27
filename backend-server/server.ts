import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables immediately before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router as apiRoutes } from './routes/api.js';
import { landingRouter } from './routes/landing.js';
import * as expoController from './controllers/expoController.js';
import { ue5AuthMiddleware } from './middleware/ue5Auth.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

/**
 * PROTECTED UE5 BRIDGE ROUTES
 * Hardened with X-Warpala-API-Key for production readiness.
 */
app.get('/api/expo/cities', ue5AuthMiddleware, expoController.getCitiesList);

// Other Routes
app.use('/api', apiRoutes);
app.use('/lp', landingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Backend Server running at http://localhost:${port}`);
  console.log(`🛡️  Hardened City Network API active at http://localhost:${port}/api/expo/cities`);
});

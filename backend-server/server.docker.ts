import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { router as apiRoutes } from './routes/api.docker.js';
import * as expoController from './controllers/expoController.js';
import { ue5AuthMiddleware } from './middleware/ue5Auth.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Compose runtime keeps only routes that do not depend on the wider monorepo tree.
app.get('/api/expo/cities', ue5AuthMiddleware, expoController.getCitiesList);
app.use('/api', apiRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), runtime: 'docker-minimal' });
});

app.listen(port, () => {
  console.log(`Backend Docker runtime listening on http://localhost:${port}`);
  console.log(`Pixel Streaming status endpoint available at http://localhost:${port}/api/pixel-streaming/status`);
});

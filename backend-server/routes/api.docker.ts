import { Router } from 'express';
import * as expoController from '../controllers/expoController.js';

export const router = Router();

router.get('/pixel-streaming/status', expoController.getPixelStreamingRuntimeStatus);

router.get('/expo/scene', (req, res, next) => {
  console.log(`[ROUTE][DOCKER] Public Access: ${req.method} ${req.url}`);
  next();
}, expoController.getExpoScene);

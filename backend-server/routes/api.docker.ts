import { Router } from 'express';
import * as expoController from '../controllers/expoController.js';

export const router = Router();

router.get('/pixel-streaming/status', expoController.getPixelStreamingRuntimeStatus);
router.post('/pixel-streaming/session', expoController.createPixelStreamingSession);
router.get('/expo/scene', expoController.getExpoScene);

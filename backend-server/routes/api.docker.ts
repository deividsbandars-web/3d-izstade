import { Router } from 'express';
import * as expoController from '../controllers/expoController.js';
import * as expoLeadController from '../controllers/expoLeadController.js';

export const router = Router();

router.get('/pixel-streaming/status', expoController.getPixelStreamingRuntimeStatus);
router.post('/pixel-streaming/session', expoController.createPixelStreamingSession);
router.post('/expo/lead', expoLeadController.captureExpoLead);
router.get('/expo/scene', expoController.getExpoScene);

import { Router } from 'express';
import { getLandingPage } from '../controllers/landingController.js';

export const landingRouter = Router();

landingRouter.get('/:slug', getLandingPage);

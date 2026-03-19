import express, { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import * as leadsController from '../controllers/leadsController.js';
import * as agentsController from '../controllers/agentsController.js';
import * as marketplaceController from '../controllers/marketplaceController.js';
import * as outreachController from '../controllers/outreachController.js';
import * as expoController from '../controllers/expoController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as matchmakerController from '../controllers/matchmakerController.js';
import * as stripeController from '../controllers/stripeController.js';
import * as proDashboardController from '../controllers/proDashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

export const router = Router();

// Apply global rate limiting to all API routes
router.use(rateLimitMiddleware);

/**
 * PUBLIC ROUTES
 */
router.post('/track', analyticsController.trackAnalytics);
router.get('/sponsor/:id/stats', analyticsController.getSponsorStats);
router.get('/sponsor/:id/billing', analyticsController.getSponsorBilling);

// Stripe Webhook (MUST be before any global middleware that might consume the body)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

// Stripe Checkout
router.post('/stripe/create-checkout', stripeController.createCheckoutSession);

// Pro Dashboard
router.get('/dashboard/overview', proDashboardController.getOverview);
router.get('/dashboard/analytics', proDashboardController.getAnalytics);
router.get('/dashboard/billing', proDashboardController.getBillingDetails);

// Matchmaker
router.get('/matchmake', matchmakerController.requestInstance);
router.post('/matchmaker/register', matchmakerController.registerInstance);
router.post('/matchmaker/heartbeat', matchmakerController.heartbeat);

router.post('/analytics/track', analyticsController.trackAnalytics);

router.get('/expo/scene', (req, res, next) => {
    console.log(`[ROUTE] Public Access: ${req.method} ${req.url}`);
    next();
}, expoController.getExpoScene);

/**
 * PROTECTED ROUTES (Require Supabase JWT)
 */
// Define middleware for all subsequent routes
const protectedRouter = Router();
protectedRouter.use(authMiddleware);

// Dashboard
protectedRouter.get('/dashboard', dashboardController.getDashboardData);

// Leads
protectedRouter.get('/leads', leadsController.getLeads);
protectedRouter.post('/leads/generate', leadsController.generateLeads);
protectedRouter.post('/leads/capture', leadsController.captureLead); // This was incorrectly protected before

// Agents
protectedRouter.post('/agents/run', agentsController.runAgentTask);

// Marketplace
protectedRouter.get('/marketplace/agents', marketplaceController.getMarketplaceAgents);
protectedRouter.post('/marketplace/install', marketplaceController.installAgent);

// Outreach
protectedRouter.post('/outreach/email', outreachController.sendEmail);

// Mount protected routes
router.use(protectedRouter);

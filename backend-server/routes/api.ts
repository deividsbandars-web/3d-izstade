import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import * as leadsController from '../controllers/leadsController.js';
import * as agentsController from '../controllers/agentsController.js';
import * as marketplaceController from '../controllers/marketplaceController.js';
import * as outreachController from '../controllers/outreachController.js';
import * as expoController from '../controllers/expoController.js';
import * as expoLeadController from '../controllers/expoLeadController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as aiController from '../controllers/aiController.js';
import * as automationController from '../controllers/automationController.js';
import * as workflowsController from '../controllers/workflowsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';

export const router = Router();

// Apply global rate limiting to all API routes
router.use(rateLimitMiddleware);

/**
 * PUBLIC ROUTES (Defined BEFORE authMiddleware)
 */
router.post('/analytics/track', analyticsController.trackAnalytics);
router.get('/pixel-streaming/status', expoController.getPixelStreamingRuntimeStatus);
router.post('/pixel-streaming/session', expoController.createPixelStreamingSession);
router.post('/expo/lead', expoLeadController.captureExpoLead);
router.post('/ai-estimate', aiController.estimateWithAi);

// Public read-only scene contract used by the Web3D client. Keep auth policy here only.
router.get('/expo/scene', expoController.getExpoScene);

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
protectedRouter.post('/ai/respond', aiController.respondWithAi);
protectedRouter.post('/ai/video', aiController.generateAiVideo);
protectedRouter.post('/automation/business-workflow', automationController.startBusinessWorkflow);
protectedRouter.post('/workflows/execute', workflowsController.executeWorkflow);
protectedRouter.post('/workflows/validate', workflowsController.validateWorkflow);
protectedRouter.get('/workflows/:workflowId', workflowsController.getWorkflowDefinition);

// Marketplace
protectedRouter.get('/marketplace/agents', marketplaceController.getMarketplaceAgents);
protectedRouter.get('/marketplace/workflows', marketplaceController.getMarketplaceWorkflows);
protectedRouter.get('/marketplace/templates', marketplaceController.getMarketplaceTemplates);
protectedRouter.post('/marketplace/install', marketplaceController.installAgent);
protectedRouter.post('/marketplace/install/agent', marketplaceController.installAgent);
protectedRouter.post('/marketplace/install/workflow', marketplaceController.installWorkflow);
protectedRouter.post('/marketplace/install/template', marketplaceController.installTemplate);

// Outreach
protectedRouter.post('/outreach/email', outreachController.sendEmail);

// Mount protected routes
router.use(protectedRouter);

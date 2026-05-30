import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import * as leadsController from '../controllers/leadsController.js';
import * as agentsController from '../controllers/agentsController.js';
import * as marketplaceController from '../controllers/marketplaceController.js';
import * as outreachController from '../controllers/outreachController.js';
import * as expoController from '../controllers/expoController.js';
import * as expoDataController from '../controllers/expoDataController.js';
import * as expoLeadController from '../controllers/expoLeadController.js';
import * as expoLeadInboxController from '../controllers/expoLeadInboxController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as aiController from '../controllers/aiController.js';
import * as automationController from '../controllers/automationController.js';
import * as workflowsController from '../controllers/workflowsController.js';
import * as billingController from '../controllers/billingController.js';
import * as platformController from '../controllers/platformController.js';
import * as businessController from '../controllers/businessController.js';
import * as growthController from '../controllers/growthController.js';
import * as calculatorLeadController from '../controllers/calculatorLeadController.js';
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
router.post('/calculator/lead', calculatorLeadController.captureCalculatorLead);
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

// Expo data/business surface
protectedRouter.post('/expo/booths', expoDataController.createBooth);
protectedRouter.patch('/expo/booths/:boothId', expoDataController.updateBooth);
protectedRouter.get('/expo/booths/managed', expoDataController.getManagedBooths);
protectedRouter.get('/expo/booths/:boothId', expoDataController.getBooth);
protectedRouter.get('/expo/booths', expoDataController.getBooths);
protectedRouter.get('/expo/analytics/booths/:boothId', expoDataController.getBoothAnalytics);
protectedRouter.get('/expo/city', expoDataController.getExpoCity);
protectedRouter.get('/expo/city/districts', expoDataController.getDistricts);
protectedRouter.patch('/expo/city/booths/:boothId/district', expoDataController.assignBoothToDistrict);
protectedRouter.get('/expo/scenes/booth/:boothId', expoDataController.getBoothScene);
protectedRouter.get('/expo/scenes/city', expoDataController.getCityScene);
protectedRouter.get('/expo/review/snapshot', expoDataController.getExpoReviewSnapshot);
protectedRouter.get('/expo/review/booths/:boothId', expoDataController.getExpoReviewBooth);
protectedRouter.get('/expo/lead-inbox/:companySlug', expoLeadInboxController.getExpoSponsorLeadInbox);
protectedRouter.patch('/expo/lead-inbox/:companySlug/leads/:leadId', expoLeadInboxController.updateExpoSponsorLeadStatus);
protectedRouter.patch('/expo/lead-inbox/:companySlug/leads/:leadId/ops', expoLeadInboxController.updateExpoSponsorLeadOps);
protectedRouter.patch('/expo/review/booths/:boothId/leads/:leadId', expoDataController.updateExpoReviewLeadStatus);
protectedRouter.patch('/expo/review/booths/:boothId/leads/:leadId/ops', expoDataController.updateExpoReviewLeadOps);

// Leads
protectedRouter.get('/leads', leadsController.getLeads);
protectedRouter.post('/leads', leadsController.createLead);
protectedRouter.patch('/leads/:leadId', leadsController.updateLead);
protectedRouter.post('/leads/by-source', leadsController.getLeadsBySource);
protectedRouter.post('/leads/generate', leadsController.generateLeads);
protectedRouter.post('/leads/capture', leadsController.captureLead); // This was incorrectly protected before

// Billing
protectedRouter.get('/billing/plans/:planId/limits', billingController.getPlanLimits);
protectedRouter.get('/billing/users/:userId/plan', billingController.getUserPlan);
protectedRouter.post('/billing/upgrade', billingController.upgradePlan);
protectedRouter.get('/billing/users/:userId/credits', billingController.getCreditBalance);
protectedRouter.post('/billing/credits/checkout', billingController.buyCredits);
protectedRouter.post('/billing/checkout', billingController.createCheckoutSession);

// Platform
protectedRouter.get('/platform/metrics', platformController.getPlatformMetrics);
protectedRouter.get('/platform/health', platformController.getPlatformHealth);
protectedRouter.post('/platform/optimization/lead-conversion', platformController.analyzeLeadConversion);
protectedRouter.post('/platform/optimization/niches', platformController.suggestBetterNiches);
protectedRouter.post('/platform/optimization/agent-tasks', platformController.optimizeAgentTasks);

// Business + Growth
protectedRouter.post('/business/generate', businessController.generateBusiness);
protectedRouter.post('/growth/niches', growthController.findProfitableNiches);
protectedRouter.post('/growth/landing-page', growthController.generateLandingPage);
protectedRouter.post('/growth/keyword-clusters', growthController.generateKeywordClusters);
protectedRouter.post('/growth/blog-post', growthController.generateBlogPost);
protectedRouter.post('/growth/social-content', growthController.generateSocialContent);
protectedRouter.post('/growth/capture-lead', growthController.captureGrowthLead);

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

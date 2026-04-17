# API Coverage Matrix

## Purpose

This matrix compares the browser-facing API wrappers under `src/services/*` against the currently mounted HTTP API in `backend-server`.

It exists to answer one question before Phase 9:

- Is the frontend API boundary fully backed by real server routes?

Current answer:

- No. The boundary direction is correct, but endpoint coverage is incomplete.

## Current Mounted Server Routes

Mounted through [api.ts](/C:/3d/backend-server/routes/api.ts) and [server.ts](/C:/3d/backend-server/server.ts):

| Method | Route | Status | Owner |
| --- | --- | --- | --- |
| `GET` | `/api/expo/cities` | implemented | `expoController.getCitiesList` |
| `POST` | `/api/analytics/track` | implemented | `analyticsController.trackAnalytics` |
| `GET` | `/api/pixel-streaming/status` | implemented | `expoController.getPixelStreamingRuntimeStatus` |
| `POST` | `/api/pixel-streaming/session` | implemented | `expoController.createPixelStreamingSession` |
| `POST` | `/api/expo/lead` | implemented | `expoLeadController.captureExpoLead` |
| `GET` | `/api/expo/scene` | implemented | `expoController.getExpoScene` |
| `GET` | `/api/dashboard` | implemented | `dashboardController.getDashboardData` |
| `GET` | `/api/leads` | implemented | `leadsController.getLeads` |
| `POST` | `/api/leads/generate` | implemented | `leadsController.generateLeads` |
| `POST` | `/api/leads/capture` | implemented | `leadsController.captureLead` |
| `POST` | `/api/agents/run` | implemented | `agentsController.runAgentTask` |
| `POST` | `/api/ai-estimate` | implemented | `aiController.estimateWithAi` |
| `POST` | `/api/ai/respond` | implemented | `aiController.respondWithAi` |
| `POST` | `/api/ai/video` | implemented | `aiController.generateAiVideo` |
| `POST` | `/api/automation/business-workflow` | implemented | `automationController.startBusinessWorkflow` |
| `POST` | `/api/workflows/execute` | implemented | `workflowsController.executeWorkflow` |
| `POST` | `/api/workflows/validate` | implemented | `workflowsController.validateWorkflow` |
| `GET` | `/api/workflows/:workflowId` | implemented | `workflowsController.getWorkflowDefinition` |
| `GET` | `/api/marketplace/agents` | implemented | `marketplaceController.getMarketplaceAgents` |
| `GET` | `/api/marketplace/workflows` | implemented | `marketplaceController.getMarketplaceWorkflows` |
| `GET` | `/api/marketplace/templates` | implemented | `marketplaceController.getMarketplaceTemplates` |
| `POST` | `/api/marketplace/install` | implemented | `marketplaceController.installAgent` |
| `POST` | `/api/marketplace/install/agent` | implemented | `marketplaceController.installAgent` |
| `POST` | `/api/marketplace/install/workflow` | implemented | `marketplaceController.installWorkflow` |
| `POST` | `/api/marketplace/install/template` | implemented | `marketplaceController.installTemplate` |
| `POST` | `/api/outreach/email` | implemented | `outreachController.sendEmail` |

## Frontend Wrapper Coverage

### AI

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/ai-estimate` | implemented | Backed by `backend-server/controllers/aiController.ts`. |
| `POST /api/ai/respond` | implemented | Protected route; browser helper now attaches Supabase bearer token when present. |
| `POST /api/ai/video` | implemented | Backed by `backend-server/controllers/aiController.ts`. |

### Automation

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/automation/business-workflow` | implemented | Backed by `workflowEngine.startBusinessWorkflow`. |

### Expo

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/expo/booths` | implemented | Protected route now mounted. |
| `PATCH /api/expo/booths/:id` | implemented | Protected route now mounted as `/api/expo/booths/:boothId`. |
| `GET /api/expo/booths/:id` | implemented | Protected route now mounted as `/api/expo/booths/:boothId`. |
| `GET /api/expo/booths` | implemented | Protected route now mounted. |
| `GET /api/expo/analytics/booths/:id` | implemented | Protected route now mounted. |
| `GET /api/expo/city` | implemented | Protected route now mounted. |
| `GET /api/expo/city/districts` | implemented | Protected route now mounted. |
| `PATCH /api/expo/city/booths/:id/district` | implemented | Protected route now mounted as `/api/expo/city/booths/:boothId/district`. |
| `GET /api/expo/scene` | implemented | Public readonly route exists. |
| `GET /api/expo/scenes/booth/:id` | implemented | Protected route now mounted as `/api/expo/scenes/booth/:boothId`. |
| `GET /api/expo/scenes/city` | implemented | Protected route now mounted. |

### Leads

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/leads` | missing | Wrapper exists, server route does not. |
| `PATCH /api/leads/:id` | missing | Wrapper exists, server route does not. |
| `POST /api/leads/by-source` | missing | Wrapper exists, server route does not. |
| `POST /api/leads/generate` | implemented | Mounted. |

### Marketplace

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `GET /api/marketplace/agents` | implemented | Mounted. |
| `GET /api/marketplace/workflows` | implemented | Route now mounted. |
| `GET /api/marketplace/templates` | implemented | Route now mounted. |
| `POST /api/marketplace/install/agent` | implemented | Route now mounted with path parity. |
| `POST /api/marketplace/install/workflow` | implemented | Route now mounted. |
| `POST /api/marketplace/install/template` | implemented | Route now mounted. |

### Billing

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `GET /api/billing/plans/:id/limits` | missing | No controller or route mounted. |
| `GET /api/billing/users/:id/plan` | missing | No controller or route mounted. |
| `POST /api/billing/upgrade` | missing | No controller or route mounted. |
| `GET /api/billing/users/:id/credits` | missing | No controller or route mounted. |
| `POST /api/billing/credits/checkout` | missing | No controller or route mounted. |
| `POST /api/billing/checkout` | missing | No controller or route mounted. |

### Platform

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `GET /api/platform/metrics` | missing | Domain metrics exist, no route/controller. |
| `GET /api/platform/health` | missing | Could be bridged partly from `/health`, but wrapper path does not exist. |
| `POST /api/platform/optimization/lead-conversion` | missing | Domain optimizer exists, no route/controller. |
| `POST /api/platform/optimization/niches` | missing | Domain optimizer exists, no route/controller. |
| `POST /api/platform/optimization/agent-tasks` | missing | Domain optimizer exists, no route/controller. |

### Business

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/business/generate` | missing | Domain business generator exists, no route/controller. |

### Growth

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/growth/niches` | missing | No mounted route. |
| `POST /api/growth/landing-page` | missing | No mounted route. |
| `POST /api/growth/keyword-clusters` | missing | No mounted route. |
| `POST /api/growth/blog-post` | missing | No mounted route. |
| `POST /api/growth/social-content` | missing | No mounted route. |
| `POST /api/growth/capture-lead` | missing | No mounted route. |

### Workflows

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/workflows/execute` | implemented | Route now mounted. |
| `POST /api/workflows/validate` | implemented | Route now mounted. |
| `GET /api/workflows/:id` | implemented | Route now mounted as `/api/workflows/:workflowId`. |

## Coverage Summary

### Implemented

- `expo scene`
- `pixel streaming status/session`
- `analytics track`
- `dashboard`
- `leads.generate`
- `leads.capture`
- `agents.run`
- `ai-estimate`
- `ai.respond`
- `ai.video`
- `automation.business-workflow`
- `marketplace.agents`
- `marketplace.workflows`
- `marketplace.templates`
- `marketplace.install.*`
- `workflows.execute`
- `workflows.validate`
- `workflows.read`
- `outreach.email`

### Partial / mismatched

- `platform.health`
  - server has `/health`
  - frontend expects `/api/platform/health`

### Missing high-priority release blockers

1. Expo booth/city scene CRUD routes
2. Billing routes
3. Platform metrics/optimization routes
4. Business and growth routes
5. Lead CRUD parity routes

## Recommended Implementation Order

### Wave 1: unblock current hardened wrappers

- completed
  - AI
  - automation business workflow
  - workflow execute/validate/read
  - marketplace workflow/template/install parity

### Wave 2: commercial operating surface

- Expo
  - completed
    - booth CRUD
    - booth analytics
    - city map / districts
    - booth scene / city scene
- Marketplace
  - completed in Wave 1
- Platform
  - metrics
  - health
  - optimization endpoints

### Wave 3: monetization and growth

- Billing
- Business generation
- Growth generation endpoints
- Lead CRUD parity

## Phase-9 Readiness Impact

Phase 9 should not be treated as fully honest release acceptance until the remaining commercial service routes are closed.

Reason:

- P8-T2 correctly moved the browser behind an API boundary.
- Wave 1 is now materially closed.
- But several commercial service boundaries still terminate in missing HTTP routes.
- Without closing that gap, release acceptance would still document a system whose architectural direction is correct but whose operational API surface remains incomplete.

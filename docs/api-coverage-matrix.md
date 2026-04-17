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
| `POST /api/leads` | implemented | Protected route now mounted. |
| `PATCH /api/leads/:id` | implemented | Protected route now mounted as `/api/leads/:leadId`. |
| `POST /api/leads/by-source` | implemented | Protected route now mounted. |
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
| `GET /api/billing/plans/:id/limits` | implemented | Protected route now mounted as `/api/billing/plans/:planId/limits`. |
| `GET /api/billing/users/:id/plan` | implemented | Protected route now mounted as `/api/billing/users/:userId/plan`. |
| `POST /api/billing/upgrade` | implemented | Protected route now mounted. |
| `GET /api/billing/users/:id/credits` | implemented | Protected route now mounted as `/api/billing/users/:userId/credits`. |
| `POST /api/billing/credits/checkout` | implemented | Protected route now mounted. |
| `POST /api/billing/checkout` | implemented | Protected route now mounted. |

### Platform

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `GET /api/platform/metrics` | implemented | Protected route now mounted. |
| `GET /api/platform/health` | implemented | Protected route now mounted. |
| `POST /api/platform/optimization/lead-conversion` | implemented | Protected route now mounted. |
| `POST /api/platform/optimization/niches` | implemented | Protected route now mounted. |
| `POST /api/platform/optimization/agent-tasks` | implemented | Protected route now mounted. |

### Business

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/business/generate` | implemented | Protected route now mounted. |

### Growth

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/growth/niches` | implemented | Protected route now mounted. |
| `POST /api/growth/landing-page` | implemented | Protected route now mounted. |
| `POST /api/growth/keyword-clusters` | implemented | Protected route now mounted. |
| `POST /api/growth/blog-post` | implemented | Protected route now mounted. |
| `POST /api/growth/social-content` | implemented | Protected route now mounted. |
| `POST /api/growth/capture-lead` | implemented | Protected route now mounted. |

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

### Missing high-priority release blockers

1. None in the current browser wrapper inventory covered by `src/services/*`
2. Remaining risk is route quality, auth behavior, and runtime correctness rather than raw endpoint absence

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
  - completed
    - metrics
    - health
    - optimization endpoints

### Wave 3: monetization and growth

- completed
  - Billing
  - Business generation
  - Growth generation endpoints
  - Lead CRUD parity

## Phase-9 Readiness Impact

Phase 9 can now begin from an API coverage standpoint, because the current browser wrapper inventory no longer points at missing backend routes.

Reason:

- P8-T2 correctly moved the browser behind an API boundary.
- Wave 1 and the remaining commercial service waves are now materially closed at the route coverage level.
- Remaining release risk is no longer “missing endpoint coverage”; it is correctness, auth behavior, runtime integration quality, and acceptance evidence.

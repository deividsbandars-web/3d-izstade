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
| `GET` | `/api/marketplace/agents` | implemented | `marketplaceController.getMarketplaceAgents` |
| `POST` | `/api/marketplace/install` | partial | `marketplaceController.installAgent` |
| `POST` | `/api/outreach/email` | implemented | `outreachController.sendEmail` |

## Frontend Wrapper Coverage

### AI

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/ai-estimate` | missing | Required by `src/services/aiService.ts`. |
| `POST /api/ai/respond` | missing | Required by `src/services/aiService.ts` and `src/agents/baseAgent.ts`. |
| `POST /api/ai/video` | missing | Required by `src/services/aiService.ts`. |

### Automation

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/automation/business-workflow` | missing | Required by `src/services/automation.ts`. |

### Expo

| Wrapper Route | Status | Notes |
| --- | --- | --- |
| `POST /api/expo/booths` | missing | CRUD path not mounted yet. |
| `PATCH /api/expo/booths/:id` | missing | CRUD path not mounted yet. |
| `GET /api/expo/booths/:id` | missing | Domain service exists in `src/backend/expo`, but no route/controller. |
| `GET /api/expo/booths` | missing | Domain service exists in `src/backend/expo`, but no route/controller. |
| `GET /api/expo/analytics/booths/:id` | missing | Analytics service exists in `src/backend/expo/analytics`, but no route/controller. |
| `GET /api/expo/city` | missing | City map domain exists, but no route/controller. |
| `GET /api/expo/city/districts` | missing | City map domain exists, but no route/controller. |
| `PATCH /api/expo/city/booths/:id/district` | missing | No mounted route. |
| `GET /api/expo/scene` | implemented | Public readonly route exists. |
| `GET /api/expo/scenes/booth/:id` | missing | Domain service exists, no route/controller. |
| `GET /api/expo/scenes/city` | missing | No mounted route. |

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
| `GET /api/marketplace/workflows` | missing | Domain workflow marketplace exists, no route/controller. |
| `GET /api/marketplace/templates` | missing | No mounted route. |
| `POST /api/marketplace/install/agent` | missing | Wrapper path does not match current server route. |
| `POST /api/marketplace/install/workflow` | missing | No mounted route. |
| `POST /api/marketplace/install/template` | missing | No mounted route. |

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
| `POST /api/workflows/execute` | missing | Domain runner/validator exists, no route/controller. |
| `POST /api/workflows/validate` | missing | Domain runner/validator exists, no route/controller. |
| `GET /api/workflows/:id` | missing | No mounted route. |

## Coverage Summary

### Implemented

- `expo scene`
- `pixel streaming status/session`
- `analytics track`
- `dashboard`
- `leads.generate`
- `leads.capture`
- `agents.run`
- `marketplace.agents`
- `outreach.email`

### Partial / mismatched

- `marketplace.install`
  - server has `/api/marketplace/install`
  - frontend expects `/api/marketplace/install/agent`
- `platform.health`
  - server has `/health`
  - frontend expects `/api/platform/health`

### Missing high-priority release blockers

1. AI routes
2. Expo booth/city scene CRUD routes
3. Workflow execute/validate/read routes
4. Billing routes
5. Platform metrics/optimization routes
6. Business and growth routes

## Recommended Implementation Order

### Wave 1: unblock current hardened wrappers

- AI
  - `/api/ai-estimate`
  - `/api/ai/respond`
  - `/api/ai/video`
- Automation
  - `/api/automation/business-workflow`
- Workflows
  - `/api/workflows/execute`
  - `/api/workflows/validate`
  - `/api/workflows/:id`

### Wave 2: commercial operating surface

- Expo
  - booth CRUD
  - booth analytics
  - city map / districts
  - booth scene / city scene
- Marketplace
  - workflows
  - templates
  - install/agent
  - install/workflow
  - install/template
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

Phase 9 should not be treated as fully honest release acceptance until at least Wave 1 is closed.

Reason:

- P8-T2 correctly moved the browser behind an API boundary.
- But many of those new boundaries still terminate in missing HTTP routes.
- Without closing that gap, release acceptance would be documenting a system whose architectural direction is correct but whose operational API surface is incomplete.

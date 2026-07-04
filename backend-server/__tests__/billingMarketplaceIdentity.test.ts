import assert from 'node:assert/strict';
import type { Response } from 'express';
import {
  buyCredits,
  createCheckoutSession,
  getCreditBalance,
  getUserPlan,
  upgradePlan,
} from '../controllers/billingController.js';
import {
  installAgent,
  installTemplate,
  installWorkflow,
} from '../controllers/marketplaceController.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { billingApplicationService } from '../../src/backend/billing/billingApplicationService.js';
import { installService } from '../../src/backend/marketplace/installService.js';

function createMockResponse() {
  const result = {
    body: null as unknown,
    statusCode: 200,
  };
  const response = {
    json(body: unknown) {
      result.body = body;
      return response;
    },
    status(statusCode: number) {
      result.statusCode = statusCode;
      return response;
    },
  } as Response;

  return { response, result };
}

function createAuthRequest({
  body = {},
  params = {},
  role = 'user',
  userId = 'auth-user-1',
}: {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  role?: string;
  userId?: string;
}) {
  return {
    body,
    params,
    user: {
      id: userId,
      role,
    },
  } as unknown as AuthRequest;
}

const originalGetUserPlan = billingApplicationService.getUserPlan;
const originalUpgradePlan = billingApplicationService.upgradePlan;
const originalGetCreditBalance = billingApplicationService.getCreditBalance;
const originalBuyCredits = billingApplicationService.buyCredits;
const originalCreateCheckoutSession = billingApplicationService.createCheckoutSession;
const originalInstallAgent = installService.installAgent;
const originalInstallWorkflow = installService.installWorkflow;
const originalInstallTemplate = installService.installTemplate;

try {
  {
    let getUserPlanCalls = 0;
    billingApplicationService.getUserPlan = async () => {
      getUserPlanCalls += 1;
      return { data: { current_plan: 'free', limits: {}, status: 'active' }, error: null } as any;
    };

    const { response, result } = createMockResponse();
    await getUserPlan(createAuthRequest({
      params: { userId: 'other-user' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, {
      code: 'BILLING_USER_FORBIDDEN',
      error: 'Cannot access billing resources for another user',
    });
    assert.equal(getUserPlanCalls, 0);
  }

  {
    let capturedUserId = '';
    billingApplicationService.getUserPlan = async (userId: string) => {
      capturedUserId = userId;
      return { data: { current_plan: 'pro', limits: {}, status: 'active' }, error: null } as any;
    };

    const { response, result } = createMockResponse();
    await getUserPlan(createAuthRequest({
      params: { userId: 'target-user' },
      role: 'admin',
      userId: 'admin-user',
    }), response);

    assert.equal(result.statusCode, 200);
    assert.equal(capturedUserId, 'target-user');
  }

  {
    let creditCalls = 0;
    billingApplicationService.getCreditBalance = async () => {
      creditCalls += 1;
      return { data: 10, error: null };
    };

    const { response, result } = createMockResponse();
    await getCreditBalance(createAuthRequest({
      params: { userId: 'other-user' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 403);
    assert.equal(creditCalls, 0);
  }

  {
    let upgradeCalls = 0;
    billingApplicationService.upgradePlan = async () => {
      upgradeCalls += 1;
      return { data: { plan: 'pro' }, error: null } as any;
    };

    const { response, result } = createMockResponse();
    await upgradePlan(createAuthRequest({
      body: { newPlan: 'pro', userId: 'auth-user-1' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, {
      code: 'BILLING_PLAN_UPGRADE_FORBIDDEN',
      error: 'Admin access required for direct plan upgrades',
    });
    assert.equal(upgradeCalls, 0);
  }

  {
    let capturedUpgrade: { newPlan: string; userId: string } | null = null;
    billingApplicationService.upgradePlan = async (userId: string, newPlan: string) => {
      capturedUpgrade = { newPlan, userId };
      return { data: { id: userId, plan: newPlan }, error: null } as any;
    };

    const { response, result } = createMockResponse();
    await upgradePlan(createAuthRequest({
      body: { newPlan: 'enterprise', userId: 'target-user' },
      role: 'admin',
      userId: 'admin-user',
    }), response);

    assert.equal(result.statusCode, 200);
    assert.deepEqual(capturedUpgrade, { newPlan: 'enterprise', userId: 'target-user' });
  }

  {
    let buyCreditCalls = 0;
    billingApplicationService.buyCredits = async () => {
      buyCreditCalls += 1;
      return { data: { url: 'checkout' }, error: null } as any;
    };

    const { response, result } = createMockResponse();
    await buyCredits(createAuthRequest({
      body: { packageId: 'credits_100', userId: 'other-user' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 403);
    assert.equal(buyCreditCalls, 0);
  }

  {
    let checkoutCalls = 0;
    billingApplicationService.createCheckoutSession = async () => {
      checkoutCalls += 1;
      return { data: { url: 'checkout' }, error: null } as any;
    };

    const { response, result } = createMockResponse();
    await createCheckoutSession(createAuthRequest({
      body: { kind: 'plan', productId: 'pro', userId: 'other-user' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 403);
    assert.equal(checkoutCalls, 0);
  }

  {
    let installCalls = 0;
    installService.installAgent = async () => {
      installCalls += 1;
      return { data: null, error: null, success: true };
    };

    const { response, result } = createMockResponse();
    await installAgent(createAuthRequest({
      body: { agentId: 'agent-1', userId: 'other-user' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, {
      code: 'MARKETPLACE_USER_FORBIDDEN',
      error: 'Cannot install marketplace items for another user',
    });
    assert.equal(installCalls, 0);
  }

  {
    let capturedInstall: { agentId: string; userId: string } | null = null;
    installService.installAgent = async (userId: string, agentId: string) => {
      capturedInstall = { agentId, userId };
      return { data: { agentId, userId }, error: null, success: true };
    };

    const { response, result } = createMockResponse();
    await installAgent(createAuthRequest({
      body: { agentId: 'agent-1' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 200);
    assert.deepEqual(capturedInstall, { agentId: 'agent-1', userId: 'auth-user-1' });
  }

  {
    let capturedWorkflow: { userId: string; workflowId: string } | null = null;
    installService.installWorkflow = async (userId: string, workflowId: string) => {
      capturedWorkflow = { userId, workflowId };
      return { data: { userId, workflowId }, error: null, success: true };
    };

    const { response, result } = createMockResponse();
    await installWorkflow(createAuthRequest({
      body: { userId: 'auth-user-1', workflowId: 'workflow-1' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 200);
    assert.deepEqual(capturedWorkflow, { userId: 'auth-user-1', workflowId: 'workflow-1' });
  }

  {
    let templateCalls = 0;
    installService.installTemplate = async () => {
      templateCalls += 1;
      return { data: { template_id: 'template-1', user_id: 'auth-user-1' }, error: null, success: true };
    };

    const { response, result } = createMockResponse();
    await installTemplate(createAuthRequest({
      body: { templateId: 'template-1', userId: 'other-user' },
      userId: 'auth-user-1',
    }), response);

    assert.equal(result.statusCode, 403);
    assert.equal(templateCalls, 0);
  }
} finally {
  billingApplicationService.getUserPlan = originalGetUserPlan;
  billingApplicationService.upgradePlan = originalUpgradePlan;
  billingApplicationService.getCreditBalance = originalGetCreditBalance;
  billingApplicationService.buyCredits = originalBuyCredits;
  billingApplicationService.createCheckoutSession = originalCreateCheckoutSession;
  installService.installAgent = originalInstallAgent;
  installService.installWorkflow = originalInstallWorkflow;
  installService.installTemplate = originalInstallTemplate;
}

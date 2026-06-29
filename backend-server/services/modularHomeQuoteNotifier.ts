import { Resend } from 'resend';
import type { ValidModularHomeQuoteRequest } from '../schemas/quoteValidation.js';

export type ModularHomeQuoteEmailClient = {
  send: (message: {
    from: string;
    html: string;
    reply_to?: string;
    subject: string;
    text: string;
    to: string[];
  }) => Promise<{
    data?: { id?: string | null } | null;
    error?: { message?: string } | null;
  }>;
};

export type ModularHomeQuoteNotifierConfig = {
  enabled: boolean;
  from: string | null;
  replyTo: string | null;
  to: string[];
};

export type ModularHomeQuoteNotifierState = {
  completedQuoteIds: Set<string>;
  queuedQuoteIds: Set<string>;
};

export type ModularHomeQuoteNotificationJob = {
  payload: ValidModularHomeQuoteRequest;
  quoteId: string | null;
};

export type ModularHomeQuoteNotificationResult = {
  messageId: string | null;
  quoteId: string | null;
  skipped: boolean;
  status: 'disabled' | 'duplicate' | 'misconfigured' | 'queued' | 'sent' | 'failed';
};

const defaultNotifierState: ModularHomeQuoteNotifierState = {
  completedQuoteIds: new Set<string>(),
  queuedQuoteIds: new Set<string>(),
};
let resendClient: Resend | null | undefined;

function parseEmailList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export function getModularHomeQuoteNotifierConfig(env: NodeJS.ProcessEnv = process.env): ModularHomeQuoteNotifierConfig {
  return {
    enabled: env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED === 'true',
    from: env.MODULAR_HOME_QUOTE_EMAIL_FROM?.trim() || env.RESEND_FROM_EMAIL?.trim() || null,
    replyTo: env.MODULAR_HOME_QUOTE_EMAIL_REPLY_TO?.trim() || null,
    to: parseEmailList(env.MODULAR_HOME_QUOTE_EMAIL_HANDOFF_TO),
  };
}

function getResendEmailClient(): ModularHomeQuoteEmailClient | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (resendClient === undefined) {
    resendClient = new Resend(apiKey);
  }

  if (!resendClient) {
    return null;
  }

  return resendClient.emails;
}

function logModularHomeQuoteEmailHandoff(result: ModularHomeQuoteNotificationResult, message?: string) {
  const event = {
    code: 'MODULAR_HOME_QUOTE_EMAIL_HANDOFF',
    message,
    messageId: result.messageId,
    quoteId: result.quoteId,
    status: result.status,
    timestamp: new Date().toISOString(),
  };

  if (result.status === 'failed' || result.status === 'misconfigured') {
    console.warn('[modular-home-quote-email]', event);
    return;
  }

  console.info('[modular-home-quote-email]', event);
}

function buildQuoteEmail(job: ModularHomeQuoteNotificationJob) {
  const { payload, quoteId } = job;
  const lines = [
    `Quote id: ${quoteId ?? 'pending'}`,
    `Product: ${payload.project.modelName} (${payload.project.productId})`,
    `Estimated total: ${payload.estimate.estimatedTotal} ${payload.estimate.currency}`,
    `Requester email: ${payload.requester.email}`,
    `Requester phone: ${payload.requester.phone}`,
    `Requester name: ${payload.requester.name}`,
    `Location: ${payload.requester.countryCity}`,
    `Target date: ${payload.requester.targetBuildDate}`,
    `Budget: ${payload.requester.budgetRange}`,
    `Share URL: ${payload.project.shareUrl ?? 'not provided'}`,
    `Message: ${payload.requester.message}`,
  ];
  const escapedLines = lines.map((line) => (
    line
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  ));

  return {
    html: `<h1>New modular home quote request</h1><pre>${escapedLines.join('\n')}</pre>`,
    subject: `New GALA modular-home quote: ${payload.project.modelName}`,
    text: lines.join('\n'),
  };
}

export async function sendModularHomeQuoteEmailHandoff(
  job: ModularHomeQuoteNotificationJob,
  options: {
    client?: ModularHomeQuoteEmailClient | null;
    config?: ModularHomeQuoteNotifierConfig;
    state?: ModularHomeQuoteNotifierState;
  } = {},
): Promise<ModularHomeQuoteNotificationResult> {
  const config = options.config ?? getModularHomeQuoteNotifierConfig();
  const state = options.state ?? defaultNotifierState;
  const quoteId = job.quoteId;

  if (!config.enabled) {
    return { messageId: null, quoteId, skipped: true, status: 'disabled' };
  }

  if (!quoteId) {
    return { messageId: null, quoteId, skipped: true, status: 'misconfigured' };
  }

  if (state.completedQuoteIds.has(quoteId)) {
    return { messageId: null, quoteId, skipped: true, status: 'duplicate' };
  }

  if (!config.from || config.to.length === 0) {
    const result = { messageId: null, quoteId, skipped: true, status: 'misconfigured' } as const;
    logModularHomeQuoteEmailHandoff(result, 'Missing MODULAR_HOME_QUOTE_EMAIL_FROM or MODULAR_HOME_QUOTE_EMAIL_HANDOFF_TO.');
    return result;
  }

  const client = options.client ?? getResendEmailClient();
  if (!client) {
    const result = { messageId: null, quoteId, skipped: true, status: 'misconfigured' } as const;
    logModularHomeQuoteEmailHandoff(result, 'Missing RESEND_API_KEY.');
    return result;
  }

  const email = buildQuoteEmail(job);
  try {
    const { data, error } = await client.send({
      from: config.from,
      html: email.html,
      ...(config.replyTo ? { reply_to: config.replyTo } : {}),
      subject: email.subject,
      text: email.text,
      to: config.to,
    });

    if (error) {
      const result = { messageId: null, quoteId, skipped: false, status: 'failed' } as const;
      logModularHomeQuoteEmailHandoff(result, error.message ?? 'Resend send failed.');
      return result;
    }

    state.completedQuoteIds.add(quoteId);
    const result = { messageId: data?.id ?? null, quoteId, skipped: false, status: 'sent' } as const;
    logModularHomeQuoteEmailHandoff(result);
    return result;
  } catch (error) {
    const result = { messageId: null, quoteId, skipped: false, status: 'failed' } as const;
    logModularHomeQuoteEmailHandoff(result, error instanceof Error ? error.message : String(error));
    return result;
  }
}

export function enqueueModularHomeQuoteEmailHandoff(
  job: ModularHomeQuoteNotificationJob,
  options: {
    client?: ModularHomeQuoteEmailClient | null;
    config?: ModularHomeQuoteNotifierConfig;
    scheduler?: (task: () => void) => void;
    state?: ModularHomeQuoteNotifierState;
  } = {},
): boolean {
  const config = options.config ?? getModularHomeQuoteNotifierConfig();
  const state = options.state ?? defaultNotifierState;
  const quoteId = job.quoteId;

  if (!config.enabled || !quoteId || state.queuedQuoteIds.has(quoteId) || state.completedQuoteIds.has(quoteId)) {
    return false;
  }

  state.queuedQuoteIds.add(quoteId);
  const scheduler = options.scheduler ?? ((task: () => void) => {
    setTimeout(task, 0);
  });

  scheduler(() => {
    void sendModularHomeQuoteEmailHandoff(job, {
      client: options.client,
      config,
      state,
    });
  });

  return true;
}

export function resetModularHomeQuoteNotifierForTests(state: ModularHomeQuoteNotifierState = defaultNotifierState) {
  state.completedQuoteIds.clear();
  state.queuedQuoteIds.clear();
}

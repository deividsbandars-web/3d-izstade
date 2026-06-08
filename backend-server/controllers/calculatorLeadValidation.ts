type CalculatorLeadRequestBody = {
  contact_info?: unknown;
  message?: unknown;
  score?: unknown;
  source?: unknown;
};

export type ValidCalculatorLeadRequest = {
  contact_info: {
    calculatorId: string;
    calculatorTitle: string;
    email: string;
    estimateCurrency: string;
    estimateTotal: number;
    name: string;
    notes: string | null;
    phone: string;
    sourcePath: string | null;
    summaryItems: Array<{ label: string; value: string }>;
  };
  message: string;
  score: number;
  source: string;
  status: 'new';
};

const MAX_TEXT_LENGTH = 900;
const MAX_MESSAGE_LENGTH = 2_400;
const MAX_SUMMARY_ITEMS = 8;

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function normalizeRequiredText(value: unknown, code: string) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(code);
  }

  return normalized.slice(0, MAX_TEXT_LENGTH);
}

function normalizeOptionalText(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized.slice(0, MAX_TEXT_LENGTH) : null;
}

function normalizeEmail(value: unknown) {
  const normalized = normalizeRequiredText(value, 'CALCULATOR_LEAD_EMAIL_REQUIRED');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('CALCULATOR_LEAD_EMAIL_INVALID');
  }

  return normalized;
}

function normalizeEstimateTotal(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error('CALCULATOR_LEAD_ESTIMATE_INVALID');
  }

  return Math.round(numeric);
}

function normalizeScore(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 72;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeSummaryItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const label = typeof record.label === 'string' ? record.label.trim().slice(0, 80) : '';
      const itemValue = typeof record.value === 'string' ? record.value.trim().slice(0, 160) : '';
      return label && itemValue ? { label, value: itemValue } : null;
    })
    .filter((item): item is { label: string; value: string } => item !== null)
    .slice(0, MAX_SUMMARY_ITEMS);
}

export function validateCalculatorLeadRequest(body: CalculatorLeadRequestBody): ValidCalculatorLeadRequest {
  const contactInfo = asRecord(body.contact_info);
  if (!contactInfo) {
    throw new Error('CALCULATOR_LEAD_CONTACT_REQUIRED');
  }

  const calculatorId = normalizeRequiredText(contactInfo.calculatorId, 'CALCULATOR_LEAD_CALCULATOR_REQUIRED');
  const source = normalizeRequiredText(body.source, 'CALCULATOR_LEAD_SOURCE_REQUIRED');
  if (source !== `calculator:${calculatorId}`) {
    throw new Error('CALCULATOR_LEAD_SOURCE_INVALID');
  }

  const estimateCurrency = normalizeOptionalText(contactInfo.estimateCurrency) ?? 'EUR';
  const message = normalizeOptionalText(body.message) ?? `Calculator lead: ${calculatorId}`;

  return {
    contact_info: {
      calculatorId,
      calculatorTitle: normalizeRequiredText(contactInfo.calculatorTitle, 'CALCULATOR_LEAD_TITLE_REQUIRED'),
      email: normalizeEmail(contactInfo.email),
      estimateCurrency,
      estimateTotal: normalizeEstimateTotal(contactInfo.estimateTotal),
      name: normalizeRequiredText(contactInfo.name, 'CALCULATOR_LEAD_NAME_REQUIRED'),
      notes: normalizeOptionalText(contactInfo.notes),
      phone: normalizeRequiredText(contactInfo.phone, 'CALCULATOR_LEAD_PHONE_REQUIRED'),
      sourcePath: normalizeOptionalText(contactInfo.sourcePath),
      summaryItems: normalizeSummaryItems(contactInfo.summaryItems),
    },
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    score: normalizeScore(body.score),
    source,
    status: 'new',
  };
}

import { LeadsAPI } from '../../services/leads';

export type CalculatorLeadFormState = {
  email: string;
  name: string;
  notes: string;
  phone: string;
};

export type CalculatorLeadSummaryItem = {
  label: string;
  value: string;
};

export type CalculatorLeadContext = {
  calculatorId: string;
  calculatorTitle: string;
  estimateCurrency?: string;
  estimateTotal: number;
  summaryItems?: CalculatorLeadSummaryItem[];
};

export type CalculatorLeadPersistence = 'backend' | 'backend-fallback';

export type CalculatorLeadRecord = CalculatorLeadFormState & CalculatorLeadContext & {
  capturedAt: string;
  id: string;
  persistence: CalculatorLeadPersistence;
  sourcePath: string;
};

export type CalculatorLeadSubmitResult =
  | {
    persistence: 'backend';
  }
  | {
    localQueueCount: number;
    persistence: 'backend-fallback';
    reason: string;
  };

export const CALCULATOR_LEAD_STORAGE_KEY = 'warpala.calculators.leadRequests';

export const INITIAL_CALCULATOR_LEAD_FORM: CalculatorLeadFormState = {
  email: '',
  name: '',
  notes: '',
  phone: '',
};

function getCalculatorLeadSourcePath() {
  if (typeof window === 'undefined') {
    return '/calculators';
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function normalizeCalculatorLeadForm(form: CalculatorLeadFormState): CalculatorLeadFormState {
  return {
    email: form.email.trim(),
    name: form.name.trim(),
    notes: form.notes.trim(),
    phone: form.phone.trim(),
  };
}

export function validateCalculatorLeadForm(form: CalculatorLeadFormState) {
  const normalized = normalizeCalculatorLeadForm(form);

  if (!normalized.name) {
    return 'Ievadi kontaktpersonas vārdu.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    return 'Ievadi derīgu e-pastu.';
  }

  if (!normalized.phone) {
    return 'Ievadi tālruni, lai meistars var precizēt objektu.';
  }

  return null;
}

export function buildCalculatorLeadPayload(
  form: CalculatorLeadFormState,
  context: CalculatorLeadContext,
) {
  const normalized = normalizeCalculatorLeadForm(form);
  const estimateCurrency = context.estimateCurrency ?? 'EUR';
  const sourcePath = getCalculatorLeadSourcePath();
  const summaryLines = context.summaryItems?.map((item) => `${item.label}: ${item.value}`) ?? [];

  return {
    contact_info: {
      calculatorId: context.calculatorId,
      calculatorTitle: context.calculatorTitle,
      email: normalized.email,
      estimateCurrency,
      estimateTotal: Math.round(context.estimateTotal),
      name: normalized.name,
      notes: normalized.notes,
      phone: normalized.phone,
      sourcePath,
      summaryItems: context.summaryItems ?? [],
    },
    message: [
      `Calculator: ${context.calculatorTitle}`,
      `Estimate: ${Math.round(context.estimateTotal)} ${estimateCurrency}`,
      ...summaryLines,
      normalized.notes ? '' : null,
      normalized.notes ? `Client notes: ${normalized.notes}` : null,
    ].filter((line): line is string => line !== null).join('\n'),
    score: 72,
    source: `calculator:${context.calculatorId}`,
    status: 'new',
  };
}

export function readCalculatorLeadQueue(): CalculatorLeadRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CALCULATOR_LEAD_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed.slice(-49) as CalculatorLeadRecord[] : [];
  } catch {
    return [];
  }
}

export function saveCalculatorLeadRequest(
  form: CalculatorLeadFormState,
  context: CalculatorLeadContext,
  persistence: CalculatorLeadPersistence,
) {
  const normalized = normalizeCalculatorLeadForm(form);
  const capturedAt = new Date().toISOString();
  const record: CalculatorLeadRecord = {
    ...context,
    ...normalized,
    capturedAt,
    id: `calculator-lead-${context.calculatorId}-${capturedAt}`,
    persistence,
    sourcePath: getCalculatorLeadSourcePath(),
  };
  const nextQueue = [...readCalculatorLeadQueue(), record].slice(-50);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CALCULATOR_LEAD_STORAGE_KEY, JSON.stringify(nextQueue));
  }

  return nextQueue.length;
}

function normalizeSubmitError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'LEAD_API_UNAVAILABLE';
}

export async function submitCalculatorLeadRequest(
  form: CalculatorLeadFormState,
  context: CalculatorLeadContext,
): Promise<CalculatorLeadSubmitResult> {
  const validationError = validateCalculatorLeadForm(form);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    await LeadsAPI.createLead(buildCalculatorLeadPayload(form, context));
    return { persistence: 'backend' };
  } catch (error) {
    const localQueueCount = saveCalculatorLeadRequest(form, context, 'backend-fallback');
    return {
      localQueueCount,
      persistence: 'backend-fallback',
      reason: normalizeSubmitError(error),
    };
  }
}

import { useState, type FormEvent } from 'react';
import {
  type ModularHomeConfiguratorState,
} from './modularHomeConfigurator';
import {
  formatHomeEstimateEur,
  type ModularHomeEstimate,
} from './modularHomeEstimate';
import { isHomeQuoteBackendEnabled } from './homeQuoteBackendFlags';
import {
  MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT,
  submitModularHomeQuoteBackend,
} from './modularHomeQuoteBackend';

export const MODULAR_HOME_QUOTE_PREVIEW_QUEUE_KEY = 'warpala.modularHomeQuotePreviewQueue';

type ModularHomeQuoteFormFields = {
  budgetRange: string;
  consentGiven: boolean;
  countryCity: string;
  email: string;
  landOwned: string;
  message: string;
  name: string;
  phone: string;
  targetBuildDate: string;
};

export type ModularHomeQuotePreviewRequest = ModularHomeQuoteFormFields & {
  config: ModularHomeConfiguratorState;
  consentText: string;
  createdAt: string;
  disclaimer: string;
  estimatedTotal: number;
  estimatedTotalLabel: string;
  id: string;
  model: string;
  selectedOptions: ModularHomeEstimate['selectedOptions'];
  source: 'homeDemoPreview';
  status: 'preview-local-only';
};

const LAND_OWNED_OPTIONS = [
  { label: 'Select land status', value: '' },
  { label: 'Yes, land is owned', value: 'yes' },
  { label: 'No, land is not owned yet', value: 'no' },
] as const;

const TARGET_BUILD_DATE_OPTIONS = [
  { label: 'Select target date', value: '' },
  { label: '0-3 months', value: '0-3-months' },
  { label: '3-6 months', value: '3-6-months' },
  { label: '6-12 months', value: '6-12-months' },
  { label: '12+ months', value: '12-plus-months' },
  { label: 'Research phase', value: 'research-phase' },
] as const;

const BUDGET_RANGE_OPTIONS = [
  { label: 'Select budget range', value: '' },
  { label: 'Under EUR 50k', value: 'under-50k' },
  { label: 'EUR 50k-100k', value: '50k-100k' },
  { label: 'EUR 100k-150k', value: '100k-150k' },
  { label: 'EUR 150k+', value: '150k-plus' },
  { label: 'Not sure yet', value: 'not-sure' },
] as const;

const MODULAR_HOME_QUOTE_LOCAL_CONSENT_TEXT = 'Preview only - save this request locally. No live submission or backend persistence yet.';

type ModularHomeQuoteFormProps = {
  config: ModularHomeConfiguratorState;
  estimate: ModularHomeEstimate;
  isTouchDevice?: boolean;
};

const EMPTY_FORM: ModularHomeQuoteFormFields = {
  budgetRange: '',
  consentGiven: false,
  countryCity: '',
  email: '',
  landOwned: '',
  message: '',
  name: '',
  phone: '',
  targetBuildDate: '',
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function readPreviewQueue(): ModularHomeQuotePreviewRequest[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(MODULAR_HOME_QUOTE_PREVIEW_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePreviewQueue(queue: readonly ModularHomeQuotePreviewRequest[]): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(MODULAR_HOME_QUOTE_PREVIEW_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

function createPreviewRequest(
  fields: ModularHomeQuoteFormFields,
  config: ModularHomeConfiguratorState,
  estimate: ModularHomeEstimate,
): ModularHomeQuotePreviewRequest {
  return {
    budgetRange: fields.budgetRange,
    config,
    consentGiven: fields.consentGiven,
    consentText: MODULAR_HOME_QUOTE_LOCAL_CONSENT_TEXT,
    countryCity: fields.countryCity.trim(),
    createdAt: new Date().toISOString(),
    disclaimer: estimate.disclaimer,
    email: fields.email.trim(),
    estimatedTotal: estimate.estimatedTotal,
    estimatedTotalLabel: formatHomeEstimateEur(estimate.estimatedTotal),
    id: `modular-home-preview-${Date.now()}`,
    landOwned: fields.landOwned,
    message: fields.message.trim(),
    model: estimate.baseModel,
    name: fields.name.trim(),
    phone: fields.phone.trim(),
    selectedOptions: estimate.selectedOptions,
    source: 'homeDemoPreview',
    status: 'preview-local-only',
    targetBuildDate: fields.targetBuildDate,
  };
}

function stopFormEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeQuoteForm({ config, estimate, isTouchDevice = false }: ModularHomeQuoteFormProps) {
  const backendSubmissionEnabled = isHomeQuoteBackendEnabled();
  const consentText = backendSubmissionEnabled
    ? MODULAR_HOME_QUOTE_BACKEND_CONSENT_TEXT
    : MODULAR_HOME_QUOTE_LOCAL_CONSENT_TEXT;
  const [fields, setFields] = useState<ModularHomeQuoteFormFields>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueCount, setQueueCount] = useState(() => readPreviewQueue().length);
  const [success, setSuccess] = useState('');

  const updateField = <Key extends keyof ModularHomeQuoteFormFields>(
    field: Key,
    value: ModularHomeQuoteFormFields[Key],
  ) => {
    setFields((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!fields.name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!fields.email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!isValidEmail(fields.email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!fields.phone.trim()) {
      setError('Phone is required.');
      return;
    }

    if (!fields.countryCity.trim()) {
      setError('Country / city is required.');
      return;
    }

    if (!fields.landOwned) {
      setError('Land owned status is required.');
      return;
    }

    if (!fields.targetBuildDate) {
      setError('Target build date is required.');
      return;
    }

    if (!fields.budgetRange) {
      setError('Budget range is required.');
      return;
    }

    if (!fields.message.trim()) {
      setError('Project message is required.');
      return;
    }

    if (!fields.consentGiven) {
      setError(backendSubmissionEnabled
        ? 'Consent is required before submitting this backend quote request.'
        : 'Consent is required for this local preview request.');
      return;
    }

    if (backendSubmissionEnabled) {
      setIsSubmitting(true);
      setSuccess('');
      setError('');

      try {
        const result = await submitModularHomeQuoteBackend(fields, config, estimate);
        setFields(EMPTY_FORM);
        setSuccess(result.id
          ? `Quote request submitted. Reference: ${result.id}.`
          : 'Quote request submitted.');
      } catch (submitError) {
        setSuccess('');
        setError(submitError instanceof Error ? submitError.message : 'Quote backend submission failed.');
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const request = createPreviewRequest(fields, config, estimate);
    const nextQueue = [...readPreviewQueue(), request];
    const saved = writePreviewQueue(nextQueue);
    if (!saved) {
      setSuccess('');
      setError('Could not save the preview quote locally. Browser storage may be disabled or full.');
      return;
    }

    setQueueCount(nextQueue.length);
    setFields(EMPTY_FORM);
    setError('');
    setSuccess('Quote request saved locally in preview mode.');
  };

  const inputStyle = {
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    borderRadius: '10px',
    color: '#eff6ff',
    font: 'inherit',
    fontSize: isTouchDevice ? '0.66rem' : '0.7rem',
    fontWeight: 780,
    minWidth: 0,
    outline: 'none',
    padding: isTouchDevice ? '8px 9px' : '9px 10px',
  } as const;

  const labelStyle = {
    color: '#bfdbfe',
    display: 'grid',
    fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
    fontWeight: 900,
    gap: '5px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  } as const;

  return (
    <section
      aria-label={`${estimate.baseModel} preview quote request`}
      data-home-quote-form="true"
      style={{
        background: 'linear-gradient(180deg, rgba(22, 78, 99, 0.36), rgba(2, 6, 23, 0.66))',
        border: '1px solid rgba(45, 212, 191, 0.28)',
        borderRadius: isTouchDevice ? '15px' : '17px',
        marginTop: isTouchDevice ? '10px' : '12px',
        padding: isTouchDevice ? '10px' : '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div style={{ color: '#67e8f9', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {backendSubmissionEnabled ? 'Backend quote request' : 'Preview quote request'}
          </div>
          <div style={{ color: '#ecfeff', fontSize: isTouchDevice ? '0.8rem' : '0.88rem', fontWeight: 950, marginTop: '4px' }}>
            Request {estimate.baseModel} details
          </div>
        </div>
        <div
          data-home-quote-queue-count={queueCount}
          style={{
            background: 'rgba(15, 23, 42, 0.58)',
            border: '1px solid rgba(45, 212, 191, 0.24)',
            borderRadius: '999px',
            color: '#a5f3fc',
            fontSize: '0.54rem',
            fontWeight: 900,
            padding: '5px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          {backendSubmissionEnabled ? 'Backend mode' : `Local queue ${queueCount}`}
        </div>
      </div>

      <div
        data-home-quote-attached-summary="true"
        style={{
          color: '#cffafe',
          fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
          fontWeight: 820,
          lineHeight: 1.35,
          marginTop: '8px',
        }}
      >
        Attached: {estimate.baseModel} / {estimate.selectedOptions.facade} / {estimate.selectedOptions.roof} / {estimate.selectedOptions.terrace} / {estimate.selectedOptions.finishLevel} / {formatHomeEstimateEur(estimate.estimatedTotal)}
      </div>

      <form
        data-home-quote-form-fields="true"
        noValidate
        onClick={stopFormEvent}
        onMouseDown={stopFormEvent}
        onPointerDown={stopFormEvent}
        onSubmit={submitQuote}
        style={{ display: 'grid', gap: '8px', marginTop: isTouchDevice ? '9px' : '10px' }}
      >
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isTouchDevice ? '1fr' : '1fr 1fr' }}>
          <label style={labelStyle}>
            Name
            <input
              data-home-quote-field="name"
              value={fields.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Your name"
              style={inputStyle}
              type="text"
            />
          </label>
          <label style={labelStyle}>
            Email
            <input
              data-home-quote-field="email"
              value={fields.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="name@example.com"
              style={inputStyle}
              type="email"
            />
          </label>
        </div>

        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isTouchDevice ? '1fr' : '1fr 1fr' }}>
          <label style={labelStyle}>
            Phone
            <input
              data-home-quote-field="phone"
              value={fields.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="+371 ..."
              style={inputStyle}
              type="tel"
            />
          </label>
          <label style={labelStyle}>
            Country / city
            <input
              data-home-quote-field="countryCity"
              value={fields.countryCity}
              onChange={(event) => updateField('countryCity', event.target.value)}
              placeholder="Latvia / Riga"
              style={inputStyle}
              type="text"
            />
          </label>
        </div>

        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isTouchDevice ? '1fr' : '1fr 1fr' }}>
          <label style={labelStyle}>
            Land owned
            <select
              data-home-quote-field="landOwned"
              value={fields.landOwned}
              onChange={(event) => updateField('landOwned', event.target.value)}
              style={inputStyle}
            >
              {LAND_OWNED_OPTIONS.map((option) => (
                <option key={option.value || 'empty-land-owned'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Target build date
            <select
              data-home-quote-field="targetBuildDate"
              value={fields.targetBuildDate}
              onChange={(event) => updateField('targetBuildDate', event.target.value)}
              style={inputStyle}
            >
              {TARGET_BUILD_DATE_OPTIONS.map((option) => (
                <option key={option.value || 'empty-target-build-date'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Budget range
          <select
            data-home-quote-field="budgetRange"
            value={fields.budgetRange}
            onChange={(event) => updateField('budgetRange', event.target.value)}
            style={inputStyle}
          >
            {BUDGET_RANGE_OPTIONS.map((option) => (
              <option key={option.value || 'empty-budget-range'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Message
          <textarea
            data-home-quote-field="message"
            value={fields.message}
            onChange={(event) => updateField('message', event.target.value)}
            placeholder="Tell us about the plot, timing or finish level."
            rows={3}
            style={{ ...inputStyle, lineHeight: 1.3, resize: 'vertical' }}
          />
        </label>

        <label
          data-home-quote-consent-row="true"
          style={{
            alignItems: 'start',
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(45, 212, 191, 0.18)',
            borderRadius: '12px',
            color: '#cffafe',
            display: 'grid',
            fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
            fontWeight: 820,
            gap: '8px',
            gridTemplateColumns: '16px 1fr',
            lineHeight: 1.3,
            padding: isTouchDevice ? '8px 9px' : '9px 10px',
          }}
        >
          <input
            checked={fields.consentGiven}
            data-home-quote-field="consentGiven"
            onChange={(event) => updateField('consentGiven', event.target.checked)}
            style={{ marginTop: '2px' }}
            type="checkbox"
          />
          <span>
            {consentText}
          </span>
        </label>

        {error ? (
          <div data-home-quote-error="true" style={{ color: '#fecaca', fontSize: '0.62rem', fontWeight: 900 }}>
            {error}
          </div>
        ) : null}

        {success ? (
          <div data-home-quote-success="true" style={{ color: '#bbf7d0', fontSize: '0.62rem', fontWeight: 900 }}>
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          data-home-quote-submit="true"
          disabled={isSubmitting}
          style={{
            background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.96), rgba(96, 165, 250, 0.9))',
            border: 'none',
            borderRadius: '12px',
            color: '#082f49',
            cursor: isSubmitting ? 'wait' : 'pointer',
            font: 'inherit',
            fontSize: isTouchDevice ? '0.68rem' : '0.72rem',
            fontWeight: 950,
            letterSpacing: '0.04em',
            opacity: isSubmitting ? 0.74 : 1,
            padding: isTouchDevice ? '9px 10px' : '10px 12px',
            textTransform: 'uppercase',
          }}
        >
          {backendSubmissionEnabled
            ? isSubmitting ? 'Submitting quote request' : 'Submit real quote request'
            : 'Save preview quote request'}
        </button>

        <div
          data-home-quote-disclaimer="true"
          style={{
            borderTop: '1px solid rgba(45, 212, 191, 0.18)',
            color: '#67e8f9',
            fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
            fontWeight: 800,
            lineHeight: 1.28,
            paddingTop: '8px',
          }}
        >
          {backendSubmissionEnabled
            ? 'Backend submission enabled by URL flag \u00b7 server feature flag must also be enabled.'
            : 'Preview only \u00b7 no live submission. No live quote submitted yet.'}
        </div>
      </form>
    </section>
  );
}

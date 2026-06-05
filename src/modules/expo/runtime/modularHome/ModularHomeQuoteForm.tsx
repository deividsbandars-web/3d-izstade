import { useState, type FormEvent } from 'react';
import {
  type ModularHomeConfiguratorState,
} from './modularHomeConfigurator';
import {
  formatHomeEstimateEur,
  type ModularHomeEstimate,
} from './modularHomeEstimate';

export const MODULAR_HOME_QUOTE_PREVIEW_QUEUE_KEY = 'warpala.modularHomeQuotePreviewQueue';

type ModularHomeQuoteFormFields = {
  countryCity: string;
  email: string;
  message: string;
  name: string;
  phone: string;
};

export type ModularHomeQuotePreviewRequest = ModularHomeQuoteFormFields & {
  config: ModularHomeConfiguratorState;
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

type ModularHomeQuoteFormProps = {
  config: ModularHomeConfiguratorState;
  estimate: ModularHomeEstimate;
  isTouchDevice?: boolean;
};

const EMPTY_FORM: ModularHomeQuoteFormFields = {
  countryCity: '',
  email: '',
  message: '',
  name: '',
  phone: '',
};

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
    config,
    countryCity: fields.countryCity.trim(),
    createdAt: new Date().toISOString(),
    disclaimer: estimate.disclaimer,
    email: fields.email.trim(),
    estimatedTotal: estimate.totalPrice,
    estimatedTotalLabel: formatHomeEstimateEur(estimate.totalPrice),
    id: `modular-home-preview-${Date.now()}`,
    message: fields.message.trim(),
    model: estimate.baseModel,
    name: fields.name.trim(),
    phone: fields.phone.trim(),
    selectedOptions: estimate.selectedOptions,
    source: 'homeDemoPreview',
    status: 'preview-local-only',
  };
}

function stopFormEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeQuoteForm({ config, estimate, isTouchDevice = false }: ModularHomeQuoteFormProps) {
  const [fields, setFields] = useState<ModularHomeQuoteFormFields>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [queueCount, setQueueCount] = useState(() => readPreviewQueue().length);
  const [success, setSuccess] = useState('');

  const updateField = (field: keyof ModularHomeQuoteFormFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const submitQuote = (event: FormEvent<HTMLFormElement>) => {
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
            Preview quote request
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
          Local queue {queueCount}
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
        Attached: {estimate.baseModel} / {estimate.selectedOptions.facade} / {estimate.selectedOptions.roof} / {estimate.selectedOptions.terrace} / {estimate.selectedOptions.finishLevel} / {formatHomeEstimateEur(estimate.totalPrice)}
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
            Phone optional
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
          style={{
            background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.96), rgba(96, 165, 250, 0.9))',
            border: 'none',
            borderRadius: '12px',
            color: '#082f49',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: isTouchDevice ? '0.68rem' : '0.72rem',
            fontWeight: 950,
            letterSpacing: '0.04em',
            padding: isTouchDevice ? '9px 10px' : '10px 12px',
            textTransform: 'uppercase',
          }}
        >
          Save preview quote request
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
          {'Preview only \u00b7 no live submission. No live quote submitted yet.'}
        </div>
      </form>
    </section>
  );
}

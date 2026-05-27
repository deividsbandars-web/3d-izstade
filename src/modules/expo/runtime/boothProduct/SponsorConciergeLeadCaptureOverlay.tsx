import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { isBoothProductPreviewEnabled } from './boothProductPreviewFlags';

type SponsorConciergeLeadCaptureOverlayProps = {
  isTouchDevice?: boolean;
};

type LeadCaptureFormState = {
  company: string;
  email: string;
  interest: string;
  name: string;
};

type SubmitStatus =
  | { message: string; tone: 'idle' }
  | { message: string; tone: 'error' }
  | { message: string; tone: 'success' };

type PreviewLeadRecord = LeadCaptureFormState & {
  boothId: 'sponsor-concierge';
  capturedAt: string;
  packageTier: 'premium';
  persistence: 'local-preview';
  sourcePath: string;
};

const SPONSOR_CONCIERGE_LEAD_STORAGE_KEY = 'warpala.expo.sponsorConcierge.previewLeads';

const INITIAL_FORM_STATE: LeadCaptureFormState = {
  company: '',
  email: '',
  interest: '',
  name: '',
};

function normalizeFormState(form: LeadCaptureFormState): LeadCaptureFormState {
  return {
    company: form.company.trim(),
    email: form.email.trim(),
    interest: form.interest.trim(),
    name: form.name.trim(),
  };
}

function validateLeadForm(form: LeadCaptureFormState) {
  const normalized = normalizeFormState(form);

  if (!normalized.name) {
    return 'Enter a contact name.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    return 'Enter a valid work email.';
  }

  if (!normalized.company) {
    return 'Enter a company name.';
  }

  if (!normalized.interest) {
    return 'Add what the sponsor wants to discuss.';
  }

  return null;
}

function readPreviewLeadQueue(): PreviewLeadRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SPONSOR_CONCIERGE_LEAD_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed.slice(-24) as PreviewLeadRecord[] : [];
  } catch {
    return [];
  }
}

function savePreviewLead(form: LeadCaptureFormState) {
  const normalized = normalizeFormState(form);
  const record: PreviewLeadRecord = {
    ...normalized,
    boothId: 'sponsor-concierge',
    capturedAt: new Date().toISOString(),
    packageTier: 'premium',
    persistence: 'local-preview',
    sourcePath: typeof window === 'undefined' ? '/expo-3d' : `${window.location.pathname}${window.location.search}`,
  };
  const nextQueue = [...readPreviewLeadQueue(), record].slice(-25);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SPONSOR_CONCIERGE_LEAD_STORAGE_KEY, JSON.stringify(nextQueue));
  }

  return nextQueue.length;
}

export function SponsorConciergeLeadCaptureOverlay({
  isTouchDevice = false,
}: SponsorConciergeLeadCaptureOverlayProps) {
  const previewEnabled = isBoothProductPreviewEnabled();
  const [form, setForm] = useState<LeadCaptureFormState>(INITIAL_FORM_STATE);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({
    message: 'Preview lead capture stores locally only. Backend persistence is not connected yet.',
    tone: 'idle',
  });
  const isFormReady = useMemo(() => validateLeadForm(form) === null, [form]);

  if (!previewEnabled) {
    return null;
  }

  const updateField = (field: keyof LeadCaptureFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const nextValue = event.target.value;
    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }));
    if (submitStatus.tone !== 'idle') {
      setSubmitStatus({
        message: 'Preview lead capture stores locally only. Backend persistence is not connected yet.',
        tone: 'idle',
      });
    }
  };

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateLeadForm(form);

    if (validationError) {
      setSubmitStatus({ message: validationError, tone: 'error' });
      return;
    }

    try {
      const queuedCount = savePreviewLead(form);
      setSubmitStatus({
        message: `Preview lead saved locally. Queue: ${queuedCount}. Backend handoff still required.`,
        tone: 'success',
      });
    } catch {
      setSubmitStatus({
        message: 'Preview lead captured in the form, but local browser storage is unavailable.',
        tone: 'error',
      });
    }
  };

  const fieldStyle = {
    background: 'rgba(2, 6, 23, 0.58)',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    borderRadius: '11px',
    color: '#f8fafc',
    font: 'inherit',
    fontSize: isTouchDevice ? '0.72rem' : '0.74rem',
    fontWeight: 750,
    outline: 'none',
    padding: isTouchDevice ? '8px 9px' : '8px 10px',
    width: '100%',
  } as const;

  const statusColor = submitStatus.tone === 'success'
    ? '#86efac'
    : submitStatus.tone === 'error'
      ? '#fecaca'
      : '#a8b5c7';

  return (
    <form
      aria-label="Sponsor Concierge lead capture"
      data-booth-product-lead-capture-booth="sponsor-concierge"
      data-booth-product-lead-capture-overlay="true"
      data-booth-product-lead-submit-mode="local-preview"
      onSubmit={submitLead}
      style={{
        background:
          'radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.16), transparent 32%), linear-gradient(180deg, rgba(6, 12, 24, 0.92), rgba(15, 23, 42, 0.8))',
        border: '1px solid rgba(134, 239, 172, 0.3)',
        borderRadius: isTouchDevice ? '17px' : '20px',
        bottom: isTouchDevice ? 'auto' : '26px',
        boxShadow: '0 22px 54px rgba(2, 6, 23, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        color: '#f8fafc',
        display: 'grid',
        gap: isTouchDevice ? '8px' : '9px',
        fontFamily: 'inherit',
        padding: isTouchDevice ? '11px 12px' : '14px 15px',
        pointerEvents: 'auto',
        position: 'absolute',
        right: isTouchDevice ? '12px' : '26px',
        left: isTouchDevice ? '12px' : 'auto',
        maxHeight: isTouchDevice ? 'calc(100dvh - 260px)' : 'none',
        overflowY: isTouchDevice ? 'auto' : 'visible',
        top: isTouchDevice ? 'max(126px, calc(env(safe-area-inset-top) + 122px))' : 'auto',
        width: isTouchDevice ? 'auto' : '318px',
        zIndex: 116,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
        <div>
          <div style={{ color: '#86efac', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Premium lead capture
          </div>
          <div style={{ marginTop: '3px', color: '#f8fafc', fontSize: isTouchDevice ? '0.82rem' : '0.9rem', fontWeight: 950 }}>
            Sponsor Concierge
          </div>
          <div style={{ color: '#cbd5e1', fontSize: isTouchDevice ? '0.62rem' : '0.66rem', fontWeight: 750, lineHeight: 1.28 }}>
            Capture meeting interest for the premium sponsor package.
          </div>
        </div>
        <span
          style={{
            border: '1px solid rgba(125, 211, 252, 0.32)',
            borderRadius: '999px',
            color: '#bae6fd',
            fontSize: '0.52rem',
            fontWeight: 950,
            letterSpacing: '0.1em',
            padding: '4px 7px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Local MVP
        </span>
      </div>

      <div style={{ display: 'grid', gap: '7px' }}>
        <input
          aria-label="Contact name"
          data-booth-product-lead-field="name"
          onChange={updateField('name')}
          placeholder="Name"
          style={fieldStyle}
          value={form.name}
        />
        <input
          aria-label="Work email"
          data-booth-product-lead-field="email"
          inputMode="email"
          onChange={updateField('email')}
          placeholder="Work email"
          style={fieldStyle}
          type="email"
          value={form.email}
        />
        <input
          aria-label="Company"
          data-booth-product-lead-field="company"
          onChange={updateField('company')}
          placeholder="Company"
          style={fieldStyle}
          value={form.company}
        />
        <textarea
          aria-label="Sponsor interest"
          data-booth-product-lead-field="interest"
          onChange={updateField('interest')}
          placeholder="Interested in meetings, Demo Arena sponsorship, or lead reports?"
          rows={2}
          style={{ ...fieldStyle, resize: 'none' }}
          value={form.interest}
        />
      </div>

      <button
        data-booth-product-lead-submit="true"
        style={{
          background: isFormReady
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.94), rgba(20, 184, 166, 0.82))'
            : 'rgba(71, 85, 105, 0.62)',
          border: '1px solid rgba(220, 252, 231, 0.2)',
          borderRadius: '999px',
          color: isFormReady ? '#052e16' : '#cbd5e1',
          cursor: 'pointer',
          fontSize: isTouchDevice ? '0.64rem' : '0.68rem',
          fontWeight: 950,
          letterSpacing: '0.08em',
          padding: isTouchDevice ? '8px 10px' : '9px 12px',
          textTransform: 'uppercase',
        }}
        type="submit"
      >
        Save Preview Lead
      </button>

      <div
        data-booth-product-lead-status={submitStatus.tone}
        style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.14)',
          color: statusColor,
          fontSize: '0.58rem',
          fontWeight: 800,
          lineHeight: 1.25,
          paddingTop: '7px',
        }}
      >
        {submitStatus.message}
      </div>
    </form>
  );
}

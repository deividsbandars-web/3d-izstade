import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  INITIAL_CALCULATOR_LEAD_FORM,
  submitCalculatorLeadRequest,
  validateCalculatorLeadForm,
  type CalculatorLeadContext,
  type CalculatorLeadFormState,
} from './calculatorLeadCapture';

type CalculatorLeadCtaProps = CalculatorLeadContext;

type SubmitStatus =
  | { message: string; tone: 'idle' }
  | { message: string; tone: 'error' }
  | { message: string; tone: 'submitting' }
  | { message: string; tone: 'success' }
  | { message: string; tone: 'warning' };

const inputStyle = {
  background: 'rgba(15, 23, 42, 0.82)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '12px',
  color: '#f8fafc',
  font: 'inherit',
  fontSize: '0.9rem',
  fontWeight: 700,
  outline: 'none',
  padding: '12px 13px',
  width: '100%',
} as const;

const idleStatusMessage =
  'Nosūti aprēķinu pārbaudei. Speciālists precizēs apjomu un nākamo soli pirms gala cenas.';

const trustItems = [
  'Speciālists pārbauda aprēķinu',
  'Atbilde ar nākamo soli',
  'Nav gala cena bez objekta precizēšanas',
];

function getStatusColor(tone: SubmitStatus['tone']) {
  switch (tone) {
    case 'success':
      return '#86efac';
    case 'warning':
      return '#fde68a';
    case 'error':
      return '#fecaca';
    case 'submitting':
      return '#bfdbfe';
    default:
      return '#94a3b8';
  }
}

export function CalculatorLeadCta({
  calculatorId,
  calculatorTitle,
  estimateCurrency = 'EUR',
  estimateTotal,
  summaryItems = [],
}: CalculatorLeadCtaProps) {
  const [form, setForm] = useState<CalculatorLeadFormState>(INITIAL_CALCULATOR_LEAD_FORM);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({
    message: idleStatusMessage,
    tone: 'idle',
  });
  const isFormReady = useMemo(() => validateCalculatorLeadForm(form) === null, [form]);
  const isSubmitting = submitStatus.tone === 'submitting';
  const roundedEstimate = Math.round(estimateTotal);

  const updateField = (field: keyof CalculatorLeadFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

    if (submitStatus.tone !== 'idle') {
      setSubmitStatus({
        message: idleStatusMessage,
        tone: 'idle',
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateCalculatorLeadForm(form);

    if (validationError) {
      setSubmitStatus({ message: validationError, tone: 'error' });
      return;
    }

    try {
      setSubmitStatus({ message: 'Sūtu tāmes pieprasījumu...', tone: 'submitting' });
      const result = await submitCalculatorLeadRequest(form, {
        calculatorId,
        calculatorTitle,
        estimateCurrency,
        estimateTotal,
        summaryItems,
      });

      if (result.persistence === 'backend') {
        setSubmitStatus({
          message: 'Pieprasījums nosūtīts. Komanda pārbaudīs aprēķinu un sazināsies par nākamo soli.',
          tone: 'success',
        });
        setForm(INITIAL_CALCULATOR_LEAD_FORM);
        return;
      }

      setSubmitStatus({
        message: `Savienojums īslaicīgi nav pieejams (${result.reason}); pieprasījums saglabāts šajā pārlūkā. Rinda: ${result.localQueueCount}.`,
        tone: 'warning',
      });
    } catch {
      setSubmitStatus({
        message: 'Pieprasījumu nevar nosūtīt. Pārbaudi obligātos laukus.',
        tone: 'error',
      });
    }
  };

  return (
    <form
      aria-label={`${calculatorTitle} piedāvājuma pieprasījums`}
      data-calculator-lead-cta={calculatorId}
      onSubmit={handleSubmit}
      style={{
        background: 'linear-gradient(145deg, rgba(2, 6, 23, 0.86), rgba(15, 23, 42, 0.72))',
        border: '1px solid rgba(56, 189, 248, 0.24)',
        borderRadius: '22px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        display: 'grid',
        gap: '14px',
        marginTop: '22px',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#7dd3fc', fontSize: '0.7rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Nākamais solis
          </div>
          <h4 style={{ color: '#f8fafc', fontSize: '1.18rem', letterSpacing: '-0.03em', margin: '7px 0 5px' }}>
            Saņemt pārbaudītu piedāvājumu
          </h4>
          <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.45, margin: 0 }}>
            Nosūti aprēķinu pārbaudei, lai speciālists precizē objektu, materiālus un darbu apjomu.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase' }}>Tāmes signāls</div>
          <strong style={{ color: '#f8fafc', fontSize: '1.3rem' }}>{roundedEstimate.toLocaleString('lv-LV')} {estimateCurrency}</strong>
        </div>
      </div>

      {summaryItems.length > 0 && (
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          {summaryItems.slice(0, 4).map((item) => (
            <div key={item.label} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: '14px', padding: '10px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ color: '#e2e8f0', fontSize: '0.86rem', fontWeight: 850, marginTop: '4px' }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {trustItems.map((item) => (
          <span
            key={item}
            style={{
              background: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(125, 211, 252, 0.2)',
              borderRadius: '999px',
              color: '#bae6fd',
              fontSize: '0.68rem',
              fontWeight: 850,
              letterSpacing: '0.03em',
              padding: '7px 10px',
            }}
          >
            {item}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <input aria-label="Vārds" autoComplete="name" onChange={updateField('name')} placeholder="Vārds" style={inputStyle} value={form.name} />
        <input aria-label="E-pasts" autoComplete="email" inputMode="email" onChange={updateField('email')} placeholder="E-pasts" style={inputStyle} type="email" value={form.email} />
        <input aria-label="Tālrunis" autoComplete="tel" inputMode="tel" onChange={updateField('phone')} placeholder="Tālrunis" style={inputStyle} value={form.phone} />
      </div>

      <textarea
        aria-label="Papildu piezīmes"
        onChange={updateField('notes')}
        placeholder="Objekta adrese, vēlamais termiņš vai svarīgākās detaļas..."
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
        value={form.notes}
      />

      <button
        disabled={isSubmitting}
        style={{
          background: isFormReady && !isSubmitting ? 'linear-gradient(135deg, #38bdf8, #22c55e)' : 'rgba(71, 85, 105, 0.66)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '999px',
          color: isFormReady && !isSubmitting ? '#03131a' : '#cbd5e1',
          cursor: isSubmitting ? 'progress' : 'pointer',
          fontSize: '0.82rem',
          fontWeight: 950,
          letterSpacing: '0.08em',
          padding: '13px 16px',
          textTransform: 'uppercase',
        }}
        type="submit"
      >
        {isSubmitting ? 'Sūta pieprasījumu...' : 'Saņemt piedāvājumu'}
      </button>

      <p style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: 1.45, margin: 0 }}>
        Nosūtot pieprasījumu, kontaktinformācija tiek izmantota tāmes sagatavošanai un saziņai par šo aprēķinu.{' '}
        <a href="/privacy" style={{ color: '#bae6fd', fontWeight: 900, textDecoration: 'underline' }}>
          Privātuma politika
        </a>
        .
      </p>

      <div data-calculator-lead-status={submitStatus.tone} style={{ color: getStatusColor(submitStatus.tone), fontSize: '0.74rem', fontWeight: 800, lineHeight: 1.38 }}>
        {submitStatus.message}
      </div>
    </form>
  );
}

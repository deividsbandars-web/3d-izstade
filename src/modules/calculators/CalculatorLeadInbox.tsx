import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LeadsAPI } from '../../services/leads';
import {
  CALCULATOR_LEAD_STORAGE_KEY,
  readCalculatorLeadQueue,
  type CalculatorLeadRecord,
  type CalculatorLeadSummaryItem,
} from './calculatorLeadCapture';

type BackendCalculatorLead = {
  contact_info?: Record<string, unknown> | null;
  created_at?: string | null;
  id?: string | number | null;
  message?: string | null;
  notes?: string | null;
  score?: number | null;
  source?: string | null;
  status?: string | null;
  value?: number | string | null;
};

type BackendLoadState =
  | { message: string; rows: BackendCalculatorLead[]; status: 'error' }
  | { message: string; rows: BackendCalculatorLead[]; status: 'idle' }
  | { message: string; rows: BackendCalculatorLead[]; status: 'loading' }
  | { message: string; rows: BackendCalculatorLead[]; status: 'success' };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function normalizeBackendRows(response: unknown): BackendCalculatorLead[] {
  if (Array.isArray(response)) {
    return response as BackendCalculatorLead[];
  }

  const record = asRecord(response);
  if (!record) {
    return [];
  }

  if (Array.isArray(record.data)) {
    return record.data as BackendCalculatorLead[];
  }

  if (Array.isArray(record.leads)) {
    return record.leads as BackendCalculatorLead[];
  }

  return [];
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Nav laika';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('lv-LV', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(value: unknown, currency = 'EUR') {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 'Nav tāmes';
  }

  return `${Math.round(numeric).toLocaleString('lv-LV')} ${currency}`;
}

function getContactInfo(lead: BackendCalculatorLead) {
  return asRecord(lead.contact_info) ?? {};
}

function getBackendCalculatorId(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  const fromContact = typeof contactInfo.calculatorId === 'string' ? contactInfo.calculatorId : '';
  if (fromContact) {
    return fromContact;
  }

  return String(lead.source || '').replace('calculator:', '') || 'calculator';
}

function getBackendEstimate(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return Number(contactInfo.estimateTotal || lead.value || 0) || 0;
}

function getBackendLeadName(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(contactInfo.name || contactInfo.company_name || 'Bez vārda');
}

function getBackendLeadEmail(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(contactInfo.email || contactInfo.clientEmail || 'Nav e-pasta');
}

function getBackendLeadPhone(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(contactInfo.phone || 'Nav tālruņa');
}

function getBackendLeadMessage(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(lead.message || lead.notes || contactInfo.message || contactInfo.notes || '').trim();
}

function getBackendSummaryItems(lead: BackendCalculatorLead): CalculatorLeadSummaryItem[] {
  const contactInfo = getContactInfo(lead);
  return Array.isArray(contactInfo.summaryItems) ? contactInfo.summaryItems as CalculatorLeadSummaryItem[] : [];
}

function getLocalEstimateTotal(queue: CalculatorLeadRecord[]) {
  return queue.reduce((sum, lead) => sum + (Number(lead.estimateTotal) || 0), 0);
}

function getBackendEstimateTotal(leads: BackendCalculatorLead[]) {
  return leads.reduce((sum, lead) => sum + getBackendEstimate(lead), 0);
}

function statCard(label: string, value: string | number, tone: string) {
  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.78)', border: `1px solid ${tone}55`, borderRadius: '20px', padding: '18px' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <strong style={{ color: tone, display: 'block', fontSize: '1.8rem', marginTop: '8px' }}>{value}</strong>
    </div>
  );
}

function summaryPills(items: CalculatorLeadSummaryItem[]) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
      {items.slice(0, 4).map((item) => (
        <span key={`${item.label}:${item.value}`} style={{ background: 'rgba(56, 189, 248, 0.11)', border: '1px solid rgba(56, 189, 248, 0.24)', borderRadius: '999px', color: '#bae6fd', fontSize: '0.74rem', fontWeight: 850, padding: '7px 10px' }}>
          {item.label}: {item.value}
        </span>
      ))}
    </div>
  );
}

export default function CalculatorLeadInbox() {
  const [localQueue, setLocalQueue] = useState<CalculatorLeadRecord[]>(() => readCalculatorLeadQueue().reverse());
  const [backendState, setBackendState] = useState<BackendLoadState>({
    message: 'Backend leadi vēl nav ielādēti.',
    rows: [],
    status: 'idle',
  });

  const refreshLocalQueue = () => setLocalQueue(readCalculatorLeadQueue().reverse());

  const loadBackendLeads = useCallback(async () => {
    setBackendState({ message: 'Ielādēju backend calculator leadus...', rows: [], status: 'loading' });
    try {
      const response = await LeadsAPI.getCalculatorLeads();
      const rows = normalizeBackendRows(response);
      setBackendState({
        message: rows.length > 0 ? `Atrasti ${rows.length} backend leadi.` : 'Backend atbildēja, bet calculator leadi nav atrasti.',
        rows,
        status: 'success',
      });
    } catch (error) {
      setBackendState({
        message: error instanceof Error ? error.message : 'Backend lead API nav sasniedzams.',
        rows: [],
        status: 'error',
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBackendLeads();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadBackendLeads]);

  const localTotal = useMemo(() => getLocalEstimateTotal(localQueue), [localQueue]);
  const backendTotal = useMemo(() => getBackendEstimateTotal(backendState.rows), [backendState.rows]);

  const clearLocalQueue = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const confirmed = window.confirm('Notīrīt lokālo calculator lead fallback rindu šajā pārlūkā?');
    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(CALCULATOR_LEAD_STORAGE_KEY);
    refreshLocalQueue();
  };

  const exportLocalQueue = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const blob = new Blob([JSON.stringify(localQueue, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `calculator-leads-local-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ color: '#f8fafc', margin: '0 auto', maxWidth: '1320px', padding: '42px 20px 80px' }}>
      <section style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94))', border: '1px solid rgba(125, 211, 252, 0.18)', borderRadius: '30px', marginBottom: '24px', padding: '30px' }}>
        <div style={{ color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Calculator lead ops
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', letterSpacing: '-0.055em', lineHeight: 0.98, margin: '10px 0 14px' }}>
          Kalkulatoru pieprasījumu pārskats
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '760px' }}>
          Šeit redzami kalkulatoru pieprasījumi, kas nonāca backend lead sistēmā, un lokālie fallback pieprasījumi, kas saglabāti šajā pārlūkā, ja API nebija sasniedzams.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
          <Link to="/calculators" style={{ border: '1px solid rgba(148, 163, 184, 0.28)', borderRadius: '999px', color: '#cbd5e1', fontWeight: 900, padding: '10px 14px', textDecoration: 'none' }}>
            Atpakaļ uz kalkulatoriem
          </Link>
          <button onClick={refreshLocalQueue} style={{ background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(56, 189, 248, 0.32)', borderRadius: '999px', color: '#bae6fd', cursor: 'pointer', fontWeight: 900, padding: '10px 14px' }} type="button">
            Atsvaidzināt lokālo rindu
          </button>
          <button onClick={() => void loadBackendLeads()} style={{ background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(34, 197, 94, 0.32)', borderRadius: '999px', color: '#bbf7d0', cursor: 'pointer', fontWeight: 900, padding: '10px 14px' }} type="button">
            Atsvaidzināt backend leadus
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: '24px' }}>
        {statCard('Lokālie fallback', localQueue.length, '#38bdf8')}
        {statCard('Backend calculator leadi', backendState.rows.length, '#22c55e')}
        {statCard('Lokālā tāmes vērtība', formatMoney(localTotal), '#f59e0b')}
        {statCard('Backend tāmes vērtība', formatMoney(backendTotal), '#a78bfa')}
      </section>

      <section style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '24px', padding: '22px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '12px', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Lokālā fallback rinda</h2>
              <p style={{ color: '#94a3b8', margin: '6px 0 0' }}>Saglabāta šajā pārlūkā, ja lead API nebija pieejams.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled={localQueue.length === 0} onClick={exportLocalQueue} style={{ background: 'rgba(56, 189, 248, 0.14)', border: '1px solid rgba(56, 189, 248, 0.28)', borderRadius: '12px', color: '#bae6fd', cursor: localQueue.length === 0 ? 'default' : 'pointer', fontWeight: 850, opacity: localQueue.length === 0 ? 0.5 : 1, padding: '9px 11px' }} type="button">
                Eksportēt
              </button>
              <button disabled={localQueue.length === 0} onClick={clearLocalQueue} style={{ background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.26)', borderRadius: '12px', color: '#fecaca', cursor: localQueue.length === 0 ? 'default' : 'pointer', fontWeight: 850, opacity: localQueue.length === 0 ? 0.5 : 1, padding: '9px 11px' }} type="button">
                Notīrīt
              </button>
            </div>
          </div>

          {localQueue.length === 0 ? (
            <div style={{ border: '1px dashed rgba(148, 163, 184, 0.22)', borderRadius: '18px', color: '#94a3b8', padding: '30px', textAlign: 'center' }}>
              Nav lokālu fallback pieprasījumu.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {localQueue.map((lead) => (
                <article key={lead.id} style={{ background: 'rgba(2, 6, 23, 0.54)', border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '18px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{lead.name}</h3>
                      <div style={{ color: '#93c5fd', marginTop: '4px' }}>{lead.email}</div>
                      <div style={{ color: '#cbd5e1', marginTop: '2px' }}>{lead.phone}</div>
                    </div>
                    <strong style={{ color: '#f8fafc', whiteSpace: 'nowrap' }}>{formatMoney(lead.estimateTotal, lead.estimateCurrency ?? 'EUR')}</strong>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '10px' }}>
                    {lead.calculatorTitle} · {formatDate(lead.capturedAt)} · {lead.sourcePath}
                  </div>
                  {lead.notes && <p style={{ color: '#e2e8f0', lineHeight: 1.5, margin: '12px 0 0' }}>{lead.notes}</p>}
                  {summaryPills(lead.summaryItems ?? [])}
                </article>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '24px', padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Backend calculator leadi</h2>
            <p style={{ color: backendState.status === 'error' ? '#fecaca' : '#94a3b8', margin: '6px 0 0' }}>{backendState.message}</p>
          </div>

          {backendState.rows.length === 0 ? (
            <div style={{ border: '1px dashed rgba(148, 163, 184, 0.22)', borderRadius: '18px', color: '#94a3b8', padding: '30px', textAlign: 'center' }}>
              {backendState.status === 'loading' ? 'Ielādē...' : 'Nav backend calculator leadu vai API nav sasniedzams.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {backendState.rows.map((lead, index) => {
                const backendMessage = getBackendLeadMessage(lead);

                return (
                  <article key={String(lead.id ?? `${lead.source}:${index}`)} style={{ background: 'rgba(2, 6, 23, 0.54)', border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '18px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{getBackendLeadName(lead)}</h3>
                      <div style={{ color: '#93c5fd', marginTop: '4px' }}>{getBackendLeadEmail(lead)}</div>
                      <div style={{ color: '#cbd5e1', marginTop: '2px' }}>{getBackendLeadPhone(lead)}</div>
                    </div>
                    <strong style={{ color: '#f8fafc', whiteSpace: 'nowrap' }}>{formatMoney(getBackendEstimate(lead))}</strong>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '10px' }}>
                    {getBackendCalculatorId(lead)} · {lead.status || 'no status'} · {formatDate(lead.created_at)}
                  </div>
                  {backendMessage && <p style={{ color: '#e2e8f0', lineHeight: 1.5, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{backendMessage}</p>}
                  {summaryPills(getBackendSummaryItems(lead))}
                </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

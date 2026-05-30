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

type CalculatorLeadStatus = 'new' | 'contacted' | 'qualified' | 'rejected';

const ALL_FILTER_VALUE = 'all';
const CALCULATOR_LEAD_STATUS_OPTIONS: Array<{ label: string; value: CalculatorLeadStatus }> = [
  { label: 'Jauns', value: 'new' },
  { label: 'Sazinats', value: 'contacted' },
  { label: 'Kvalificets', value: 'qualified' },
  { label: 'Noraidits', value: 'rejected' },
];

function getBackendAccessNotice(message: string) {
  if (message.includes('SERVER_API_HTTP_401')) {
    return {
      actionHref: '/login?next=%2Fcalculators%2Fleads',
      actionLabel: 'Pieslegties',
      body: 'Backend calculator lead rinda ir aizsargata. Piesledzies ar admin vai sales kontu, un pec login tiksi atpakal uz so inbox.',
      tone: '#fbbf24',
      title: 'Nepieciesama pieslegsanas',
    };
  }

  if (message.includes('SERVER_API_HTTP_403')) {
    return {
      actionHref: '/calculators',
      actionLabel: 'Atvert kalkulatorus',
      body: 'Sesija ir deriga, bet sim kontam nav atlautas calculator lead rindas darbiba.',
      tone: '#fb7185',
      title: 'Nav piekluves',
    };
  }

  return {
    actionHref: '/calculators',
    actionLabel: 'Atvert kalkulatorus',
    body: 'Backend lead API sobrid nav sasniedzams vai atgrieza kludu. Lokalais fallback bloks joprojam var radit saja parluka saglabatus pieprasijumus.',
    tone: '#38bdf8',
    title: 'Backend lead API nav pieejams',
  };
}

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
    return 'Nav tÄmes';
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

function getBackendCalculatorTitle(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(contactInfo.calculatorTitle || getBackendCalculatorId(lead));
}

function getBackendEstimate(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return Number(contactInfo.estimateTotal || lead.value || 0) || 0;
}

function getBackendLeadName(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(contactInfo.name || contactInfo.company_name || 'Bez vÄrda');
}

function getBackendLeadEmail(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(contactInfo.email || contactInfo.clientEmail || 'Nav e-pasta');
}

function getBackendLeadPhone(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(contactInfo.phone || 'Nav tÄlruÅ†a');
}

function getBackendLeadMessage(lead: BackendCalculatorLead) {
  const contactInfo = getContactInfo(lead);
  return String(lead.message || lead.notes || contactInfo.message || contactInfo.notes || '').trim();
}

function getBackendSummaryItems(lead: BackendCalculatorLead): CalculatorLeadSummaryItem[] {
  const contactInfo = getContactInfo(lead);
  return Array.isArray(contactInfo.summaryItems) ? contactInfo.summaryItems as CalculatorLeadSummaryItem[] : [];
}

function getBackendLeadId(lead: BackendCalculatorLead) {
  return lead.id === null || lead.id === undefined ? '' : String(lead.id);
}

function normalizeLeadStatus(status?: string | null): CalculatorLeadStatus {
  const normalized = String(status || '').trim().toLowerCase();
  return CALCULATOR_LEAD_STATUS_OPTIONS.some((option) => option.value === normalized)
    ? normalized as CalculatorLeadStatus
    : 'new';
}

function getStatusLabel(status?: string | null) {
  const normalized = normalizeLeadStatus(status);
  return CALCULATOR_LEAD_STATUS_OPTIONS.find((option) => option.value === normalized)?.label ?? normalized;
}

function getStatusTone(status?: string | null) {
  switch (normalizeLeadStatus(status)) {
    case 'contacted':
      return '#38bdf8';
    case 'qualified':
      return '#22c55e';
    case 'rejected':
      return '#f87171';
    default:
      return '#f59e0b';
  }
}

function matchesBackendSearch(lead: BackendCalculatorLead, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return [
    getBackendCalculatorId(lead),
    getBackendCalculatorTitle(lead),
    getBackendLeadName(lead),
    getBackendLeadEmail(lead),
    getBackendLeadPhone(lead),
    getBackendLeadMessage(lead),
  ].some((value) => value.toLowerCase().includes(normalizedSearch));
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
  const [actionMessage, setActionMessage] = useState('');
  const [calculatorFilter, setCalculatorFilter] = useState(ALL_FILTER_VALUE);
  const [localQueue, setLocalQueue] = useState<CalculatorLeadRecord[]>(() => readCalculatorLeadQueue().reverse());
  const [backendState, setBackendState] = useState<BackendLoadState>({
    message: 'Backend leadi vÄ“l nav ielÄdÄ“ti.',
    rows: [],
    status: 'idle',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE);
  const [updatingLeadId, setUpdatingLeadId] = useState('');

  const refreshLocalQueue = () => setLocalQueue(readCalculatorLeadQueue().reverse());

  const loadBackendLeads = useCallback(async () => {
    setBackendState({ message: 'IelÄdÄ“ju backend calculator leadus...', rows: [], status: 'loading' });
    try {
      const response = await LeadsAPI.getCalculatorLeads();
      const rows = normalizeBackendRows(response);
      setBackendState({
        message: rows.length > 0 ? `Atrasti ${rows.length} backend leadi.` : 'Backend atbildÄ“ja, bet calculator leadi nav atrasti.',
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
  const backendCalculatorOptions = useMemo(() => {
    const calculatorIds = new Set(backendState.rows.map(getBackendCalculatorId));
    return Array.from(calculatorIds).sort((a, b) => a.localeCompare(b));
  }, [backendState.rows]);
  const filteredBackendRows = useMemo(() => backendState.rows.filter((lead) => {
    const calculatorMatches = calculatorFilter === ALL_FILTER_VALUE || getBackendCalculatorId(lead) === calculatorFilter;
    const statusMatches = statusFilter === ALL_FILTER_VALUE || normalizeLeadStatus(lead.status) === statusFilter;
    return calculatorMatches && statusMatches && matchesBackendSearch(lead, searchTerm);
  }), [backendState.rows, calculatorFilter, searchTerm, statusFilter]);
  const filteredBackendTotal = useMemo(() => getBackendEstimateTotal(filteredBackendRows), [filteredBackendRows]);
  const newBackendLeadCount = useMemo(
    () => backendState.rows.filter((lead) => normalizeLeadStatus(lead.status) === 'new').length,
    [backendState.rows],
  );
  const backendAccessNotice = backendState.status === 'error'
    ? getBackendAccessNotice(backendState.message)
    : null;

  const clearLocalQueue = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const confirmed = window.confirm('NotÄ«rÄ«t lokÄlo calculator lead fallback rindu Å¡ajÄ pÄrlÅ«kÄ?');
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

  const updateBackendLeadStatus = async (lead: BackendCalculatorLead, status: CalculatorLeadStatus) => {
    const leadId = getBackendLeadId(lead);
    if (!leadId) {
      setActionMessage('Lead ID nav pieejams, statusu nevar atjaunot.');
      return;
    }

    setActionMessage('');
    setUpdatingLeadId(leadId);
    try {
      const updatedLead = await LeadsAPI.updateCalculatorLead(leadId, { status }) as BackendCalculatorLead;
      setBackendState((current) => ({
        ...current,
        rows: current.rows.map((row) => (getBackendLeadId(row) === leadId ? { ...row, ...updatedLead, status } : row)),
      }));
      setActionMessage(`Lead statuss atjaunots: ${getStatusLabel(status)}.`);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Lead statusu neizdevas atjaunot.');
    } finally {
      setUpdatingLeadId('');
    }
  };

  return (
    <main style={{ color: '#f8fafc', margin: '0 auto', maxWidth: '1320px', padding: '42px 20px 80px' }}>
      <section style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94))', border: '1px solid rgba(125, 211, 252, 0.18)', borderRadius: '30px', marginBottom: '24px', padding: '30px' }}>
        <div style={{ color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Calculator lead ops
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', letterSpacing: '-0.055em', lineHeight: 0.98, margin: '10px 0 14px' }}>
          Kalkulatoru pieprasÄ«jumu pÄrskats
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '760px' }}>
          Seit redzami kalkulatoru pieprasijumi backend lead sistema un lokalie fallback pieprasijumi, kas saglabati saja parluka, ja API nebija sasniedzams.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
          <Link to="/calculators" style={{ border: '1px solid rgba(148, 163, 184, 0.28)', borderRadius: '999px', color: '#cbd5e1', fontWeight: 900, padding: '10px 14px', textDecoration: 'none' }}>
            AtpakaÄ¼ uz kalkulatoriem
          </Link>
          <button onClick={refreshLocalQueue} style={{ background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(56, 189, 248, 0.32)', borderRadius: '999px', color: '#bae6fd', cursor: 'pointer', fontWeight: 900, padding: '10px 14px' }} type="button">
            AtsvaidzinÄt lokÄlo rindu
          </button>
          <button onClick={() => void loadBackendLeads()} style={{ background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(34, 197, 94, 0.32)', borderRadius: '999px', color: '#bbf7d0', cursor: 'pointer', fontWeight: 900, padding: '10px 14px' }} type="button">
            AtsvaidzinÄt backend leadus
          </button>
        </div>
      </section>

      {backendAccessNotice && (
        <section style={{ background: `${backendAccessNotice.tone}12`, border: `1px solid ${backendAccessNotice.tone}55`, borderRadius: '22px', display: 'grid', gap: '14px', marginBottom: '24px', padding: '18px' }}>
          <div>
            <div style={{ color: backendAccessNotice.tone, fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Backend access
            </div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', margin: '6px 0 6px' }}>{backendAccessNotice.title}</h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.5, margin: 0, maxWidth: '840px' }}>{backendAccessNotice.body}</p>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link to={backendAccessNotice.actionHref} style={{ background: backendAccessNotice.tone, borderRadius: '999px', color: '#020617', fontSize: '0.82rem', fontWeight: 950, padding: '10px 14px', textDecoration: 'none', textTransform: 'uppercase' }}>
              {backendAccessNotice.actionLabel}
            </Link>
            <button onClick={() => void loadBackendLeads()} style={{ background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(148, 163, 184, 0.24)', borderRadius: '999px', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 900, padding: '10px 14px' }} type="button">
              Parbaudit velreiz
            </button>
          </div>
        </section>
      )}

      <section style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: '24px' }}>
        {statCard('LokÄlie fallback', localQueue.length, '#38bdf8')}
        {statCard('Backend calculator leadi', backendState.rows.length, '#22c55e')}
        {statCard('Jauni backend leadi', newBackendLeadCount, '#f59e0b')}
        {statCard('FiltrÄ“ti backend leadi', filteredBackendRows.length, '#7dd3fc')}
        {statCard('LokÄlÄ tÄmes vÄ“rtÄ«ba', formatMoney(localTotal), '#f59e0b')}
        {statCard('Backend tÄmes vÄ“rtÄ«ba', formatMoney(backendTotal), '#a78bfa')}
        {statCard('FiltrÄ“tÄ backend vÄ“rtÄ«ba', formatMoney(filteredBackendTotal), '#c4b5fd')}
      </section>

      <section style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '24px', padding: '22px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '12px', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0 }}>LokÄlÄ fallback rinda</h2>
              <p style={{ color: '#94a3b8', margin: '6px 0 0' }}>SaglabÄta Å¡ajÄ pÄrlÅ«kÄ, ja lead API nebija pieejams.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled={localQueue.length === 0} onClick={exportLocalQueue} style={{ background: 'rgba(56, 189, 248, 0.14)', border: '1px solid rgba(56, 189, 248, 0.28)', borderRadius: '12px', color: '#bae6fd', cursor: localQueue.length === 0 ? 'default' : 'pointer', fontWeight: 850, opacity: localQueue.length === 0 ? 0.5 : 1, padding: '9px 11px' }} type="button">
                EksportÄ“t
              </button>
              <button disabled={localQueue.length === 0} onClick={clearLocalQueue} style={{ background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.26)', borderRadius: '12px', color: '#fecaca', cursor: localQueue.length === 0 ? 'default' : 'pointer', fontWeight: 850, opacity: localQueue.length === 0 ? 0.5 : 1, padding: '9px 11px' }} type="button">
                NotÄ«rÄ«t
              </button>
            </div>
          </div>

          {localQueue.length === 0 ? (
            <div style={{ border: '1px dashed rgba(148, 163, 184, 0.22)', borderRadius: '18px', color: '#94a3b8', padding: '30px', textAlign: 'center' }}>
              Nav lokÄlu fallback pieprasÄ«jumu.
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
                    {lead.calculatorTitle} Â· {formatDate(lead.capturedAt)} Â· {lead.sourcePath}
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

          <div style={{ background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '18px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '16px', padding: '14px' }}>
            <label style={{ color: '#cbd5e1', display: 'grid', fontSize: '0.78rem', fontWeight: 850, gap: '7px' }}>
              Kalkulators
              <select onChange={(event) => setCalculatorFilter(event.target.value)} style={{ background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(148, 163, 184, 0.24)', borderRadius: '12px', color: '#f8fafc', font: 'inherit', padding: '10px' }} value={calculatorFilter}>
                <option value={ALL_FILTER_VALUE}>Visi kalkulatori</option>
                {backendCalculatorOptions.map((calculatorId) => (
                  <option key={calculatorId} value={calculatorId}>{calculatorId}</option>
                ))}
              </select>
            </label>
            <label style={{ color: '#cbd5e1', display: 'grid', fontSize: '0.78rem', fontWeight: 850, gap: '7px' }}>
              Statuss
              <select onChange={(event) => setStatusFilter(event.target.value)} style={{ background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(148, 163, 184, 0.24)', borderRadius: '12px', color: '#f8fafc', font: 'inherit', padding: '10px' }} value={statusFilter}>
                <option value={ALL_FILTER_VALUE}>Visi statusi</option>
                {CALCULATOR_LEAD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label style={{ color: '#cbd5e1', display: 'grid', fontSize: '0.78rem', fontWeight: 850, gap: '7px' }}>
              Meklet
              <input onChange={(event) => setSearchTerm(event.target.value)} placeholder="Vards, e-pasts, telefons..." style={{ background: 'rgba(15, 23, 42, 0.86)', border: '1px solid rgba(148, 163, 184, 0.24)', borderRadius: '12px', color: '#f8fafc', font: 'inherit', padding: '10px' }} value={searchTerm} />
            </label>
          </div>

          {actionMessage && (
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.22)', borderRadius: '14px', color: '#bae6fd', fontSize: '0.82rem', fontWeight: 850, marginBottom: '14px', padding: '10px 12px' }}>
              {actionMessage}
            </div>
          )}

          {filteredBackendRows.length === 0 ? (
            <div style={{ border: '1px dashed rgba(148, 163, 184, 0.22)', borderRadius: '18px', color: '#94a3b8', padding: '30px', textAlign: 'center' }}>
              {backendState.status === 'loading' ? 'Ielādē...' : 'Nav backend calculator leadu saja filtra vai API nav sasniedzams.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredBackendRows.map((lead, index) => {
                const backendMessage = getBackendLeadMessage(lead);
                const leadId = getBackendLeadId(lead);
                const leadStatus = normalizeLeadStatus(lead.status);
                const statusTone = getStatusTone(lead.status);
                const isUpdating = updatingLeadId === leadId;

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
                    {getBackendCalculatorTitle(lead)} · {formatDate(lead.created_at)}
                    <span style={{ background: `${statusTone}22`, border: `1px solid ${statusTone}55`, borderRadius: '999px', color: statusTone, display: 'inline-block', fontSize: '0.7rem', fontWeight: 950, marginLeft: '8px', padding: '4px 8px', textTransform: 'uppercase' }}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </div>
                  {backendMessage && <p style={{ color: '#e2e8f0', lineHeight: 1.5, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{backendMessage}</p>}
                  {summaryPills(getBackendSummaryItems(lead))}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                    {CALCULATOR_LEAD_STATUS_OPTIONS.map((option) => {
                      const isActive = leadStatus === option.value;
                      return (
                        <button
                          disabled={isUpdating || isActive}
                          key={option.value}
                          onClick={() => void updateBackendLeadStatus(lead, option.value)}
                          style={{
                            background: isActive ? `${getStatusTone(option.value)}24` : 'rgba(15, 23, 42, 0.78)',
                            border: `1px solid ${isActive ? getStatusTone(option.value) : 'rgba(148, 163, 184, 0.24)'}`,
                            borderRadius: '999px',
                            color: isActive ? getStatusTone(option.value) : '#cbd5e1',
                            cursor: isUpdating || isActive ? 'default' : 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            opacity: isUpdating && !isActive ? 0.55 : 1,
                            padding: '8px 10px',
                            textTransform: 'uppercase',
                          }}
                          type="button"
                        >
                          {isUpdating && !isActive ? 'Saglabā...' : option.label}
                        </button>
                      );
                    })}
                  </div>
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

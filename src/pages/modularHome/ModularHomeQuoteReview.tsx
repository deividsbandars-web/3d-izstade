import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MODULAR_HOME_QUOTE_ADMIN_STATUSES,
  getModularHomeQuoteAdminDetail,
  getModularHomeQuoteAdminRows,
  updateModularHomeQuoteAdminStatus,
} from '../../app/modularHome/modularHomeQuoteAdminApi';
import { supabaseClient } from '../../lib/supabaseClient';
import {
  getMockModularHomeQuoteReviewRows,
  getModularHomeQuoteReviewSummary,
  readLocalModularHomeQuoteReviewRows,
  serializeModularHomeQuoteReviewCsv,
  serializeModularHomeQuoteReviewJson,
  type ModularHomeQuoteReviewRow,
  type ModularHomeQuoteReviewStatus,
} from '../../modules/expo/runtime/modularHome/modularHomeQuoteReview';

const ALL_FILTER_VALUE = 'all';

type QuoteReviewAccessState =
  | 'checking-auth'
  | 'ready'
  | 'signed-out'
  | 'access-denied'
  | 'backend-unavailable'
  | 'unavailable';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('lv-LV');
}

function formatMoney(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 'No estimate';
  }

  return new Intl.NumberFormat('en-IE', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isLocalReviewHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function getSourceLabel(row: ModularHomeQuoteReviewRow) {
  if (row.source === 'backend-staging') {
    return 'Protected staging';
  }

  return row.source === 'local-preview' ? 'Local preview' : 'Mock review';
}

function getStatusTone(status: string) {
  switch (status) {
    case 'closed':
      return '#34d399';
    case 'contacted':
      return '#38bdf8';
    case 'qualified':
      return '#a78bfa';
    case 'mock-review':
      return '#fbbf24';
    default:
      return '#fb923c';
  }
}

function matchesSearch(row: ModularHomeQuoteReviewRow, searchTerm: string) {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    row.budgetRange,
    row.config.facade,
    row.config.finishLevel,
    row.config.roof,
    row.config.terrace,
    row.contact.countryCity,
    row.contact.email,
    row.contact.name,
    row.contact.phone,
    row.landOwned,
    row.message,
    row.model,
    row.status,
    row.targetBuildDate,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function formatRequestError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function resolveAccessStateFromError(errorText: string): Exclude<QuoteReviewAccessState, 'checking-auth' | 'ready'> {
  if (errorText.includes('SERVER_API_HTTP_401')) {
    return 'signed-out';
  }

  if (errorText.includes('SERVER_API_HTTP_403')) {
    return 'access-denied';
  }

  if (
    errorText.includes('SERVER_API_HTTP_500') ||
    errorText.includes('SERVER_API_HTTP_502') ||
    errorText.includes('SERVER_API_HTTP_503') ||
    errorText.includes('SERVER_API_HTTP_504') ||
    errorText.toLowerCase().includes('failed to fetch') ||
    errorText.toLowerCase().includes('networkerror') ||
    errorText.toLowerCase().includes('err_connection')
  ) {
    return 'backend-unavailable';
  }

  return 'unavailable';
}

function getAccessNotice(accessState: QuoteReviewAccessState, technicalError: string | null) {
  if (accessState === 'signed-out') {
    return {
      accent: '#fbbf24',
      actionHref: '/login?next=/modular-homes/quotes',
      actionLabel: 'Sign in',
      body: 'Modular Home quote review is protected. Sign in with an admin account to review staging quote requests.',
      detail: 'No quote data is loaded for public visitors.',
      title: 'Admin sign-in required',
    };
  }

  if (accessState === 'access-denied') {
    return {
      accent: '#fb7185',
      actionHref: '/expo-3d?homeDemo=1',
      actionLabel: 'Open home demo',
      body: 'Your session is valid, but this account does not have admin access to Modular Home quote review.',
      detail: 'Use an admin account or update the Supabase app_metadata role to admin.',
      title: 'Admin access required',
    };
  }

  if (accessState === 'backend-unavailable') {
    return {
      accent: '#38bdf8',
      actionHref: '/expo-3d?homeDemo=1',
      actionLabel: 'Open home demo',
      body: 'The protected quote review UI is ready, but the staging backend is not reachable right now.',
      detail: technicalError ? `Technical detail: ${technicalError}` : 'Check staging backend health and API URL configuration.',
      title: 'Backend unavailable',
    };
  }

  if (accessState === 'unavailable') {
    return {
      accent: '#f87171',
      actionHref: '/expo-3d?homeDemo=1',
      actionLabel: 'Open home demo',
      body: 'Modular Home quote review could not load.',
      detail: technicalError ? `Technical detail: ${technicalError}` : 'Retry after checking backend and auth session.',
      title: 'Review unavailable',
    };
  }

  return null;
}

function statCard(label: string, value: string | number, tone: string) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.78))',
      border: `1px solid ${tone}44`,
      borderRadius: '20px',
      padding: '18px',
    }}>
      <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <strong style={{ color: tone, display: 'block', fontSize: '1.72rem', letterSpacing: '-0.04em', marginTop: '8px' }}>
        {value}
      </strong>
    </div>
  );
}

function statusIsAdminStatus(status: ModularHomeQuoteReviewStatus): status is typeof MODULAR_HOME_QUOTE_ADMIN_STATUSES[number] {
  return MODULAR_HOME_QUOTE_ADMIN_STATUSES.includes(status as typeof MODULAR_HOME_QUOTE_ADMIN_STATUSES[number]);
}

export default function ModularHomeQuoteReview() {
  const [searchParams] = useSearchParams();
  const useProtectedBackend = !isLocalReviewHost() || searchParams.get('adminBackend') === '1';
  const [accessState, setAccessState] = useState<QuoteReviewAccessState>(useProtectedBackend ? 'checking-auth' : 'ready');
  const [activeDetailLoad, setActiveDetailLoad] = useState<string | null>(null);
  const [activeStatusAction, setActiveStatusAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeMockRows, setIncludeMockRows] = useState(!useProtectedBackend);
  const [loading, setLoading] = useState(useProtectedBackend);
  const [modelFilter, setModelFilter] = useState(ALL_FILTER_VALUE);
  const [rows, setRows] = useState<ModularHomeQuoteReviewRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<ModularHomeQuoteReviewRow | null>(null);
  const [sourceFilter, setSourceFilter] = useState(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToast(null);

    try {
      if (!useProtectedBackend) {
        const localRows = readLocalModularHomeQuoteReviewRows();
        const mockRows = includeMockRows ? getMockModularHomeQuoteReviewRows() : [];
        setRows([...localRows, ...mockRows].sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
        setAccessState('ready');
        return;
      }

      setAccessState('checking-auth');
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (!sessionData.session?.access_token) {
        setRows([]);
        setSelectedRow(null);
        setAccessState('signed-out');
        return;
      }

      const result = await getModularHomeQuoteAdminRows({ limit: 100 });
      setRows(result.rows.sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
      setAccessState('ready');
    } catch (requestError) {
      const errorText = formatRequestError(requestError);
      setError(errorText);
      setRows([]);
      setSelectedRow(null);
      setAccessState(resolveAccessStateFromError(errorText));
    } finally {
      setLoading(false);
    }
  }, [includeMockRows, useProtectedBackend]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const modelOptions = useMemo(() => (
    Array.from(new Set(rows.map((row) => row.model))).sort((left, right) => left.localeCompare(right))
  ), [rows]);
  const statusOptions = useMemo(() => (
    Array.from(new Set(rows.map((row) => row.status))).sort((left, right) => left.localeCompare(right))
  ), [rows]);
  const visibleRows = useMemo(() => rows.filter((row) => (
    (modelFilter === ALL_FILTER_VALUE || row.model === modelFilter)
    && (sourceFilter === ALL_FILTER_VALUE || row.source === sourceFilter)
    && (statusFilter === ALL_FILTER_VALUE || row.status === statusFilter)
    && matchesSearch(row, searchTerm)
  )), [modelFilter, rows, searchTerm, sourceFilter, statusFilter]);
  const summary = useMemo(() => getModularHomeQuoteReviewSummary(rows), [rows]);
  const visibleSummary = useMemo(() => getModularHomeQuoteReviewSummary(visibleRows), [visibleRows]);
  const accessNotice = getAccessNotice(accessState, error);

  const exportJson = () => {
    if (visibleRows.length === 0) {
      return;
    }

    downloadTextFile(
      `modular-home-quotes-${new Date().toISOString().slice(0, 10)}.json`,
      serializeModularHomeQuoteReviewJson(visibleRows),
      'application/json;charset=utf-8',
    );
  };

  const exportCsv = () => {
    if (visibleRows.length === 0) {
      return;
    }

    downloadTextFile(
      `modular-home-quotes-${new Date().toISOString().slice(0, 10)}.csv`,
      serializeModularHomeQuoteReviewCsv(visibleRows),
      'text/csv;charset=utf-8',
    );
  };

  async function viewQuoteDetail(row: ModularHomeQuoteReviewRow) {
    setToast(null);

    if (!useProtectedBackend || row.source !== 'backend-staging') {
      setSelectedRow(row);
      return;
    }

    setActiveDetailLoad(row.id);
    try {
      const detail = await getModularHomeQuoteAdminDetail(row.id);
      setSelectedRow(detail ?? row);
    } catch (detailError) {
      setToast({ type: 'error', text: `Could not load quote detail: ${formatRequestError(detailError)}` });
    } finally {
      setActiveDetailLoad(null);
    }
  }

  async function updateQuoteStatus(row: ModularHomeQuoteReviewRow, status: typeof MODULAR_HOME_QUOTE_ADMIN_STATUSES[number]) {
    if (!useProtectedBackend || row.source !== 'backend-staging') {
      return;
    }

    setActiveStatusAction(`${row.id}:${status}`);
    setToast(null);

    try {
      const result = await updateModularHomeQuoteAdminStatus(row.id, status);
      setRows((current) => current.map((entry) => (
        entry.id === row.id ? { ...entry, status: result.status } : entry
      )));
      setSelectedRow((current) => current?.id === row.id ? { ...current, status: result.status } : current);
      setToast({ type: 'success', text: `Quote marked ${result.status}.` });
    } catch (updateError) {
      setToast({ type: 'error', text: `Could not update status: ${formatRequestError(updateError)}` });
    } finally {
      setActiveStatusAction(null);
    }
  }

  if (accessNotice && accessState !== 'ready') {
    return (
      <main style={{ color: '#f8fafc', margin: '0 auto', maxWidth: '920px', padding: '72px 20px' }}>
        <section style={{
          background: 'linear-gradient(135deg, rgba(21, 16, 8, 0.96), rgba(2, 6, 23, 0.94))',
          border: `1px solid ${accessNotice.accent}55`,
          borderRadius: '30px',
          padding: '30px',
        }}>
          <div style={{ color: accessNotice.accent, fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Protected admin route
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.055em', lineHeight: 0.98, margin: '10px 0 14px' }}>
            {accessNotice.title}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            {accessNotice.body}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, margin: '12px 0 0' }}>
            {accessNotice.detail}
          </p>
          <Link to={accessNotice.actionHref} style={{ ...actionButton(accessNotice.accent), display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>
            {accessNotice.actionLabel}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={{ color: '#f8fafc', margin: '0 auto', maxWidth: '1320px', padding: '42px 20px 82px' }}>
      <section style={{
        background: 'radial-gradient(circle at 12% 0%, rgba(251, 191, 36, 0.2), transparent 34%), linear-gradient(135deg, rgba(21, 16, 8, 0.96), rgba(2, 6, 23, 0.94))',
        border: '1px solid rgba(251, 191, 36, 0.26)',
        borderRadius: '30px',
        marginBottom: '24px',
        padding: '30px',
      }}>
        <div style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {useProtectedBackend ? 'Protected admin / staging quotes' : 'Local dev review'}
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', letterSpacing: '-0.055em', lineHeight: 0.98, margin: '10px 0 14px' }}>
          Modular Home quote review
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '920px' }}>
          {useProtectedBackend
            ? 'Review staging Modular Home quote submissions through the protected backend. Public visitors and non-admin accounts cannot load quote data.'
            : 'Localhost fallback shows local preview requests and optional mock rows. Staging uses the protected admin backend instead.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => void loadRows()} style={actionButton('#38bdf8')} type="button">
            {loading ? 'Loading...' : 'Refresh quotes'}
          </button>
          <button disabled={visibleRows.length === 0} onClick={exportJson} style={actionButton('#fbbf24', visibleRows.length === 0)} type="button">
            Export JSON
          </button>
          <button disabled={visibleRows.length === 0} onClick={exportCsv} style={actionButton('#34d399', visibleRows.length === 0)} type="button">
            Export CSV
          </button>
          <Link to="/expo-3d?homeDemo=1" style={{ ...actionButton('#a78bfa'), textDecoration: 'none' }}>
            Open home demo
          </Link>
        </div>
        {toast ? (
          <div style={{ color: toast.type === 'success' ? '#bbf7d0' : '#fecaca', fontSize: '0.86rem', fontWeight: 900, marginTop: '14px' }}>
            {toast.text}
          </div>
        ) : null}
      </section>

      <section style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: '24px' }}>
        {statCard('All review rows', summary.totalCount, '#fbbf24')}
        {statCard('Protected backend', summary.backendCount, '#34d399')}
        {statCard('Local queue', summary.localCount, '#38bdf8')}
        {statCard('Mock examples', summary.mockCount, '#a78bfa')}
        {statCard('Visible rows', visibleSummary.totalCount, '#fde68a')}
        {statCard('Visible estimate', formatMoney(visibleSummary.totalEstimate), '#fef3c7')}
      </section>

      <section style={{
        background: 'rgba(15, 23, 42, 0.74)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: '24px',
        display: 'grid',
        gap: '14px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        marginBottom: '24px',
        padding: '18px',
      }}>
        <label style={filterLabelStyle}>
          Search
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Name, email, model, city..."
            style={filterInputStyle}
            value={searchTerm}
          />
        </label>
        <label style={filterLabelStyle}>
          Model
          <select onChange={(event) => setModelFilter(event.target.value)} style={filterInputStyle} value={modelFilter}>
            <option value={ALL_FILTER_VALUE}>All models</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </label>
        <label style={filterLabelStyle}>
          Status
          <select onChange={(event) => setStatusFilter(event.target.value)} style={filterInputStyle} value={statusFilter}>
            <option value={ALL_FILTER_VALUE}>All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label style={filterLabelStyle}>
          Source
          <select onChange={(event) => setSourceFilter(event.target.value)} style={filterInputStyle} value={sourceFilter}>
            <option value={ALL_FILTER_VALUE}>All sources</option>
            <option value="backend-staging">Protected staging</option>
            {!useProtectedBackend ? <option value="local-preview">Local preview</option> : null}
            {!useProtectedBackend ? <option value="mock-review">Mock review</option> : null}
          </select>
        </label>
        {!useProtectedBackend ? (
          <label style={{
            ...filterLabelStyle,
            alignItems: 'center',
            background: 'rgba(2, 6, 23, 0.38)',
            border: '1px solid rgba(251, 191, 36, 0.18)',
            borderRadius: '14px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between',
            padding: '10px 12px',
          }}>
            Include mock rows
            <input
              checked={includeMockRows}
              onChange={(event) => setIncludeMockRows(event.target.checked)}
              type="checkbox"
            />
          </label>
        ) : null}
      </section>

      <div style={{ alignItems: 'start', display: 'grid', gap: '20px', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.42fr)' }}>
        <section style={{ display: 'grid', gap: '16px' }}>
          {loading ? (
            <section style={emptyStateStyle}>Loading protected Modular Home quotes...</section>
          ) : visibleRows.length === 0 ? (
            <section style={emptyStateStyle}>No Modular Home quote rows match the current filters.</section>
          ) : visibleRows.map((row) => {
            const statusTone = getStatusTone(row.status);
            const canUpdateStatus = useProtectedBackend && row.source === 'backend-staging' && statusIsAdminStatus(row.status);

            return (
              <article
                key={`${row.source}:${row.id}`}
                data-modular-home-quote-row={row.id}
                style={{
                  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.72))',
                  border: selectedRow?.id === row.id ? '1px solid rgba(251, 191, 36, 0.66)' : '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '24px',
                  padding: '20px',
                }}
              >
                <div style={{ alignItems: 'start', display: 'flex', gap: '16px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {getSourceLabel(row)} / {formatDate(row.createdAt)}
                    </div>
                    <h2 style={{ color: '#f8fafc', fontSize: '1.42rem', letterSpacing: '-0.03em', margin: '8px 0 4px' }}>
                      {row.model}
                    </h2>
                    <div style={{ color: '#bae6fd', fontWeight: 850 }}>{row.contact.name} / {row.contact.email}</div>
                    <div style={{ color: '#cbd5e1', marginTop: '3px' }}>{row.contact.phone} / {row.contact.countryCity}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#fef3c7', display: 'block', fontSize: '1.36rem' }}>{row.estimate.label}</strong>
                    <span style={{
                      background: `${statusTone}22`,
                      border: `1px solid ${statusTone}66`,
                      borderRadius: '999px',
                      color: statusTone,
                      display: 'inline-block',
                      fontSize: '0.68rem',
                      fontWeight: 950,
                      marginTop: '8px',
                      padding: '6px 10px',
                      textTransform: 'uppercase',
                    }}>
                      {row.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                  <button type="button" onClick={() => void viewQuoteDetail(row)} style={actionButton('#fbbf24')}>
                    {activeDetailLoad === row.id ? 'Loading detail...' : 'View details'}
                  </button>
                  {MODULAR_HOME_QUOTE_ADMIN_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={!canUpdateStatus || row.status === status || activeStatusAction === `${row.id}:${status}`}
                      onClick={() => void updateQuoteStatus(row, status)}
                      style={actionButton(getStatusTone(status), !canUpdateStatus || row.status === status || activeStatusAction === `${row.id}:${status}`)}
                    >
                      {activeStatusAction === `${row.id}:${status}` ? 'Saving...' : status}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <aside style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.76))',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          borderRadius: '24px',
          padding: '18px',
          position: 'sticky',
          top: '18px',
        }}>
          <div style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Quote detail
          </div>
          {selectedRow ? (
            <div data-modular-home-quote-detail={selectedRow.id} style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
              <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', letterSpacing: '-0.04em', margin: 0 }}>{selectedRow.model}</h2>
              <DetailBlock label="Contact" lines={[selectedRow.contact.name, selectedRow.contact.email, selectedRow.contact.phone, selectedRow.contact.countryCity]} />
              <DetailBlock label="Project" lines={[
                `Estimate: ${selectedRow.estimate.label}`,
                `Status: ${selectedRow.status}`,
                `Land owned: ${selectedRow.landOwned}`,
                `Target build: ${selectedRow.targetBuildDate}`,
                `Budget: ${selectedRow.budgetRange}`,
              ]} />
              <DetailBlock label="Configuration" lines={[
                `Facade: ${selectedRow.config.facade}`,
                `Roof: ${selectedRow.config.roof}`,
                `Terrace: ${selectedRow.config.terrace}`,
                `Finish: ${selectedRow.config.finishLevel}`,
              ]} />
              <div style={{ background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: '16px', padding: '13px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Message</div>
                <p style={{ color: '#e2e8f0', lineHeight: 1.55, margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{selectedRow.message}</p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', lineHeight: 1.55, margin: '12px 0 0' }}>
              Select a quote row to view full contact, configuration, estimate and message details.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}

function DetailBlock({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div style={{ background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: '16px', padding: '13px' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      {lines.map((line) => (
        <div key={line} style={{ color: '#f8fafc', fontSize: '0.86rem', fontWeight: 780, marginTop: '7px', overflowWrap: 'anywhere' }}>{line}</div>
      ))}
    </div>
  );
}

const emptyStateStyle = {
  border: '1px dashed rgba(148, 163, 184, 0.28)',
  borderRadius: '24px',
  color: '#94a3b8',
  padding: '42px 20px',
  textAlign: 'center',
} as const;

const filterLabelStyle = {
  color: '#cbd5e1',
  display: 'grid',
  fontSize: '0.76rem',
  fontWeight: 850,
  gap: '7px',
} as const;

const filterInputStyle = {
  background: 'rgba(2, 6, 23, 0.74)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '12px',
  color: '#f8fafc',
  font: 'inherit',
  padding: '10px',
} as const;

function actionButton(tone: string, disabled = false) {
  return {
    background: `${tone}22`,
    border: `1px solid ${tone}66`,
    borderRadius: '999px',
    color: tone,
    cursor: disabled ? 'default' : 'pointer',
    font: 'inherit',
    fontSize: '0.78rem',
    fontWeight: 950,
    letterSpacing: '0.04em',
    opacity: disabled ? 0.48 : 1,
    padding: '10px 14px',
    textTransform: 'uppercase',
  } as const;
}

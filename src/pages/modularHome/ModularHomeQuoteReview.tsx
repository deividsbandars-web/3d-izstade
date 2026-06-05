import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMockModularHomeQuoteReviewRows,
  getModularHomeQuoteReviewSummary,
  readLocalModularHomeQuoteReviewRows,
  serializeModularHomeQuoteReviewCsv,
  serializeModularHomeQuoteReviewJson,
  type ModularHomeQuoteReviewRow,
} from '../../modules/expo/runtime/modularHome/modularHomeQuoteReview';

const ALL_FILTER_VALUE = 'all';

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

function getSourceLabel(row: ModularHomeQuoteReviewRow) {
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

function isModularHomeQuoteReviewAccessAllowed() {
  if (typeof window === 'undefined') {
    return false;
  }

  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
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

export default function ModularHomeQuoteReview() {
  const reviewAccessAllowed = isModularHomeQuoteReviewAccessAllowed();
  const [includeMockRows, setIncludeMockRows] = useState(true);
  const [localRows, setLocalRows] = useState(() => (
    reviewAccessAllowed ? readLocalModularHomeQuoteReviewRows() : []
  ));
  const [modelFilter, setModelFilter] = useState(ALL_FILTER_VALUE);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE);

  const rows = useMemo(() => {
    const mockRows = reviewAccessAllowed && includeMockRows ? getMockModularHomeQuoteReviewRows() : [];
    return [...localRows, ...mockRows].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [includeMockRows, localRows, reviewAccessAllowed]);

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

  const refreshLocalRows = () => {
    setLocalRows(reviewAccessAllowed ? readLocalModularHomeQuoteReviewRows() : []);
  };

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

  if (!reviewAccessAllowed) {
    return (
      <main style={{ color: '#f8fafc', margin: '0 auto', maxWidth: '900px', padding: '72px 20px' }}>
        <section style={{
          background: 'linear-gradient(135deg, rgba(21, 16, 8, 0.96), rgba(2, 6, 23, 0.94))',
          border: '1px solid rgba(251, 191, 36, 0.26)',
          borderRadius: '30px',
          padding: '30px',
        }}>
          <div style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Local review only
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.055em', lineHeight: 0.98, margin: '10px 0 14px' }}>
            Modular Home quote review is not public
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            This local/mock lead viewer is available only on localhost until a protected admin backend is connected.
            No quote data is loaded or exported on public hosts.
          </p>
          <Link to="/expo-3d?homeDemo=1" style={{ ...actionButton('#a78bfa'), display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>
            Open home demo
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
          Internal review / local-first
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', letterSpacing: '-0.055em', lineHeight: 0.98, margin: '10px 0 14px' }}>
          Modular Home quote review
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0, maxWidth: '900px' }}>
          Review local preview quote requests and mock sales examples before a protected backend inbox is connected.
          This page does not fetch public quote data and is not linked from the public navigation.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
          <button onClick={refreshLocalRows} style={actionButton('#38bdf8')} type="button">
            Refresh local queue
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
      </section>

      <section style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: '24px' }}>
        {statCard('All review rows', summary.totalCount, '#fbbf24')}
        {statCard('Local queue', summary.localCount, '#38bdf8')}
        {statCard('Mock examples', summary.mockCount, '#a78bfa')}
        {statCard('Visible rows', visibleSummary.totalCount, '#34d399')}
        {statCard('Visible estimate', formatMoney(visibleSummary.totalEstimate), '#fde68a')}
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
            <option value="local-preview">Local preview</option>
            <option value="mock-review">Mock review</option>
          </select>
        </label>
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
      </section>

      {visibleRows.length === 0 ? (
        <section style={{
          border: '1px dashed rgba(148, 163, 184, 0.28)',
          borderRadius: '24px',
          color: '#94a3b8',
          padding: '42px 20px',
          textAlign: 'center',
        }}>
          No Modular Home quote rows match the current filters.
        </section>
      ) : (
        <section style={{ display: 'grid', gap: '16px' }}>
          {visibleRows.map((row) => {
            const statusTone = getStatusTone(row.status);

            return (
              <article
                key={`${row.source}:${row.id}`}
                data-modular-home-quote-row={row.id}
                style={{
                  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.72))',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
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

                <div style={{
                  display: 'grid',
                  gap: '10px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  marginTop: '16px',
                }}>
                  {[
                    ['Facade', row.config.facade],
                    ['Roof', row.config.roof],
                    ['Terrace', row.config.terrace],
                    ['Finish', row.config.finishLevel],
                    ['Land', row.landOwned],
                    ['Target', row.targetBuildDate],
                    ['Budget', row.budgetRange],
                  ].map(([label, value]) => (
                    <div key={label} style={{
                      background: 'rgba(2, 6, 23, 0.46)',
                      border: '1px solid rgba(148, 163, 184, 0.14)',
                      borderRadius: '14px',
                      padding: '12px',
                    }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ color: '#f8fafc', fontSize: '0.92rem', fontWeight: 850, marginTop: '5px' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <p style={{
                  background: 'rgba(15, 23, 42, 0.52)',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                  borderRadius: '16px',
                  color: '#e2e8f0',
                  lineHeight: 1.55,
                  margin: '16px 0 0',
                  padding: '14px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {row.message}
                </p>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

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

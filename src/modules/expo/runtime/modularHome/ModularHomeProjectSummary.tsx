import { useMemo, useState } from 'react';
import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import { formatHomeEstimateEur, type ModularHomeEstimate } from './modularHomeEstimate';

type ModularHomeProjectSummaryProps = {
  config: ModularHomeConfiguratorState;
  estimate: ModularHomeEstimate;
  isTouchDevice?: boolean;
};

type ProjectIdentity = {
  generatedAt: Date;
  projectId: string;
};

function createProjectIdentity(): ProjectIdentity {
  const generatedAt = new Date();

  return {
    generatedAt,
    projectId: `home-preview-${generatedAt.getTime().toString(36)}`,
  };
}

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function normalizeSizeLabel(sizeLabel: string) {
  return sizeLabel.replace('m2', 'm\u00b2');
}

function createSummaryText(identity: ProjectIdentity, estimate: ModularHomeEstimate) {
  return [
    'Modular Home Project Summary',
    `Project ID: ${identity.projectId}`,
    `Generated: ${formatGeneratedAt(identity.generatedAt)}`,
    `Model: ${estimate.baseModel}`,
    `Size: ${normalizeSizeLabel(estimate.sizeLabel)}`,
    `Facade: ${estimate.selectedOptions.facade}`,
    `Roof: ${estimate.selectedOptions.roof}`,
    `Terrace: ${estimate.selectedOptions.terrace}`,
    `Finish level: ${estimate.selectedOptions.finishLevel}`,
    `Estimated total: ${formatHomeEstimateEur(estimate.totalPrice)}`,
    estimate.disclaimer,
  ].join('\n');
}

function stopSummaryEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeProjectSummary({ config, estimate, isTouchDevice = false }: ModularHomeProjectSummaryProps) {
  const [identity] = useState(createProjectIdentity);
  const [copyStatus, setCopyStatus] = useState('');
  const summaryText = useMemo(() => createSummaryText(identity, estimate), [estimate, identity]);
  const summaryRows = [
    ['Model', estimate.baseModel],
    ['Size', normalizeSizeLabel(estimate.sizeLabel)],
    ['Facade', estimate.selectedOptions.facade],
    ['Roof', estimate.selectedOptions.roof],
    ['Terrace', estimate.selectedOptions.terrace],
    ['Finish', estimate.selectedOptions.finishLevel],
  ] as const;

  const copySummary = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        setCopyStatus('Copy summary text manually from this panel.');
        return;
      }

      await navigator.clipboard.writeText(summaryText);
      setCopyStatus('Project summary copied locally.');
    } catch {
      setCopyStatus('Copy summary text manually from this panel.');
    }
  };

  const printSummary = () => {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      return;
    }

    window.print();
  };

  return (
    <section
      aria-label={`${estimate.baseModel} printable project summary`}
      data-home-project-summary="true"
      data-home-project-summary-config={`${config.template}:${config.facade}:${config.roof}:${config.terrace}:${config.finishLevel}`}
      data-home-project-summary-id={identity.projectId}
      onClick={stopSummaryEvent}
      onMouseDown={stopSummaryEvent}
      onPointerDown={stopSummaryEvent}
      style={{
        background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.58), rgba(2, 6, 23, 0.7))',
        border: '1px solid rgba(125, 211, 252, 0.28)',
        borderRadius: isTouchDevice ? '15px' : '17px',
        marginTop: isTouchDevice ? '10px' : '12px',
        padding: isTouchDevice ? '10px' : '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div style={{ color: '#7dd3fc', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Project summary
          </div>
          <div style={{ color: '#f0f9ff', fontSize: isTouchDevice ? '0.82rem' : '0.9rem', fontWeight: 950, marginTop: '4px' }}>
            Print-ready {estimate.baseModel} summary
          </div>
        </div>
        <div
          data-home-project-summary-id-label="true"
          style={{
            background: 'rgba(15, 23, 42, 0.58)',
            border: '1px solid rgba(125, 211, 252, 0.24)',
            borderRadius: '999px',
            color: '#bae6fd',
            fontSize: '0.52rem',
            fontWeight: 900,
            padding: '5px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          {identity.projectId}
        </div>
      </div>

      <div
        data-home-project-summary-generated="true"
        style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 800, marginTop: '7px' }}
      >
        Generated {formatGeneratedAt(identity.generatedAt)}
      </div>

      <div
        aria-label="Project summary rows"
        style={{
          display: 'grid',
          gap: '6px',
          gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          marginTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        {summaryRows.map(([label, value]) => (
          <div
            key={label}
            data-home-project-summary-row={`${label}:${value}`}
            style={{
              background: 'rgba(15, 23, 42, 0.52)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              borderRadius: '10px',
              padding: isTouchDevice ? '6px 7px' : '7px 8px',
            }}
          >
            <div style={{ color: '#7dd3fc', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 860, marginTop: '3px' }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        data-home-project-summary-total="true"
        style={{
          alignItems: 'end',
          borderTop: '1px solid rgba(125, 211, 252, 0.22)',
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: '1fr auto',
          marginTop: isTouchDevice ? '9px' : '10px',
          paddingTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        <span style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 900 }}>Estimated total</span>
        <span style={{ color: '#fef9c3', fontSize: isTouchDevice ? '1rem' : '1.1rem', fontWeight: 980 }}>{formatHomeEstimateEur(estimate.totalPrice)}</span>
      </div>

      <div
        data-home-project-summary-disclaimer="true"
        style={{
          color: '#bae6fd',
          fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
          fontWeight: 800,
          lineHeight: 1.28,
          marginTop: isTouchDevice ? '8px' : '9px',
        }}
      >
        {estimate.disclaimer}
      </div>

      <pre
        data-home-project-summary-copy-text="true"
        style={{
          background: 'rgba(2, 6, 23, 0.48)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '10px',
          color: '#e0f2fe',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
          lineHeight: 1.35,
          margin: isTouchDevice ? '9px 0 0' : '10px 0 0',
          maxHeight: isTouchDevice ? '110px' : '130px',
          overflow: 'auto',
          padding: '8px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {summaryText}
      </pre>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: isTouchDevice ? '9px' : '10px' }}>
        <button
          type="button"
          data-home-project-summary-copy="true"
          onClick={(event) => {
            event.stopPropagation();
            void copySummary();
          }}
          style={{
            background: 'rgba(14, 165, 233, 0.24)',
            border: '1px solid rgba(125, 211, 252, 0.36)',
            borderRadius: '999px',
            color: '#e0f2fe',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '0.58rem',
            fontWeight: 920,
            letterSpacing: '0.08em',
            padding: '7px 9px',
            textTransform: 'uppercase',
          }}
        >
          Copy summary
        </button>
        <button
          type="button"
          data-home-project-summary-print="true"
          onClick={(event) => {
            event.stopPropagation();
            printSummary();
          }}
          style={{
            background: 'rgba(251, 191, 36, 0.18)',
            border: '1px solid rgba(251, 191, 36, 0.34)',
            borderRadius: '999px',
            color: '#fef3c7',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '0.58rem',
            fontWeight: 920,
            letterSpacing: '0.08em',
            padding: '7px 9px',
            textTransform: 'uppercase',
          }}
        >
          Print from browser
        </button>
      </div>

      {copyStatus ? (
        <div data-home-project-summary-copy-status="true" style={{ color: '#bbf7d0', fontSize: '0.6rem', fontWeight: 880, marginTop: '8px' }}>
          {copyStatus}
        </div>
      ) : null}
    </section>
  );
}

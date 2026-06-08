import { useMemo, useState } from 'react';
import type { ModularHomeConfiguratorState, ModularHomeViewModeOption } from './modularHomeConfigurator';
import { createModularHomeShareUrl } from './modularHomeShareUrl';

type ModularHomeShareLinkPanelProps = {
  config: ModularHomeConfiguratorState;
  invalidShareKeys?: readonly string[];
  isTouchDevice?: boolean;
  viewMode: ModularHomeViewModeOption;
};

function stopShareLinkEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeShareLinkPanel({
  config,
  invalidShareKeys = [],
  isTouchDevice = false,
  viewMode,
}: ModularHomeShareLinkPanelProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const shareUrl = useMemo(() => createModularHomeShareUrl(config, undefined, viewMode), [config, viewMode]);
  const hasInvalidShareKeys = invalidShareKeys.length > 0;

  const copyShareUrl = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
      setCopyStatus('Copy the link manually from the field below.');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Configuration link copied locally.');
    } catch {
      setCopyStatus('Copy the link manually from the field below.');
    }
  };

  return (
    <section
      aria-label="Share Modular Home configuration"
      data-home-share-link-panel="true"
      data-home-share-link-invalid-keys={invalidShareKeys.join(',')}
      data-home-share-link-view-mode={viewMode}
      onClick={stopShareLinkEvent}
      onMouseDown={stopShareLinkEvent}
      onPointerDown={stopShareLinkEvent}
      style={{
        background: 'linear-gradient(180deg, rgba(30, 64, 175, 0.24), rgba(2, 6, 23, 0.56))',
        border: '1px solid rgba(96, 165, 250, 0.28)',
        borderRadius: isTouchDevice ? '15px' : '17px',
        marginTop: isTouchDevice ? '10px' : '12px',
        padding: isTouchDevice ? '10px' : '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div style={{ color: '#93c5fd', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Shareable config link
          </div>
          <div style={{ color: '#eff6ff', fontSize: isTouchDevice ? '0.78rem' : '0.86rem', fontWeight: 950, marginTop: '4px' }}>
            Copy this home setup
          </div>
        </div>
        <button
          type="button"
          data-home-share-link-copy="true"
          onClick={(event) => {
            event.stopPropagation();
            void copyShareUrl();
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.95), rgba(45, 212, 191, 0.86))',
            border: 'none',
            borderRadius: '999px',
            color: '#082f49',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
            fontWeight: 950,
            letterSpacing: '0.08em',
            padding: isTouchDevice ? '6px 8px' : '7px 10px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Copy link
        </button>
      </div>

      <div
        data-home-share-link-url="true"
        title={shareUrl}
        style={{
          background: 'rgba(15, 23, 42, 0.58)',
          border: '1px solid rgba(147, 197, 253, 0.18)',
          borderRadius: '12px',
          color: '#dbeafe',
          fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
          fontWeight: 760,
          lineHeight: 1.35,
          marginTop: '9px',
          overflowWrap: 'anywhere',
          padding: isTouchDevice ? '8px 9px' : '9px 10px',
        }}
      >
        {shareUrl}
      </div>

      {hasInvalidShareKeys ? (
        <div
          data-home-share-link-fallback-note="true"
          style={{
            color: '#fde68a',
            fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
            fontWeight: 850,
            lineHeight: 1.28,
            marginTop: '8px',
          }}
        >
          Some URL options were invalid or incompatible and were safely reset: {invalidShareKeys.join(', ')}.
        </div>
      ) : null}

      {copyStatus ? (
        <div data-home-share-link-status="true" style={{ color: '#bfdbfe', fontSize: '0.58rem', fontWeight: 900, marginTop: '8px' }}>
          {copyStatus}
        </div>
      ) : null}

      <div
        data-home-share-link-disclaimer="true"
        style={{
          borderTop: '1px solid rgba(96, 165, 250, 0.18)',
          color: '#93c5fd',
          fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
          fontWeight: 800,
          lineHeight: 1.28,
          marginTop: isTouchDevice ? '8px' : '9px',
          paddingTop: isTouchDevice ? '7px' : '8px',
        }}
      >
        URL-only preview state. No backend storage or server-side project share is created.
      </div>
    </section>
  );
}

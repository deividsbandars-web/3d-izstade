import type { ReactNode } from 'react';
import WarpalaLogo from '../../../shared/Logo';

type AdminAccessNotice = {
  actionLabel: string;
  actionPath: string;
  body: string;
  detail: string;
  title: string;
} | null;

export function CompanyAdminPageHeader({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
      <WarpalaLogo size={50} />
      <div style={{ display: 'flex', gap: '15px' }}>
        <button onClick={() => onNavigate('/expo/sponsor-leads?sponsor=sponsor-concierge')} className="btn-glass">SPONSOR LEADS</button>
        <button onClick={() => onNavigate('/expo-3d?operator=1')} className="btn-glass">OPEN 3D OPERATOR</button>
        <button onClick={() => onNavigate('/dashboard')} className="btn-glass">DASHBOARD</button>
      </div>
    </div>
  );
}

export function CompanyAdminMessage({
  message,
}: {
  message: { type: 'success' | 'error'; text: string } | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '30px',
        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
        border: `1px solid ${message.type === 'success' ? '#10b981' : '#f43f5e'}`,
        textAlign: 'center',
        fontWeight: 700,
      }}
    >
      {message.text}
    </div>
  );
}

export function CompanyAdminAccessNotice({
  notice,
  onNavigate,
}: {
  notice: AdminAccessNotice;
  onNavigate: (path: string) => void;
}) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        borderRadius: '18px',
        marginBottom: '30px',
        background: 'rgba(15, 23, 42, 0.82)',
        border: '1px solid rgba(251, 191, 36, 0.42)',
      }}
    >
      <div style={{ color: '#fbbf24', fontSize: '0.74rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {notice.title}
      </div>
      <div style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 800, marginTop: '8px' }}>
        {notice.body}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, marginTop: '8px' }}>
        {notice.detail}
      </div>
      <button
        type="button"
        className="btn-glass"
        onClick={() => onNavigate(notice.actionPath)}
        style={{ marginTop: '14px' }}
      >
        {notice.actionLabel}
      </button>
    </div>
  );
}

export function CompanyAdminLaunchFlow({
  boothPublicationLabel,
  children,
  launchStepCount,
  unblockedLaunchStepCount,
}: {
  boothPublicationLabel: string;
  children: ReactNode;
  launchStepCount: number;
  unblockedLaunchStepCount: number;
}) {
  return (
    <section
      className="glass-card"
      style={{
        background: 'linear-gradient(135deg, rgba(8, 13, 30, 0.92), rgba(14, 45, 64, 0.72))',
        border: '1px solid rgba(125, 211, 252, 0.2)',
        borderRadius: '24px',
        marginBottom: '30px',
        padding: '22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#67e8f9', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Sponsor launch flow
          </div>
          <h2 style={{ color: '#f8fafc', margin: '8px 0 6px', fontSize: '1.55rem' }}>
            From uploaded media to booth profile
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.55, margin: 0, maxWidth: '720px' }}>
            Use this checklist before sending a sponsor profile for review. It separates admin-managed booth content from public scene release, so draft sponsor work does not leak into the default city.
          </p>
        </div>
        <div style={{ minWidth: '190px', padding: '14px 16px', borderRadius: '18px', background: 'rgba(2, 6, 23, 0.62)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Unblocked
          </div>
          <div style={{ color: '#f8fafc', fontSize: '1.75rem', fontWeight: 950, marginTop: '4px' }}>
            {unblockedLaunchStepCount}/{launchStepCount}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.45 }}>
            Booth status: {boothPublicationLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '18px' }}>
        {children}
      </div>
    </section>
  );
}

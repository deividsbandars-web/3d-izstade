import WarpalaLogo from '../../../shared/Logo';

type AccessNotice = {
  accent: string;
  actionHref: string;
  actionLabel: string;
  body: string;
  detail: string;
  title: string;
} | null;

export function SponsorLeadInboxPageHeader() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', marginBottom: '34px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <WarpalaLogo size={46} />
        <div>
          <div style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Expo Sponsor Ops
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.04em' }}>Sponsor Lead Inbox</h1>
        </div>
      </div>
      <a href="/expo-3d?salesDemo=1" className="btn-glass" style={{ textDecoration: 'none' }}>OPEN SALES DEMO</a>
    </header>
  );
}

export function SponsorLeadInboxHero({
  displayName,
  latestInbound,
  sponsorSlug,
}: {
  displayName: string;
  latestInbound: string;
  sponsorSlug: string;
}) {
  return (
    <section className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {sponsorSlug}
          </div>
          <h2 style={{ margin: '8px 0 8px', fontSize: '1.65rem' }}>{displayName}</h2>
          <p style={{ margin: 0, color: '#cbd5e1', maxWidth: '680px', lineHeight: 1.55 }}>
            Real inbound leads captured from the Web3D Expo sponsor flow. Use this page to confirm that sponsor interest is being stored and is ready for follow-up operations.
          </p>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'right' }}>
          Latest inbound<br />
          <strong style={{ color: '#f8fafc' }}>{latestInbound}</strong>
        </div>
      </div>
    </section>
  );
}

export function SponsorLeadInboxAccessNotice({ notice }: { notice: AccessNotice }) {
  if (!notice) {
    return null;
  }

  return (
    <section className="glass-card" style={{ padding: '22px', borderRadius: '20px', marginBottom: '24px', border: `1px solid ${notice.accent}73` }}>
      <h2 style={{ marginTop: 0, color: notice.accent }}>{notice.title}</h2>
      <p style={{ color: '#cbd5e1', lineHeight: 1.55, marginBottom: '10px' }}>{notice.body}</p>
      <p style={{ color: '#94a3b8', lineHeight: 1.55, margin: '0 0 16px' }}>{notice.detail}</p>
      <a href={notice.actionHref} className="btn-glass" style={{ textDecoration: 'none' }}>{notice.actionLabel}</a>
    </section>
  );
}

export function SponsorLeadInboxMessage({
  message,
}: {
  message: { type: 'success' | 'error'; text: string } | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <section
      className="glass-card"
      style={{
        padding: '16px 18px',
        borderRadius: '18px',
        marginBottom: '24px',
        border: `1px solid ${message.type === 'success' ? 'rgba(52,211,153,0.45)' : 'rgba(248,113,113,0.45)'}`,
        color: message.type === 'success' ? '#bbf7d0' : '#fecaca',
      }}
    >
      {message.text}
    </section>
  );
}

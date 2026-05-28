import { Link } from 'react-router-dom';
import '../../components/calculator/styles/CalculatorPro.css';
import WarpalaLogo from '../../shared/Logo';

type PackageCard = {
  accent: string;
  audience: string;
  cta: string;
  description: string;
  features: string[];
  id: string;
  label: string;
  readiness: string;
  title: string;
};

const SPONSOR_PACKAGES: PackageCard[] = [
  {
    accent: '#38bdf8',
    audience: 'Best for product launches, founder showcases and sponsor discovery.',
    cta: 'Open Standard preview',
    description: 'A clear product profile inside the Web3D Expo with a short pitch, demo CTA and sponsor interest path.',
    features: ['Product profile and pitch', 'Demo-ready showcase screen', 'Sponsor package request path'],
    id: 'standard',
    label: 'Standard Booth',
    readiness: 'Visible in sales demo',
    title: 'Standard Booth',
  },
  {
    accent: '#fbbf24',
    audience: 'Best for sponsors that need meetings, lead quality and follow-up operations.',
    cta: 'Open Premium preview',
    description: 'A premium booth package for booked meetings, AI qualification preview and lead report readiness.',
    features: ['Meeting-ready sponsor package', 'AI qualification preview', 'Lead report package'],
    id: 'premium',
    label: 'Premium Booth',
    readiness: 'Visible in sales demo',
    title: 'Premium Booth',
  },
  {
    accent: '#34d399',
    audience: 'Best for anchor sponsors that want zone ownership and high visibility.',
    cta: 'Open Landmark preview',
    description: 'A top-tier sponsor package with zone naming, hero sponsor presence and event inventory.',
    features: ['Zone naming rights', 'Hero screen placement', 'Demo Arena sponsor slot'],
    id: 'landmark',
    label: 'Landmark Zone Sponsor',
    readiness: 'Visible in sales demo',
    title: 'Landmark Zone Sponsor',
  },
  {
    accent: '#a78bfa',
    audience: 'Best for monthly campaigns, investor days and product battle sponsorship.',
    cta: 'Open Arena preview',
    description: 'Event programming inventory for demo battles, startup nights, recaps and sponsor reporting.',
    features: ['Monthly demo battles', 'Sponsor slot inventory', 'Agenda, status and recap screens'],
    id: 'arena',
    label: 'Demo Arena Sponsor',
    readiness: 'Preview only',
    title: 'Demo Arena Sponsor',
  },
];

const READINESS_ROWS = [
  ['Clean sales demo URL', 'Ready now', '/expo-3d?salesDemo=1'],
  ['Sponsor lead capture frontend', 'Ready; backend required for live storage', '/expo-3d?salesDemo=1&salesDemoStep=premium'],
  ['Sponsor lead inbox UI', 'Ready; requires login and backend API', '/expo/sponsor-leads?sponsor=sponsor-concierge'],
  ['Package page', 'Ready now', '/expo/sponsor-packages'],
];

export default function SponsorPackages() {
  return (
    <main
      style={{
        background:
          'radial-gradient(circle at 12% 4%, rgba(56, 189, 248, 0.16), transparent 30%), linear-gradient(180deg, #020617 0%, #08111f 46%, #020617 100%)',
        color: '#f8fafc',
        minHeight: '100vh',
        padding: '42px 20px 72px',
      }}
    >
      <div style={{ margin: '0 auto', maxWidth: '1180px' }}>
        <header
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            justifyContent: 'space-between',
            marginBottom: '34px',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
            <WarpalaLogo size={48} />
            <div>
              <div
                style={{
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Web3D Expo Sponsorship
              </div>
              <h1 style={{ fontSize: 'clamp(2.3rem, 6vw, 5rem)', letterSpacing: '-0.055em', lineHeight: 0.96, margin: '6px 0 0' }}>
                Sponsor packages that turn expo traffic into leads.
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link className="btn-glass" to="/expo-3d?salesDemo=1" style={{ textDecoration: 'none' }}>
              OPEN SALES DEMO
            </Link>
            <Link className="btn-glass" to="/login" style={{ textDecoration: 'none' }}>
              SPONSOR LOGIN
            </Link>
          </div>
        </header>

        <section className="glass-card" style={{ borderRadius: '28px', marginBottom: '24px', padding: '28px' }}>
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div>
              <p style={{ color: '#cbd5e1', fontSize: '1.06rem', lineHeight: 1.62, margin: 0, maxWidth: '760px' }}>
                This page is the non-3D sponsor sales layer for the expo. It explains what can be sold today,
                what appears in the Web3D sales demo, and what becomes live once backend services are restored.
              </p>
            </div>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(125, 211, 252, 0.22)',
                borderRadius: '20px',
                padding: '18px',
              }}
            >
              <div style={{ color: '#93c5fd', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Current readiness
              </div>
              <div style={{ color: '#f8fafc', fontSize: '1.45rem', fontWeight: 950, marginTop: '8px' }}>
                Frontend sales flow ready
              </div>
              <p style={{ color: '#94a3b8', lineHeight: 1.45, margin: '8px 0 0' }}>
                Live lead storage and inbox data depend on the staging/backend API being online.
              </p>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '24px' }}>
          {SPONSOR_PACKAGES.map((entry) => (
            <article
              key={entry.id}
              className="glass-card"
              style={{
                borderColor: `${entry.accent}55`,
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '390px',
                padding: '22px',
              }}
            >
              <div style={{ color: entry.accent, fontSize: '0.68rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {entry.label}
              </div>
              <h2 style={{ fontSize: '1.55rem', letterSpacing: '-0.035em', lineHeight: 1.05, margin: '10px 0 10px' }}>{entry.title}</h2>
              <p style={{ color: '#cbd5e1', lineHeight: 1.48, margin: 0 }}>{entry.description}</p>
              <ul style={{ display: 'grid', gap: '10px', listStyle: 'none', margin: '18px 0', padding: 0 }}>
                {entry.features.map((feature) => (
                  <li key={feature} style={{ alignItems: 'center', color: '#f8fafc', display: 'flex', gap: '10px', fontSize: '0.93rem' }}>
                    <span style={{ background: entry.accent, borderRadius: '999px', display: 'inline-block', height: '7px', width: '7px' }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <p style={{ color: '#94a3b8', lineHeight: 1.45, margin: 'auto 0 16px' }}>{entry.audience}</p>
              <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
                <span
                  style={{
                    background: `${entry.accent}1c`,
                    border: `1px solid ${entry.accent}55`,
                    borderRadius: '999px',
                    color: entry.accent,
                    fontSize: '0.68rem',
                    fontWeight: 950,
                    letterSpacing: '0.06em',
                    padding: '7px 10px',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.readiness}
                </span>
                <Link
                  to={`/expo-3d?salesDemo=1&salesDemoStep=${entry.id === 'arena' ? 'arena' : entry.id}`}
                  style={{
                    color: '#e0f2fe',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    textDecoration: 'none',
                  }}
                >
                  {entry.cta}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="glass-card" style={{ borderRadius: '26px', padding: '24px' }}>
          <div style={{ alignItems: 'baseline', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.65rem', letterSpacing: '-0.035em', margin: 0 }}>Expo function readiness</h2>
            <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              No server required to view this page
            </span>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {READINESS_ROWS.map(([name, status, href]) => (
              <Link
                key={name}
                to={href}
                style={{
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.58)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '16px',
                  color: '#f8fafc',
                  display: 'grid',
                  gap: '10px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  padding: '14px 16px',
                  textDecoration: 'none',
                }}
              >
                <strong>{name}</strong>
                <span style={{ color: '#cbd5e1' }}>{status}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
  readSponsorPackageRequestQueue,
  saveSponsorPackageRequest,
  validateSponsorPackageRequestForm,
  type SponsorPackageInterest,
  type SponsorPackageRequestForm,
} from '../../app/expo/sponsorPackageRequest';
import '../../components/calculator/styles/CalculatorPro.css';
import WarpalaLogo from '../../shared/Logo';

type PackageCard = {
  accent: string;
  audience: string;
  cta: string;
  description: string;
  features: string[];
  id: Exclude<SponsorPackageInterest, 'unsure'>;
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

const PACKAGE_INTEREST_OPTIONS: Array<{ label: string; value: SponsorPackageInterest }> = [
  { label: 'Premium Booth', value: 'premium' },
  { label: 'Standard Booth', value: 'standard' },
  { label: 'Landmark Zone Sponsor', value: 'landmark' },
  { label: 'Demo Arena Sponsor', value: 'arena' },
  { label: 'Not sure yet', value: 'unsure' },
];

const BUDGET_OPTIONS = [
  'Under 5k',
  '5k-15k',
  '15k-50k',
  '50k+',
  'Need package guidance',
];

const TIMELINE_OPTIONS = [
  'This month',
  'Next month',
  'This quarter',
  'Planning ahead',
];

const inputStyle: CSSProperties = {
  background: 'rgba(2, 6, 23, 0.78)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '15px',
  color: '#f8fafc',
  font: 'inherit',
  padding: '13px 14px',
  width: '100%',
};

const labelStyle: CSSProperties = {
  color: '#cbd5e1',
  display: 'grid',
  fontSize: '0.78rem',
  fontWeight: 800,
  gap: '8px',
};

export default function SponsorPackages() {
  const [requestForm, setRequestForm] = useState<SponsorPackageRequestForm>(INITIAL_SPONSOR_PACKAGE_REQUEST_FORM);
  const [requestStatus, setRequestStatus] = useState<{ text: string; tone: 'error' | 'idle' | 'success' }>({
    text: 'Requests are saved locally until the backend service is restored.',
    tone: 'idle',
  });
  const [queuedRequestCount, setQueuedRequestCount] = useState(() => readSponsorPackageRequestQueue().length);

  function updateRequestField<Field extends keyof SponsorPackageRequestForm>(
    field: Field,
    value: SponsorPackageRequestForm[Field],
  ) {
    setRequestForm((current) => ({ ...current, [field]: value }));
  }

  function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSponsorPackageRequestForm(requestForm);
    if (validationError) {
      setRequestStatus({ text: validationError, tone: 'error' });
      return;
    }

    try {
      const result = saveSponsorPackageRequest(requestForm);
      setQueuedRequestCount(result.queueCount);
      setRequestForm({
        ...INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
        packageInterest: requestForm.packageInterest,
      });
      setRequestStatus({
        text: `Saved locally as sponsor package request #${result.queueCount}. Backend sync is pending until the API is back online.`,
        tone: 'success',
      });
    } catch (error) {
      setRequestStatus({
        text: `Could not save the request locally: ${error instanceof Error ? error.message : String(error)}`,
        tone: 'error',
      });
    }
  }

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

        <section
          className="glass-card"
          data-sponsor-package-request-form="true"
          style={{ borderRadius: '28px', marginBottom: '24px', padding: '26px' }}
        >
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div>
              <div style={{ color: '#34d399', fontSize: '0.74rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Sponsor package request
              </div>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3.2rem)', letterSpacing: '-0.05em', lineHeight: 1, margin: '10px 0 12px' }}>
                Capture sponsor intent before the backend is back.
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.58, margin: 0 }}>
                This form is frontend-only for now. It validates sponsor interest and stores requests in this browser so the sales flow can be reviewed without live server access.
              </p>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.72)',
                  border: '1px solid rgba(52, 211, 153, 0.26)',
                  borderRadius: '18px',
                  color: '#bbf7d0',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  lineHeight: 1.45,
                  marginTop: '18px',
                  padding: '14px 15px',
                }}
              >
                Local queue: {queuedRequestCount} request{queuedRequestCount === 1 ? '' : 's'} waiting for backend sync.
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} style={{ display: 'grid', gap: '13px' }}>
              <div style={{ display: 'grid', gap: '13px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label style={labelStyle}>
                  Contact name
                  <input
                    autoComplete="name"
                    onChange={(event) => updateRequestField('name', event.target.value)}
                    placeholder="Jane Sponsor"
                    style={inputStyle}
                    type="text"
                    value={requestForm.name}
                  />
                </label>
                <label style={labelStyle}>
                  Work email
                  <input
                    autoComplete="email"
                    onChange={(event) => updateRequestField('email', event.target.value)}
                    placeholder="jane@company.com"
                    style={inputStyle}
                    type="email"
                    value={requestForm.email}
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gap: '13px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label style={labelStyle}>
                  Company
                  <input
                    autoComplete="organization"
                    onChange={(event) => updateRequestField('company', event.target.value)}
                    placeholder="Company name"
                    style={inputStyle}
                    type="text"
                    value={requestForm.company}
                  />
                </label>
                <label style={labelStyle}>
                  Website
                  <input
                    autoComplete="url"
                    onChange={(event) => updateRequestField('website', event.target.value)}
                    placeholder="https://company.com"
                    style={inputStyle}
                    type="url"
                    value={requestForm.website}
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gap: '13px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label style={labelStyle}>
                  Package interest
                  <select
                    onChange={(event) => updateRequestField('packageInterest', event.target.value as SponsorPackageInterest)}
                    style={inputStyle}
                    value={requestForm.packageInterest}
                  >
                    {PACKAGE_INTEREST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Budget signal
                  <select
                    onChange={(event) => updateRequestField('budgetRange', event.target.value)}
                    style={inputStyle}
                    value={requestForm.budgetRange}
                  >
                    <option value="">Select range</option>
                    {BUDGET_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Timeline
                  <select
                    onChange={(event) => updateRequestField('timeline', event.target.value)}
                    style={inputStyle}
                    value={requestForm.timeline}
                  >
                    <option value="">Select timeline</option>
                    {TIMELINE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Sponsorship goal
                <textarea
                  onChange={(event) => updateRequestField('message', event.target.value)}
                  placeholder="Tell us what you want to sponsor, launch, or measure."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={requestForm.message}
                />
              </label>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #0ea5e9)',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#03131a',
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  fontWeight: 950,
                  letterSpacing: '0.04em',
                  padding: '15px 18px',
                  textTransform: 'uppercase',
                }}
              >
                Save sponsor request
              </button>
              <div
                data-sponsor-package-request-status={requestStatus.tone}
                style={{
                  color: requestStatus.tone === 'error' ? '#fecaca' : requestStatus.tone === 'success' ? '#bbf7d0' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  lineHeight: 1.45,
                }}
              >
                {requestStatus.text}
              </div>
            </form>
          </div>
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

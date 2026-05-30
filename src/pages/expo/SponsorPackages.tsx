import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
  readSponsorPackageRequestQueue,
  saveSponsorPackageRequest,
  submitSponsorPackageRequestToBackend,
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
  demoHref: string;
  description: string;
  features: string[];
  id: Exclude<SponsorPackageInterest, 'arena' | 'unsure'>;
  label: string;
  outcome: string;
  priceSignal: string;
  title: string;
};

const SPONSOR_PACKAGES: PackageCard[] = [
  {
    accent: '#38bdf8',
    audience: 'Best for teams that need a credible Web3D presence without a custom sponsor program.',
    cta: 'Request Standard Booth',
    demoHref: '/expo-3d?salesDemo=1&salesDemoStep=standard',
    description: 'A focused sponsor booth with a product story, demo surface and clear interest path.',
    features: ['Product profile and short pitch', 'Demo-ready showcase screen', 'Sponsor interest capture'],
    id: 'standard',
    label: 'Standard Booth',
    outcome: 'Launch a visible expo booth and collect sponsor interest.',
    priceSignal: 'Entry package',
    title: 'Standard Booth',
  },
  {
    accent: '#fbbf24',
    audience: 'Best for sponsors that want meetings, stronger follow-up and lead-quality signals.',
    cta: 'Request Premium Booth',
    demoHref: '/expo-3d?salesDemo=1&salesDemoStep=premium',
    description: 'A higher-value booth package built around conversion, qualification and sponsor reporting.',
    features: ['Meeting-ready sponsor package', 'AI qualification preview', 'Lead report package'],
    id: 'premium',
    label: 'Premium Booth',
    outcome: 'Turn expo traffic into booked sponsor conversations.',
    priceSignal: 'Lead-gen package',
    title: 'Premium Booth',
  },
  {
    accent: '#34d399',
    audience: 'Best for anchor sponsors that want zone ownership and high visibility.',
    cta: 'Request Landmark Sponsor',
    demoHref: '/expo-3d?salesDemo=1&salesDemoStep=landmark',
    description: 'The flagship sponsor package: own a zone, appear on hero surfaces and tie into event programming.',
    features: ['Zone naming rights', 'Hero sponsor presence', 'Demo Arena sponsor slot', 'Monthly sponsor report'],
    id: 'landmark',
    label: 'Landmark Zone Sponsor',
    outcome: 'Own the highest-visibility sponsor story in the expo.',
    priceSignal: 'Flagship package',
    title: 'Landmark Zone Sponsor',
  },
];

const SALES_ASSET_ROWS = [
  ['Sales demo walkthrough', 'Landmark, Premium, Standard and Demo Arena sponsor preview', '/expo-3d?salesDemo=1'],
  ['Premium lead capture', 'Sponsor Concierge meeting-interest form in the Web3D demo', '/expo-3d?salesDemo=1&salesDemoStep=premium'],
  ['Sponsor follow-up workspace', 'Protected internal inbox for submitted sponsor leads', '/expo/sponsor-leads?sponsor=sponsor-concierge'],
  ['Calculator lead funnels', 'Estimate-to-lead examples for service and construction partners', '/calculators'],
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
  const [requestStatus, setRequestStatus] = useState<{ text: string; tone: 'error' | 'idle' | 'submitting' | 'success' }>({
    text: 'Tell us what you want to sponsor. The request is sent to sponsor ops and protected with a browser backup.',
    tone: 'idle',
  });
  const [queuedRequestCount, setQueuedRequestCount] = useState(() => readSponsorPackageRequestQueue().length);

  function updateRequestField<Field extends keyof SponsorPackageRequestForm>(
    field: Field,
    value: SponsorPackageRequestForm[Field],
  ) {
    setRequestForm((current) => ({ ...current, [field]: value }));
  }

  function selectPackage(packageInterest: PackageCard['id']) {
    const selectedPackage = SPONSOR_PACKAGES.find((entry) => entry.id === packageInterest);
    setRequestForm((current) => ({ ...current, packageInterest }));
    setRequestStatus({
      text: `${selectedPackage?.title ?? 'Sponsor package'} selected. Add contact details and we will follow up with the right package walkthrough.`,
      tone: 'idle',
    });

    if (typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        document
          .querySelector('[data-sponsor-package-request-form="true"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSponsorPackageRequestForm(requestForm);
    if (validationError) {
      setRequestStatus({ text: validationError, tone: 'error' });
      return;
    }

    setRequestStatus({ text: 'Sending sponsor request...', tone: 'submitting' });

    try {
      await submitSponsorPackageRequestToBackend(requestForm);
      let backupText = 'Browser backup was not available on this device.';

      try {
        const result = saveSponsorPackageRequest(requestForm, {
          persistence: 'backend',
          syncStatus: 'backend-synced',
        });
        setQueuedRequestCount(result.queueCount);
        backupText = `Protected browser backup #${result.queueCount} saved.`;
      } catch (localError) {
        backupText = `Request was received, but browser backup failed: ${localError instanceof Error ? localError.message : String(localError)}`;
      }

      setRequestForm({
        ...INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
        packageInterest: requestForm.packageInterest,
      });
      setRequestStatus({
        text: `Sponsor request received. ${backupText}`,
        tone: 'success',
      });
    } catch {
      try {
        const result = saveSponsorPackageRequest(requestForm);
        setQueuedRequestCount(result.queueCount);
        setRequestStatus({
          text: `Connection was interrupted, so the request was saved in this browser as backup #${result.queueCount}. We can sync it when backend access is available.`,
          tone: 'error',
        });
      } catch (localError) {
        setRequestStatus({
          text: `The request could not be saved in this browser: ${localError instanceof Error ? localError.message : String(localError)}`,
          tone: 'error',
        });
      }
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
                Sponsor the Web3D Expo before your competitors own the zone.
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
                Choose one of three sponsor packages, review the Web3D sales demo, and send a request with enough context
                for follow-up. The offer is built around booth presence, lead generation and landmark sponsorship.
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
                Sponsor funnel
              </div>
              <div style={{ color: '#f8fafc', fontSize: '1.45rem', fontWeight: 950, marginTop: '8px' }}>
                Three packages, one sponsor follow-up flow
              </div>
              <p style={{ color: '#94a3b8', lineHeight: 1.45, margin: '8px 0 0' }}>
                Standard, Premium and Landmark requests all land in the sponsor inbox with package interest, phone and
                follow-up context.
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
                {entry.priceSignal}
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
              <p style={{ color: '#f8fafc', fontWeight: 850, lineHeight: 1.45, margin: 'auto 0 8px' }}>{entry.outcome}</p>
              <p style={{ color: '#94a3b8', lineHeight: 1.45, margin: '0 0 16px' }}>{entry.audience}</p>
              <div style={{ display: 'grid', gap: '9px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <button
                  onClick={() => selectPackage(entry.id)}
                  style={{
                    background: `linear-gradient(135deg, ${entry.accent}, #f8fafc)`,
                    border: 'none',
                    borderRadius: '13px',
                    color: '#020617',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    fontWeight: 950,
                    letterSpacing: '0.04em',
                    padding: '11px 12px',
                    textTransform: 'uppercase',
                  }}
                  type="button"
                >
                  {entry.cta}
                </button>
                <Link
                  to={entry.demoHref}
                  style={{
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.72)',
                    border: `1px solid ${entry.accent}55`,
                    borderRadius: '13px',
                    color: '#e0f2fe',
                    display: 'flex',
                    fontSize: '0.76rem',
                    fontWeight: 900,
                    justifyContent: 'center',
                    padding: '10px 12px',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                  }}
                >
                  View in demo
                </Link>
              </div>
              <div style={{ marginTop: '12px' }}>
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
                  {entry.label}
                </span>
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
                Request a sponsor walkthrough.
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.58, margin: 0 }}>
                Choose a package above or select one here, then share the sponsor goal. The lead goes to the sponsor
                follow-up workspace with the selected package and contact phone.
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
                Protected browser backup: {queuedRequestCount} request{queuedRequestCount === 1 ? '' : 's'} stored on this device.
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
                  Phone / WhatsApp
                  <input
                    autoComplete="tel"
                    onChange={(event) => updateRequestField('phone', event.target.value)}
                    placeholder="+371 20000000"
                    style={inputStyle}
                    type="tel"
                    value={requestForm.phone}
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
                  Estimated budget
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
                  placeholder="Tell us what you want to sponsor, launch, measure or promote."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={requestForm.message}
                />
              </label>
              <button
                disabled={requestStatus.tone === 'submitting'}
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #0ea5e9)',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#03131a',
                  cursor: requestStatus.tone === 'submitting' ? 'wait' : 'pointer',
                  opacity: requestStatus.tone === 'submitting' ? 0.72 : 1,
                  fontSize: '0.92rem',
                  fontWeight: 950,
                  letterSpacing: '0.04em',
                  padding: '15px 18px',
                  textTransform: 'uppercase',
                }}
              >
                {requestStatus.tone === 'submitting' ? 'Sending request...' : 'Send sponsor request'}
              </button>
              <div
                data-sponsor-package-request-status={requestStatus.tone}
                style={{
                  color: requestStatus.tone === 'error' ? '#fecaca' : requestStatus.tone === 'success' ? '#bbf7d0' : requestStatus.tone === 'submitting' ? '#bae6fd' : '#94a3b8',
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
            <h2 style={{ fontSize: '1.65rem', letterSpacing: '-0.035em', margin: 0 }}>What sponsors can review today</h2>
            <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Sales assets
            </span>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {SALES_ASSET_ROWS.map(([name, status, href]) => (
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

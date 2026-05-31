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
  proof: string;
  title: string;
};

const SPONSOR_PACKAGES: PackageCard[] = [
  {
    accent: '#38bdf8',
    audience: 'Piemērots uzņēmumam, kam vajag kvalitatīvu digitālu klātbūtni bez lielas kampaņas sarežģītības.',
    cta: 'Pieteikt Standard',
    demoHref: '/expo-3d?salesDemo=1&salesDemoStep=standard',
    description: 'Redzams stends ar produkta stāstu, demo virsmu un vienkāršu intereses savākšanu.',
    features: ['Produkta profils un īss pitch', 'Demo-ready showcase ekrāns', 'Sponsor interest pieteikums'],
    id: 'standard',
    label: 'Standard Booth',
    outcome: 'Ātri palaist stendu un sākt vākt interesi no apmeklētājiem.',
    priceSignal: 'Ieejas pakete',
    proof: 'Skatāms sales demo kā Immersive Fabric Labs piemērs.',
    title: 'Standard Booth',
  },
  {
    accent: '#fbbf24',
    audience: 'Piemērots sponsoram, kam svarīgas tikšanās, kvalificēti lead signāli un sekojošs pārdošanas darbs.',
    cta: 'Pieteikt Premium',
    demoHref: '/expo-3d?salesDemo=1&salesDemoStep=premium',
    description: 'Augstākas vērtības sponsor stends ar fokusētu konversiju, kvalifikāciju un atskaiti.',
    features: ['Meeting-ready sponsor pakete', 'AI kvalifikācijas preview', 'Lead report pakete'],
    id: 'premium',
    label: 'Premium Booth',
    outcome: 'Pārvērst expo uzmanību konkrētās sarunās un pieteikumos.',
    priceSignal: 'Lead-gen pakete',
    proof: 'Skatāms sales demo kā Sponsor Concierge piemērs.',
    title: 'Premium Booth',
  },
  {
    accent: '#34d399',
    audience: 'Piemērots anchor sponsoram, kurš grib dominēt zonā, event programmā un sponsor komunikācijā.',
    cta: 'Pieteikt Landmark',
    demoHref: '/expo-3d?salesDemo=1&salesDemoStep=landmark',
    description: 'Flagship sponsora pakete ar zonas nosaukumu, hero virsmām un piesaisti Demo Arena programmām.',
    features: ['Zonas naming rights', 'Hero sponsor klātbūtne', 'Demo Arena sponsor slots', 'Mēneša sponsor report'],
    id: 'landmark',
    label: 'Landmark Zone Sponsor',
    outcome: 'Iegūt redzamāko sponsor stāstu visā Web3D expo pilsētā.',
    priceSignal: 'Flagship pakete',
    proof: 'Skatāms sales demo kā AI District Sponsor piemērs.',
    title: 'Landmark Zone Sponsor',
  },
];

const SALES_ASSET_ROWS = [
  ['Sales demo', 'Landmark, Premium, Standard un Demo Arena sponsor preview vienā URL', '/expo-3d?salesDemo=1'],
  ['3D/Web3D tāmes kalkulators', 'Ātrs budžeta signāls vizualizācijām, expo stendam vai Web3D demo', '/visuals-calculator'],
  ['Sponsor lead inbox', 'Aizsargāta iekšējā rinda pieteikumu apstrādei', '/expo/sponsor-leads?sponsor=sponsor-concierge'],
  ['Kalkulatoru lead funnels', 'Būvniecības un servisu piemēri, kas savāc kvalificētus pieprasījumus', '/calculators'],
];

const FUNNEL_STEPS = [
  ['1', 'Atver sales demo', 'Sponsors redz Web3D pilsētu, trīs paketes un Demo Arena potenciālu.'],
  ['2', 'Izvēlas sponsor līmeni', 'Standard, Premium vai Landmark tiek sasaistīts ar konkrētu pieteikumu.'],
  ['3', 'Nosūta sponsor interesi', 'Forma saglabā pieteikumu backendā un lokālā backup rindā.'],
  ['4', 'Komanda sagatavo nākamo soli', 'Var sekot sponsor walkthrough, piedāvājums vai demo zvans.'],
];

const PACKAGE_INTEREST_OPTIONS: Array<{ label: string; value: SponsorPackageInterest }> = [
  { label: 'Premium Booth', value: 'premium' },
  { label: 'Standard Booth', value: 'standard' },
  { label: 'Landmark Zone Sponsor', value: 'landmark' },
  { label: 'Demo Arena Sponsor', value: 'arena' },
  { label: 'Vajag palīdzību izvēlēties', value: 'unsure' },
];

const BUDGET_OPTIONS = [
  'Līdz 5k',
  '5k-15k',
  '15k-50k',
  '50k+',
  'Vajag paketes ieteikumu',
];

const TIMELINE_OPTIONS = [
  'Šomēnes',
  'Nākammēnes',
  'Šajā ceturksnī',
  'Plānojam vēlāk',
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

function getStatusColor(tone: 'error' | 'idle' | 'submitting' | 'success') {
  switch (tone) {
    case 'error':
      return '#fecaca';
    case 'success':
      return '#bbf7d0';
    case 'submitting':
      return '#bae6fd';
    default:
      return '#94a3b8';
  }
}

export default function SponsorPackages() {
  const [requestForm, setRequestForm] = useState<SponsorPackageRequestForm>(INITIAL_SPONSOR_PACKAGE_REQUEST_FORM);
  const [requestStatus, setRequestStatus] = useState<{ text: string; tone: 'error' | 'idle' | 'submitting' | 'success' }>({
    text: 'Izvēlies sponsor paketi un nosūti pieteikumu. Pieprasījums tiek sūtīts sponsor komandai un saglabāts ar lokālu backup.',
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
      text: `${selectedPackage?.title ?? 'Sponsor pakete'} izvēlēta. Pievieno kontaktus un sponsor mērķi, lai sagatavotu pareizo walkthrough.`,
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

    setRequestStatus({ text: 'Sūtu sponsor pieteikumu...', tone: 'submitting' });

    try {
      await submitSponsorPackageRequestToBackend(requestForm);
      let backupText = 'Lokālais pārlūka backup šajā ierīcē nebija pieejams.';

      try {
        const result = saveSponsorPackageRequest(requestForm, {
          persistence: 'backend',
          syncStatus: 'backend-synced',
        });
        setQueuedRequestCount(result.queueCount);
        backupText = `Lokālais backup #${result.queueCount} saglabāts.`;
      } catch (localError) {
        backupText = `Pieteikums saņemts, bet lokālais backup neizdevās: ${localError instanceof Error ? localError.message : String(localError)}`;
      }

      setRequestForm({
        ...INITIAL_SPONSOR_PACKAGE_REQUEST_FORM,
        packageInterest: requestForm.packageInterest,
      });
      setRequestStatus({
        text: `Sponsor pieteikums saņemts. ${backupText}`,
        tone: 'success',
      });
    } catch {
      try {
        const result = saveSponsorPackageRequest(requestForm);
        setQueuedRequestCount(result.queueCount);
        setRequestStatus({
          text: `Savienojums pārtrūka, tāpēc pieteikums saglabāts šajā pārlūkā kā backup #${result.queueCount}. To var sinhronizēt, kad backend ir pieejams.`,
          tone: 'error',
        });
      } catch (localError) {
        setRequestStatus({
          text: `Pieteikumu nevarēja saglabāt šajā pārlūkā: ${localError instanceof Error ? localError.message : String(localError)}`,
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
            display: 'grid',
            gap: '22px',
            gridTemplateColumns: 'minmax(0, 1fr)',
            marginBottom: '34px',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
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
                <h1 style={{ fontSize: 'clamp(2.25rem, 6vw, 5rem)', letterSpacing: '-0.055em', lineHeight: 0.96, margin: '6px 0 0' }}>
                  Sponsorē Web3D expo pilsētu, nevis statisku reklāmas baneri.
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link className="btn-glass" to="/expo-3d?salesDemo=1" style={{ textDecoration: 'none' }}>
                ATVĒRT SALES DEMO
              </Link>
              <Link className="btn-glass" to="/visuals-calculator" style={{ textDecoration: 'none' }}>
                APRĒĶINĀT 3D DEMO
              </Link>
            </div>
          </div>
        </header>

        <section className="glass-card" style={{ borderRadius: '28px', marginBottom: '24px', padding: '28px' }}>
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div>
              <p style={{ color: '#dbeafe', fontSize: '1.14rem', fontWeight: 850, lineHeight: 1.48, margin: '0 0 14px', maxWidth: '800px' }}>
                Trīs pārdodamas sponsor paketes: Standard Booth, Premium Booth un Landmark Zone Sponsor.
              </p>
              <p style={{ color: '#cbd5e1', fontSize: '1.02rem', lineHeight: 1.62, margin: 0, maxWidth: '820px' }}>
                Lapa ir domāta klientam: sponsors var apskatīt sales demo, saprast paketes atšķirību un nosūtīt pieteikumu,
                kas nonāk sponsor lead plūsmā. Tas nav tikai 3D dekors, bet pārdošanas ceļš no demo līdz sarunai.
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
                Pārdošanas loģika
              </div>
              <div style={{ color: '#f8fafc', fontSize: '1.45rem', fontWeight: 950, marginTop: '8px' }}>
                Demo → pakete → pieteikums → sponsor follow-up
              </div>
              <p style={{ color: '#94a3b8', lineHeight: 1.45, margin: '8px 0 0' }}>
                Standard, Premium un Landmark pieteikumi saglabā paketes interesi, kontaktus, budžeta signālu un sponsor mērķi.
              </p>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
          {FUNNEL_STEPS.map(([step, title, copy]) => (
            <div
              key={step}
              style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.68))',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                borderRadius: '20px',
                padding: '18px',
              }}
            >
              <div style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Solis {step}
              </div>
              <h2 style={{ fontSize: '1.12rem', margin: '8px 0 7px' }}>{title}</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.45, margin: 0 }}>{copy}</p>
            </div>
          ))}
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
                minHeight: '420px',
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
              <p style={{ color: '#94a3b8', lineHeight: 1.45, margin: '0 0 10px' }}>{entry.audience}</p>
              <p style={{ color: entry.accent, fontSize: '0.82rem', fontWeight: 850, lineHeight: 1.4, margin: '0 0 16px' }}>{entry.proof}</p>
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
                  Skatīt demo
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
                Sponsor paketes pieteikums
              </div>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3.2rem)', letterSpacing: '-0.05em', lineHeight: 1, margin: '10px 0 12px' }}>
                Pieteikt sponsor walkthrough.
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.58, margin: 0 }}>
                Izvēlies paketi un pieraksti sponsor mērķi. Pieteikums nonāk sponsor follow-up plūsmā ar izvēlēto paketi,
                telefonu, budžeta signālu un termiņu.
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
                Lokālais backup: {queuedRequestCount} pieteikum{queuedRequestCount === 1 ? 's' : 'i'} saglabāti šajā ierīcē.
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} style={{ display: 'grid', gap: '13px' }}>
              <div style={{ display: 'grid', gap: '13px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label style={labelStyle}>
                  Kontaktpersona
                  <input
                    autoComplete="name"
                    onChange={(event) => updateRequestField('name', event.target.value)}
                    placeholder="Vārds Uzvārds"
                    style={inputStyle}
                    type="text"
                    value={requestForm.name}
                  />
                </label>
                <label style={labelStyle}>
                  Darba e-pasts
                  <input
                    autoComplete="email"
                    onChange={(event) => updateRequestField('email', event.target.value)}
                    placeholder="vards@uznemums.lv"
                    style={inputStyle}
                    type="email"
                    value={requestForm.email}
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gap: '13px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label style={labelStyle}>
                  Uzņēmums
                  <input
                    autoComplete="organization"
                    onChange={(event) => updateRequestField('company', event.target.value)}
                    placeholder="Uzņēmuma nosaukums"
                    style={inputStyle}
                    type="text"
                    value={requestForm.company}
                  />
                </label>
                <label style={labelStyle}>
                  Tālrunis / WhatsApp
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
                  Mājaslapa
                  <input
                    autoComplete="url"
                    onChange={(event) => updateRequestField('website', event.target.value)}
                    placeholder="https://uznemums.lv"
                    style={inputStyle}
                    type="url"
                    value={requestForm.website}
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gap: '13px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label style={labelStyle}>
                  Interesējošā pakete
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
                  Budžeta signāls
                  <select
                    onChange={(event) => updateRequestField('budgetRange', event.target.value)}
                    style={inputStyle}
                    value={requestForm.budgetRange}
                  >
                    <option value="">Izvēlies diapazonu</option>
                    {BUDGET_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Termiņš
                  <select
                    onChange={(event) => updateRequestField('timeline', event.target.value)}
                    style={inputStyle}
                    value={requestForm.timeline}
                  >
                    <option value="">Izvēlies termiņu</option>
                    {TIMELINE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Sponsor mērķis
                <textarea
                  onChange={(event) => updateRequestField('message', event.target.value)}
                  placeholder="Ko vēlaties sponsorēt, palaist, izmērīt vai reklamēt?"
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
                  fontSize: '0.92rem',
                  fontWeight: 950,
                  letterSpacing: '0.04em',
                  opacity: requestStatus.tone === 'submitting' ? 0.72 : 1,
                  padding: '15px 18px',
                  textTransform: 'uppercase',
                }}
              >
                {requestStatus.tone === 'submitting' ? 'Sūtu pieteikumu...' : 'Nosūtīt sponsor pieteikumu'}
              </button>
              <div
                data-sponsor-package-request-status={requestStatus.tone}
                style={{
                  color: getStatusColor(requestStatus.tone),
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
            <h2 style={{ fontSize: '1.65rem', letterSpacing: '-0.035em', margin: 0 }}>Ko sponsors var apskatīt jau tagad</h2>
            <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Pārdošanas aktīvi
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

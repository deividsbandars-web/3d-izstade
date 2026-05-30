import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type CalculatorCategoryId = 'all' | 'construction' | 'creative' | 'services';
type CalculatorDepth = 'Quick estimate' | 'Detailed estimate' | 'Specialist quote';

type CalculatorEntry = {
  accent: string;
  category: Exclude<CalculatorCategoryId, 'all'>;
  depth: CalculatorDepth;
  desc: string;
  featured?: boolean;
  id: string;
  path: string;
  primaryUse: string;
  status: string;
  title: string;
};

const categories: Array<{ id: CalculatorCategoryId; label: string; summary: string }> = [
  { id: 'all', label: 'Visi', summary: 'Pilns kalkulatoru katalogs' },
  { id: 'construction', label: 'Būvniecība', summary: 'Tāmes mājai, remontam un inženiertīkliem' },
  { id: 'creative', label: '3D / Dizains', summary: 'Vizualizācijas, dizains un digitālie darbi' },
  { id: 'services', label: 'Pakalpojumi', summary: 'Ātrie pakalpojumi un servisa izmaksas' },
];

const calculators: CalculatorEntry[] = [
  {
    accent: '#38bdf8',
    category: 'construction',
    depth: 'Detailed estimate',
    desc: 'Materiāli, darbs, jumta ģeometrija, noteksistēma un koka konstrukcijas vienā aprēķinā.',
    featured: true,
    id: 'roof',
    path: '/roof-cost-calculator',
    primaryUse: 'Jumta segums, pārbūve vai jauns jumts',
    status: 'Vispilnīgākais kalkulators',
    title: 'Jumta tāme',
  },
  {
    accent: '#f97316',
    category: 'construction',
    depth: 'Detailed estimate',
    desc: 'Siltumsūkņi, radiatori, siltās grīdas, automatizācija un papildaprīkojums.',
    featured: true,
    id: 'heating',
    path: '/heating-cost-calculator',
    primaryUse: 'Apkures sistēmas izvēle un budžets',
    status: 'Labs lead kvalifikācijai',
    title: 'Apkures sistēmas',
  },
  {
    accent: '#22c55e',
    category: 'construction',
    depth: 'Detailed estimate',
    desc: 'Betons, armatūra, zemes darbi un pamatu konstrukcijas sākotnējai izmaksu kontrolei.',
    featured: true,
    id: 'foundation',
    path: '/foundation-cost-calculator',
    primaryUse: 'Mājas pamati un betona darbi',
    status: 'Būvniecības sākuma posms',
    title: 'Pamatu izbūve',
  },
  {
    accent: '#a78bfa',
    category: 'construction',
    depth: 'Detailed estimate',
    desc: 'Telpas remonts ar demontāžu, grīdu, sienām, griestiem, durvīm un elektrības punktiem.',
    featured: true,
    id: 'interior',
    path: '/renovation-cost-calculator',
    primaryUse: 'Dzīvokļa vai telpas remonta tāme',
    status: 'Augsta pieprasījuma kalkulators',
    title: 'Iekšdarbi un remonts',
  },
  {
    accent: '#84cc16',
    category: 'construction',
    depth: 'Quick estimate',
    desc: 'Ātrs karkasa, siltināšanas un pilnas apdares izmaksu salīdzinājums.',
    id: 'timber',
    path: '/timber-house-calculator',
    primaryUse: 'Koka karkasa mājas vai nojumes',
    status: 'Ātrā budžeta pārbaude',
    title: 'Koka karkass',
  },
  {
    accent: '#0ea5e9',
    category: 'construction',
    depth: 'Quick estimate',
    desc: 'Logu skaits, konstrukcijas tips, montāža un demontāžas izmaksas.',
    id: 'windows',
    path: '/windows-calculator',
    primaryUse: 'Logu nomaiņa vai jaunas ailes',
    status: 'Īss cenu signāls',
    title: 'Logi un durvis',
  },
  {
    accent: '#06b6d4',
    category: 'construction',
    depth: 'Specialist quote',
    desc: 'Cauruļvadi, sanitārie punkti, virtuves pieslēgumi un materiālu izvēle.',
    id: 'plumbing',
    path: '/plumbing-calculator',
    primaryUse: 'Santehnikas mezgli un pieslēgumi',
    status: 'Servisa pieprasījumiem',
    title: 'Santehnika',
  },
  {
    accent: '#6366f1',
    category: 'creative',
    depth: 'Specialist quote',
    desc: 'Arhitektūras, interjera, produkta un video pastaigas vizualizāciju budžets.',
    id: 'visuals',
    path: '/visuals-calculator',
    primaryUse: '3D vizualizācijas un walkthrough',
    status: 'Saderīgs ar Web3D virzienu',
    title: '3D vizuāļi',
  },
  {
    accent: '#ec4899',
    category: 'creative',
    depth: 'Quick estimate',
    desc: 'Logo, UI/UX, ilustrācijas un reklāmas baneru sākotnējā cena.',
    id: 'digital-art',
    path: '/digital-art-calculator',
    primaryUse: 'Dizaina un digitālo assetu pasūtījumi',
    status: 'Ātrs piedāvājuma sākums',
    title: 'Digitālais dizains',
  },
  {
    accent: '#f59e0b',
    category: 'construction',
    depth: 'Specialist quote',
    desc: 'Bruģis, pamatnes sagatavošana, apmales, drenāža, raksts un objekta piekļuve vienā tāmē.',
    id: 'paving',
    path: '/paving-calculator',
    primaryUse: 'Pagalma, iebrauktuves vai komercteritorijas bruģēšana',
    status: 'Praktisks pagalma darbu leads',
    title: 'Bruģis un pagalms',
  },
  {
    accent: '#14b8a6',
    category: 'services',
    depth: 'Quick estimate',
    desc: 'Telpu un teritoriju profesionālās uzkopšanas sākotnējais budžets.',
    id: 'cleaning',
    path: '/cleaning-calculator',
    primaryUse: 'Uzkopšanas pakalpojumu pieprasījumi',
    status: 'Vienkāršs lead kalkulators',
    title: 'Uzkopšana',
  },
  {
    accent: '#ef4444',
    category: 'services',
    depth: 'Quick estimate',
    desc: 'Elektriķis, santehniķis, atslēgu serviss un mazie remontdarbi.',
    id: 'quick-fix',
    path: '/quick-fix-calculator',
    primaryUse: 'Steidzami vai mazi darbi',
    status: 'Ātrā pieprasījuma plūsma',
    title: 'Saimnieka palīgs',
  },
];

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase('lv-LV');
}

export default function CalculatorsHub() {
  const [activeCategory, setActiveCategory] = useState<CalculatorCategoryId>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = normalizeSearch(search);

    return calculators.filter((calculator) => {
      const matchesCategory = activeCategory === 'all' || calculator.category === activeCategory;
      const searchable = [
        calculator.title,
        calculator.desc,
        calculator.primaryUse,
        calculator.status,
        calculator.depth,
      ].join(' ').toLocaleLowerCase('lv-LV');

      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [activeCategory, search]);

  const featuredCalculators = calculators.filter((calculator) => calculator.featured);
  const activeCategorySummary = categories.find((category) => category.id === activeCategory)?.summary ?? 'Pilns kalkulatoru katalogs';

  return (
    <main style={{ color: '#f8fafc', margin: '0 auto', maxWidth: '1380px', padding: '42px 20px 80px' }}>
      <section
        style={{
          background:
            'radial-gradient(circle at 12% 10%, rgba(56, 189, 248, 0.24), transparent 30%), linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94))',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '32px',
          boxShadow: '0 28px 80px rgba(2, 6, 23, 0.34)',
          marginBottom: '26px',
          overflow: 'hidden',
          padding: '34px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'grid', gap: '26px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div>
            <div style={{ color: '#7dd3fc', fontSize: '0.74rem', fontWeight: 950, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Pro calculator suite
            </div>
            <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 5.1rem)', letterSpacing: '-0.06em', lineHeight: 0.95, margin: '12px 0 16px' }}>
              Tāmes, kas pārvērš interesi par konkrētu pieprasījumu.
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.06rem', lineHeight: 1.62, margin: 0, maxWidth: '760px' }}>
              Sakārtots kalkulatoru katalogs būvniecībai, servisam un 3D/dizaina darbiem. Lietotājs ātri izvēlas vajadzīgo tāmi,
              saprot aprēķina dziļumu un var turpināt uz piedāvājuma vai Expo sponsor/lead plūsmu.
            </p>
          </div>

          <aside
            style={{
              alignSelf: 'stretch',
              background: 'rgba(2, 6, 23, 0.55)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: '24px',
              display: 'grid',
              gap: '12px',
              padding: '20px',
            }}
          >
            {[
              ['Kalkulatori', calculators.length],
              ['Detalizētas tāmes', calculators.filter((entry) => entry.depth === 'Detailed estimate').length],
              ['Ātrie aprēķini', calculators.filter((entry) => entry.depth === 'Quick estimate').length],
            ].map(([label, value]) => (
              <div key={String(label)} style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                <strong style={{ color: '#f8fafc', fontSize: '1.55rem' }}>{value}</strong>
              </div>
            ))}
            <Link
              to="/expo/sponsor-packages"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
                borderRadius: '16px',
                color: '#02131a',
                fontSize: '0.84rem',
                fontWeight: 950,
                letterSpacing: '0.05em',
                marginTop: '8px',
                padding: '13px 14px',
                textAlign: 'center',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Savienot ar sponsor/lead plūsmu
            </Link>
            <Link
              to="/calculators/leads"
              style={{
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(125, 211, 252, 0.22)',
                borderRadius: '16px',
                color: '#bae6fd',
                fontSize: '0.78rem',
                fontWeight: 950,
                letterSpacing: '0.05em',
                padding: '12px 14px',
                textAlign: 'center',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Atvērt kalkulatoru lead rindu
            </Link>
          </aside>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', marginBottom: '28px' }}>
        {featuredCalculators.map((calculator) => (
          <Link
            key={calculator.id}
            to={calculator.path}
            style={{
              background: `linear-gradient(145deg, ${calculator.accent}26, rgba(15, 23, 42, 0.92))`,
              border: `1px solid ${calculator.accent}55`,
              borderRadius: '22px',
              color: '#f8fafc',
              minHeight: '150px',
              padding: '20px',
              textDecoration: 'none',
            }}
          >
            <div style={{ color: calculator.accent, fontSize: '0.68rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Ieteicamais sākums
            </div>
            <h2 style={{ fontSize: '1.3rem', letterSpacing: '-0.03em', margin: '10px 0 8px' }}>{calculator.title}</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.45, margin: 0 }}>{calculator.primaryUse}</p>
          </Link>
        ))}
      </section>

      <section
        style={{
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.72)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          borderRadius: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          marginBottom: '26px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              type="button"
              style={{
                background: activeCategory === category.id ? '#38bdf8' : 'rgba(2, 6, 23, 0.62)',
                border: `1px solid ${activeCategory === category.id ? '#7dd3fc' : 'rgba(148, 163, 184, 0.18)'}`,
                borderRadius: '999px',
                color: activeCategory === category.id ? '#03131a' : '#cbd5e1',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 950,
                padding: '10px 14px',
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        <label style={{ color: '#94a3b8', display: 'grid', flex: '1 1 280px', fontSize: '0.72rem', fontWeight: 850, gap: '6px', maxWidth: '430px', textTransform: 'uppercase' }}>
          Meklēt kalkulatoru
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="piem. jumts, apkure, dizains..."
            style={{
              background: 'rgba(2, 6, 23, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.24)',
              borderRadius: '14px',
              color: '#f8fafc',
              font: 'inherit',
              padding: '13px 14px',
              textTransform: 'none',
              width: '100%',
            }}
            type="search"
            value={search}
          />
        </label>
      </section>

      <div style={{ alignItems: 'baseline', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', letterSpacing: '-0.035em', margin: 0 }}>{filtered.length} kalkulatori</h2>
          <p style={{ color: '#94a3b8', margin: '6px 0 0' }}>{activeCategorySummary}</p>
        </div>
        <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 850 }}>
          Aprēķini ir sākotnējai tāmei; gala piedāvājumam vajag pārbaudi.
        </span>
      </div>

      <section style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
        {filtered.map((calculator) => (
          <Link key={calculator.id} to={calculator.path} style={{ color: 'inherit', textDecoration: 'none' }}>
            <article
              className="glass-card"
              style={{
                borderColor: `${calculator.accent}3f`,
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minHeight: '330px',
                padding: '24px',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span
                  style={{
                    background: `${calculator.accent}20`,
                    border: `1px solid ${calculator.accent}55`,
                    borderRadius: '999px',
                    color: calculator.accent,
                    fontSize: '0.68rem',
                    fontWeight: 950,
                    letterSpacing: '0.08em',
                    padding: '7px 10px',
                    textTransform: 'uppercase',
                  }}
                >
                  {calculator.depth}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.74rem', fontWeight: 850, textTransform: 'uppercase' }}>{calculator.category}</span>
              </div>

              <div>
                <h3 style={{ color: '#f8fafc', fontSize: '1.45rem', letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 10px' }}>
                  {calculator.title}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.55, margin: 0 }}>{calculator.desc}</p>
              </div>

              <div style={{ background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: '16px', padding: '13px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 950, letterSpacing: '0.08em', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Pielietojums
                </div>
                <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 800 }}>{calculator.primaryUse}</div>
              </div>

              <div style={{ alignItems: 'center', display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.35 }}>{calculator.status}</span>
                <span style={{ color: calculator.accent, fontSize: '0.82rem', fontWeight: 950, whiteSpace: 'nowrap' }}>Atvērt →</span>
              </div>
            </article>
          </Link>
        ))}
      </section>

      {filtered.length === 0 && (
        <section style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: '24px', color: '#94a3b8', marginTop: '18px', padding: '54px', textAlign: 'center' }}>
          <h2 style={{ color: '#f8fafc', marginTop: 0 }}>Nekas netika atrasts</h2>
          <p>Pamēģini citu atslēgvārdu vai izvēlies kategoriju “Visi”.</p>
        </section>
      )}
    </main>
  );
}

import { useState } from 'react';
import '../../components/calculator/styles/CalculatorPro.css';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import { generateAiResponse } from '../../services/aiService';
import { CalculatorLeadCta } from './CalculatorLeadCta';

const PRICES = {
  demolition: {
    none: { name: 'Bez demontāžas', mat: 0, work: 0 },
    light: { name: 'Viegla demontāža', mat: 0, work: 6 },
    heavy: { name: 'Smaga demontāža', mat: 0, work: 25 },
  },
  container: {
    none: { name: 'Nevajag', price: 0 },
    small: { name: '5m³ konteiners', price: 350 },
    medium: { name: '7m³ konteiners', price: 450 },
    large: { name: '10m³ konteiners', price: 600 },
  },
  floor_prep: {
    none: { name: 'Bez sagatavošanas', mat: 0, work: 0 },
    osb: { name: 'OSB plātņu ieklāšana', mat: 9.5, work: 8 },
    betons: { name: 'Pašizlīdzinošais betons', mat: 8, work: 10 },
  },
  floor_cover: {
    none: { name: 'Bez seguma', mat: 0, work: 0 },
    laminats: { name: 'Lamināts ar apakšklāju', mat: 15, work: 9 },
    vinils: { name: 'Līmējamais vinils (LVT)', mat: 25, work: 12 },
    parkets: { name: 'Koka parkets', mat: 55, work: 20 },
    flizes: { name: 'Akmens masas flīzes', mat: 30, work: 35 },
  },
  floor_skirting: {
    none: { name: 'Bez kājlīstēm', mat: 0, work: 0 },
    mdf: { name: 'MDF krāsotas kājlīstes', mat: 5.5, work: 5 },
    plastmasas: { name: 'PVC kājlīstes', mat: 2.5, work: 3 },
  },
  wall_prep: {
    none: { name: 'Bez sagatavošanas', mat: 0, work: 0 },
    regipsis_profils: { name: 'Reģipša montāža uz profiliem', mat: 8.5, work: 15 },
    apmesana: { name: 'Sienu apmešana', mat: 5, work: 16 },
  },
  wall_finish: {
    none: { name: 'Bez apdares', mat: 0, work: 0 },
    krasa_standard: { name: 'Špaktelēšana un standarta krāsošana', mat: 5.5, work: 18 },
    krasa_premium: { name: 'Špaktelēšana un premium krāsošana', mat: 10, work: 25 },
    tapetes: { name: 'Tapešu līmēšana', mat: 18, work: 12 },
    dekors: { name: 'Dekoratīvais apmetums', mat: 22, work: 35 },
  },
  ceiling_type: {
    none: { name: 'Bez griestiem', mat: 0, work: 0 },
    regipsis: { name: 'Reģipša griesti', mat: 12, work: 35 },
    iestieptie: { name: 'Iestieptie PVC griesti', mat: 25, work: 15 },
    armstrong: { name: 'Iekārtie Armstrong griesti', mat: 15, work: 12 },
  },
  electrical_points: { name: 'Elektrības punkti', mat: 15, work: 20 },
  doors: { name: 'Iekšdurvju bloka montāža', mat: 180, work: 85 },
} as const;

const ROOM_TYPES = {
  bathroom: 'Vannas istaba',
  bedroom: 'Guļamistaba',
  corridor: 'Koridors',
  kitchen: 'Virtuve',
  living_room: 'Viesistaba',
  toilet: 'Tualete',
} as const;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

export default function InteriorCalc() {
  const [params, setParams] = useState({
    area: 20,
    ceilingType: 'regipsis',
    containerSize: 'none',
    country: 'lv',
    demolitionType: 'none',
    doorCount: 1,
    elecPoints: 4,
    floorCover: 'laminats',
    floorPrep: 'betons',
    floorSkirting: 'mdf',
    height: 2.7,
    imageUrl: '',
    roomType: 'living_room',
    videoUrl: '',
    wallFinish: 'krasa_standard',
    wallPrep: 'none',
    windowArea: 2.5,
  });

  const [results, setResults] = useState<any>(null);
  const [aiAdvice, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setParams((current) => ({ ...current, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const getAiAdvice = async () => {
    if (!results) return;
    setIsAiLoading(true);
    try {
      const prompt = `Analizē šo iekšējās apdares tāmi:
Telpa: ${results.roomType}
Platība: ${params.area} m2
Kopējā summa: ${results.grandTotal} EUR
Materiāli: ${results.totalMat} EUR, Darbs: ${results.totalWork} EUR

Sniedz 3 profesionālus padomus:
1. Kā optimizēt izmaksas šai telpai.
2. Materiālu saderības ieteikums.
3. Kas jāņem vērā pirms darbu uzsākšanas.
Atbildi latviski, profesionāli.`;

      const responseText = await generateAiResponse(prompt);
      setAiAnalysis(responseText);
    } catch {
      setAiAnalysis('AI mezgls pašlaik nav sasniedzams. Tāmi var nosūtīt pārbaudei caur pieprasījuma formu.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country as keyof typeof COUNTRIES] ?? COUNTRIES.lv;
    const workMult = country.workMult;
    const matMult = country.matMult;
    const perimeter = Math.sqrt(params.area) * 4;
    const netWallArea = Math.max(0, (perimeter * params.height) - params.windowArea - (params.doorCount * 1.6));

    const demoRate = PRICES.demolition[params.demolitionType as keyof typeof PRICES.demolition];
    const containerRate = PRICES.container[params.containerSize as keyof typeof PRICES.container];
    const demolitionCost = { mat: containerRate.price * matMult, work: (params.area * demoRate.work) * workMult };

    const floorPrepRate = PRICES.floor_prep[params.floorPrep as keyof typeof PRICES.floor_prep];
    const floorCoverRate = PRICES.floor_cover[params.floorCover as keyof typeof PRICES.floor_cover];
    const skirtingRate = PRICES.floor_skirting[params.floorSkirting as keyof typeof PRICES.floor_skirting];
    const floorCost = {
      mat: ((params.area * floorPrepRate.mat) + (params.area * floorCoverRate.mat) + (perimeter * skirtingRate.mat)) * matMult,
      work: ((params.area * floorPrepRate.work) + (params.area * floorCoverRate.mat) + (perimeter * skirtingRate.work)) * workMult,
    };

    const wallPrepRate = PRICES.wall_prep[params.wallPrep as keyof typeof PRICES.wall_prep];
    const wallFinishRate = PRICES.wall_finish[params.wallFinish as keyof typeof PRICES.wall_finish];
    const wallCost = {
      mat: ((netWallArea * wallPrepRate.mat) + (netWallArea * wallFinishRate.mat)) * matMult,
      work: ((netWallArea * wallPrepRate.work) + (netWallArea * wallFinishRate.work)) * workMult,
    };

    const ceilingRate = PRICES.ceiling_type[params.ceilingType as keyof typeof PRICES.ceiling_type];
    const ceilingCost = { mat: (params.area * ceilingRate.mat) * matMult, work: (params.area * ceilingRate.work) * workMult };

    const extrasCost = {
      mat: (params.elecPoints * PRICES.electrical_points.mat + params.doorCount * PRICES.doors.mat) * matMult,
      work: (params.elecPoints * PRICES.electrical_points.work + params.doorCount * PRICES.doors.work) * workMult,
    };

    const totalMat = demolitionCost.mat + floorCost.mat + wallCost.mat + ceilingCost.mat + extrasCost.mat;
    const totalWork = demolitionCost.work + floorCost.work + wallCost.work + ceilingCost.work + extrasCost.work;
    const grandTotal = totalMat + totalWork;

    setResults({
      ceilingCost,
      demolitionCost,
      extrasCost,
      floorCost,
      grandTotal,
      imageUrl: params.imageUrl,
      netWallArea,
      perimeter,
      roomType: ROOM_TYPES[params.roomType as keyof typeof ROOM_TYPES],
      totalMat,
      totalWork,
      videoUrl: params.videoUrl,
      wallCost,
    });
    setAiAnalysis(null);
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO iekšējās apdares tāme</h1>
        <p>Remonta kalkulators telpas apdarei, grīdām, sienām, griestiem, elektrībai un durvīm.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Lokācija un telpas parametri</h2>
            <div className="input-group">
              <label>Reģions
                <select name="country" value={params.country} onChange={handleChange}>{renderCountryOptions()}</select>
              </label>
              <div className="input-group-2" style={{ marginTop: '20px' }}>
                <label>Telpas veids
                  <select name="roomType" value={params.roomType} onChange={handleChange}>
                    {Object.entries(ROOM_TYPES).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
                  </select>
                </label>
                <label>Platība (m²)
                  <input type="number" name="area" value={params.area} onChange={handleChange} />
                </label>
              </div>
            </div>
          </section>

          <section className="calc-section">
            <h2>Telpas ģeometrija</h2>
            <div className="input-group-2">
              <label>Griestu augstums (m)
                <input type="number" name="height" value={params.height} onChange={handleChange} step="0.1" />
              </label>
              <label>Logu laukums (m²)
                <input type="number" name="windowArea" value={params.windowArea} onChange={handleChange} step="0.1" />
              </label>
              <label>Iekšdurvju skaits
                <input type="number" name="doorCount" value={params.doorCount} onChange={handleChange} />
              </label>
              <label>Elektrības punkti
                <input type="number" name="elecPoints" value={params.elecPoints} onChange={handleChange} />
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Demontāža un atkritumi</h2>
            <div className="input-group">
              <label>Demontāžas apjoms
                <select name="demolitionType" value={params.demolitionType} onChange={handleChange}>
                  {Object.entries(PRICES.demolition).map(([key, value]) => (<option key={key} value={key}>{value.name}</option>))}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Būvgružu konteiners
                <select name="containerSize" value={params.containerSize} onChange={handleChange}>
                  {Object.entries(PRICES.container).map(([key, value]) => (<option key={key} value={key}>{value.name}</option>))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Grīdu un sienu apdare</h2>
            <div className="input-group">
              <label>Grīdas sagatavošana
                <select name="floorPrep" value={params.floorPrep} onChange={handleChange}>
                  {Object.entries(PRICES.floor_prep).map(([key, value]) => (<option key={key} value={key}>{value.name}</option>))}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Grīdas segums
                <select name="floorCover" value={params.floorCover} onChange={handleChange}>
                  {Object.entries(PRICES.floor_cover).map(([key, value]) => (<option key={key} value={key}>{value.name}</option>))}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Sienu apdare
                <select name="wallFinish" value={params.wallFinish} onChange={handleChange}>
                  {Object.entries(PRICES.wall_finish).map(([key, value]) => (<option key={key} value={key}>{value.name}</option>))}
                </select>
              </label>
            </div>
          </section>

          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '24px', fontSize: '1.2rem' }}>
            Sastādīt remonta tāmi
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Remonta specifikācija</h3>

            {!results ? (
              <div className="empty-state">
                <div className="empty-state-icon">▣</div>
                <p>Norādi telpas izmērus un vēlamo apdares līmeni.</p>
              </div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">{results.roomType} ({params.area} m²)</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                  <span className="gt-subtext">Aprēķinā iekļauti materiāli un darbs. Gala cena jāprecizē pēc objekta apskates.</span>
                </div>

                <div style={{ gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px', display: 'grid' }}>
                  <button onClick={getAiAdvice} disabled={isAiLoading} className="btn-glass" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
                    {isAiLoading ? 'Analizē...' : 'AI padoms'}
                  </button>
                  <button className="btn-glass">Eksportēt PDF</button>
                </div>

                {aiAdvice && (
                  <div className="glass-card" style={{ marginTop: '25px', padding: '25px', background: 'rgba(15, 23, 42, 0.9)', borderColor: 'var(--accent-blue)' }}>
                    <div style={{ color: 'var(--accent-blue)', fontWeight: 900, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      AI projektu vadītājs
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{aiAdvice}</div>
                  </div>
                )}

                <table className="results-table" style={{ marginTop: '25px' }}>
                  <thead>
                    <tr>
                      <th>Pozīcija</th>
                      <th>Materiāli</th>
                      <th>Darbs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Demontāža / gružu izvešana</td><td>{formatEuro(results.demolitionCost.mat)}</td><td>{formatEuro(results.demolitionCost.work)}</td></tr>
                    <tr><td>Grīdas darbi</td><td>{formatEuro(results.floorCost.mat)}</td><td>{formatEuro(results.floorCost.work)}</td></tr>
                    <tr><td>Sienu apdare</td><td>{formatEuro(results.wallCost.mat)}</td><td>{formatEuro(results.wallCost.work)}</td></tr>
                    <tr><td>Griestu darbi</td><td>{formatEuro(results.ceilingCost.mat)}</td><td>{formatEuro(results.ceilingCost.work)}</td></tr>
                    <tr><td>Elektrība / durvis</td><td>{formatEuro(results.extrasCost.mat)}</td><td>{formatEuro(results.extrasCost.work)}</td></tr>
                  </tbody>
                </table>

                <CalculatorLeadCta
                  calculatorId="interior"
                  calculatorTitle="Iekšējās apdares tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Telpa', value: results.roomType },
                    { label: 'Platība', value: `${params.area} m²` },
                    { label: 'Grīda', value: PRICES.floor_cover[params.floorCover as keyof typeof PRICES.floor_cover].name },
                    { label: 'Sienas', value: PRICES.wall_finish[params.wallFinish as keyof typeof PRICES.wall_finish].name },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import '../components/calculator/styles/CalculatorPro.css';

export default function Privacy() {
  return (
    <div className="calculator-pro-wrapper" style={{ paddingBottom: '100px', lineHeight: '1.8' }}>
      <div className="calc-header">
        <h1>Privātuma Politika (GDPR)</h1>
        <p>Pēdējoreiz atjaunots: 31.05.2026.</p>
      </div>

      <div style={{ background: '#fff', padding: '50px', borderRadius: '24px', border: '1px solid #e2e8f0', color: '#334155' }}>
        <section>
          <h2>1. Datu vākšana</h2>
          <p>Mēs vācam datus, ko Jūs sniedzat reģistrācijas laikā un kalkulatoru piedāvājumu formās: vārdu, e-pastu, telefonu, piezīmes par objektu un aprēķina kopsavilkumu. Šie dati ir nepieciešami, lai sagatavotu piedāvājumu un sazinātos par nākamo soli.</p>
        </section>

        <section style={{ marginTop: '30px' }}>
          <h2>2. Datu izmantošana</h2>
          <p>Jūsu kontaktinformācija tiek izmantota konkrētā pieprasījuma apstrādei, piedāvājuma precizēšanai un saziņai par izvēlēto pakalpojumu. Mēs nepārdodam Jūsu datus trešajām pusēm.</p>
        </section>

        <section style={{ marginTop: '30px' }}>
          <h2>3. Sīkdatnes (Cookies)</h2>
          <p>Mēs izmantojam obligātās sīkdatnes, lai saglabātu Jūsu 3D halles pozīciju un autorizācijas sesiju. Izmantojot lapu, Jūs piekrītat to izmantošanai.</p>
        </section>

        <section style={{ marginTop: '30px' }}>
          <h2>4. Jūsu tiesības</h2>
          <p>Saskaņā ar VDAR (GDPR), Jums ir tiesības pieprasīt piekļuvi saviem datiem, to labošanu vai dzēšanu. To var izdarīt, rakstot uz mūsu atbalsta e-pastu.</p>
        </section>
      </div>
    </div>
  );
}

import { forwardRef, useState } from 'react';
import type { EstimateLine, Section } from '../../models/types';

interface PdfDocumentProps {
  lines: EstimateLine[];
  sections: Section[];
  totals: {
    labor: number;
    material: number;
    subtotal: number;
    vat: number;
    grandTotal: number;
  };
  clientName?: string;
  projectName?: string;
}

const PdfDocument = forwardRef<HTMLDivElement, PdfDocumentProps>(({ lines, sections, totals, clientName, projectName }, ref) => {
  const [docNumber] = useState(() => Math.floor(Math.random() * 10000));
  const [docDate] = useState(() => new Date().toLocaleDateString('lv-LV'));

  const linesBySection: Record<string, EstimateLine[]> = {};
  lines.forEach((line) => {
    if (!linesBySection[line.section_id]) {
      linesBySection[line.section_id] = [];
    }
    linesBySection[line.section_id].push(line);
  });

  return (
    <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
      <div
        ref={ref}
        style={{
          width: '794px',
          minHeight: '1123px',
          padding: '40px',
          backgroundColor: '#fff',
          color: '#000',
          fontFamily: 'sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eab308', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>PIEDĀVĀJUMS / TĀME</h1>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>Datums: {docDate}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#eab308' }}>Warpala</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Profesionāli risinājumi</p>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px' }}>
          <div>
            <strong>Klients:</strong> {clientName || 'Nav norādīts'}<br />
            <strong>Objekts:</strong> {projectName || 'Standarta aprēķins'}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Tāmes Nr.:</strong> EST-{docNumber}
          </div>
        </div>

        {sections.map((section) => {
          const sectionLines = linesBySection[section.id];
          if (!sectionLines || sectionLines.length === 0) {
            return null;
          }

          return (
            <div key={section.id} style={{ marginBottom: '30px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', backgroundColor: '#f3f4f6', padding: '8px' }}>
                {section.name}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d1d5db', color: '#6b7280', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px' }}>Apraksts</th>
                    <th style={{ padding: '8px 4px', width: '60px' }}>Vien.</th>
                    <th style={{ padding: '8px 4px', width: '60px', textAlign: 'right' }}>Daudz.</th>
                    <th style={{ padding: '8px 4px', width: '80px', textAlign: 'right' }}>Darbs (EUR)</th>
                    <th style={{ padding: '8px 4px', width: '80px', textAlign: 'right' }}>Mat. (EUR)</th>
                    <th style={{ padding: '8px 4px', width: '90px', textAlign: 'right' }}>Kopā (EUR)</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionLines.map((line) => {
                    const rowTotal = (line.unit_price_labor + line.unit_price_material) * line.qty;
                    return (
                      <tr key={line.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 4px' }}>{line.description}</td>
                        <td style={{ padding: '8px 4px' }}>{line.unit}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>{line.qty.toFixed(2)}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>{line.unit_price_labor.toFixed(2)}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>{line.unit_price_material.toFixed(2)}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{rowTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        <div style={{ width: '300px', marginLeft: 'auto', borderTop: '2px solid #111827', paddingTop: '15px', marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Darbi kopā:</span>
            <span>{totals.labor.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Materiāli kopā:</span>
            <span>{totals.material.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Starpsumma:</span>
            <span>{totals.subtotal.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
            <span>PVN (21%):</span>
            <span>{totals.vat.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #d1d5db', fontSize: '18px', fontWeight: 'bold' }}>
            <span>KOPĀ APMAKSAI:</span>
            <span style={{ color: '#eab308' }}>{totals.grandTotal.toFixed(2)} EUR</span>
          </div>
        </div>

        <div style={{ marginTop: '50px', fontSize: '10px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
          <p>Šis ir orientējošs piedāvājums. Cenas var tikt precizētas pēc objekta apsekošanas dabā. Piedāvājums derīgs 14 dienas.</p>
          <p>Ģenerēts no Warpala sistēmas.</p>
        </div>
      </div>
    </div>
  );
});

PdfDocument.displayName = 'PdfDocument';
export default PdfDocument;

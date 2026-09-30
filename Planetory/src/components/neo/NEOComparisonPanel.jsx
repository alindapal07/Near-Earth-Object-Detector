import React from 'react';

const NEOComparisonPanel = ({ neoA, neoB }) => {
  if (!neoA || !neoB) return null;

  const getHighlight = (valA, valB, invert = false) => {
    if (valA === undefined || valB === undefined || isNaN(valA) || isNaN(valB)) return { a: false, b: false };
    if (valA === valB) return { a: false, b: false };
    const aBetter = invert ? valA < valB : valA > valB;
    return { a: aBetter, b: !aBetter };
  };

  const rows = [
    { label: 'Name', key: 'name', type: 'string' },
    { label: 'Designation', key: 'designation', type: 'string' },
    { label: 'NEO / PHA', key: 'flags', type: 'custom', render: (n) => `${n.isNeo ? 'YES' : 'NO'} / ${n.isPha ? 'YES' : 'NO'}` },
    { label: 'Diameter (est. max km)', key: 'estimatedDiameterMaxKm', type: 'number' },
    { label: 'H magnitude', key: 'absoluteMagnitudeH', type: 'number', invert: true }, // lower is brighter/larger
    { label: 'Orbit class', key: 'orbitClass', type: 'string' },
    { label: 'Eccentricity', key: 'eccentricity', type: 'number' },
    { label: 'Inclination (deg)', key: 'inclination', type: 'number' },
    { label: 'Semi-major axis (au)', key: 'semiMajorAxis', type: 'number' },
    { label: 'MOID (au)', key: 'moidAu', type: 'number', invert: true }, // closer is more notable
    { label: 'Orbital period (days)', key: 'orbitalPeriodDays', type: 'number' },
    { label: 'Next approach', key: 'nextApproachDate', type: 'string' },
    { label: 'Min distance (LD)', key: 'minDistLD', type: 'number', invert: true }, // closer is more notable
    { label: 'Max velocity (km/s)', key: 'maxVelocityKmS', type: 'number' },
    { label: 'Sentry monitored', key: 'sentryMonitored', type: 'custom', render: (n) => n.sentryMonitored ? 'YES' : 'NO' },
    { label: 'Impact probability', key: 'impactProbability', type: 'number' },
    { label: 'Torino scale', key: 'torinoScale', type: 'number' },
    { label: 'Palermo scale', key: 'palermoScale', type: 'number' }
  ];

  return (
    <div style={{ padding: '20px', background: 'rgba(2, 4, 10, 0.95)', color: '#e0e8ff', fontFamily: 'sans-serif' }} className="neo-comparison">
      <h3 style={{ fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>Object Comparison</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#8892a4', width: '30%' }}>Metric</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', color: '#00f0ff', width: '35%' }}>{neoA.name}</th>
            <th style={{ padding: '12px 8px', textAlign: 'center', color: '#ffb703', width: '35%' }}>{neoB.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            let valA, valB;
            if (row.type === 'custom') {
              valA = row.render(neoA);
              valB = row.render(neoB);
            } else {
              valA = neoA[row.key];
              valB = neoB[row.key];
            }

            const isNum = row.type === 'number';
            const highlights = isNum ? getHighlight(valA, valB, row.invert) : { a: false, b: false };

            const displayA = valA === undefined || valA === null ? 'N/A' : (isNum ? parseFloat(valA).toFixed(4) : valA);
            const displayB = valB === undefined || valB === null ? 'N/A' : (isNum ? parseFloat(valB).toFixed(4) : valB);

            return (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 8px', color: '#8892a4', fontWeight: 'bold' }}>{row.label}</td>
                <td style={{ 
                  padding: '12px 8px', textAlign: 'center',
                  background: highlights.a ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: highlights.a ? '#00f0ff' : '#e0e8ff',
                  borderRadius: '4px'
                }}>
                  {displayA}
                </td>
                <td style={{ 
                  padding: '12px 8px', textAlign: 'center',
                  background: highlights.b ? 'rgba(255, 183, 3, 0.1)' : 'transparent',
                  color: highlights.b ? '#ffb703' : '#e0e8ff',
                  borderRadius: '4px'
                }}>
                  {displayB}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '12px', textAlign: 'center' }}>
        Highlights indicate more notable values (e.g., larger, closer, faster). This does not inherently imply greater risk without Sentry verification.
      </div>
    </div>
  );
};

export default NEOComparisonPanel;

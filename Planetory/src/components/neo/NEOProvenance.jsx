import React from 'react';

const NEOProvenance = ({ neo, riskData }) => {
  const timestamp = new Date().toISOString();

  const provenanceData = [
    { section: 'Identification', source: 'JPL SBDB', retrieved: timestamp, status: 'LIVE' },
    { section: 'Physical Properties', source: 'JPL SBDB', retrieved: timestamp, status: 'LIVE' },
    { section: 'Orbital Elements', source: 'JPL SBDB', retrieved: timestamp, status: 'LIVE' },
    { section: 'Close Approaches', source: 'JPL CNEOS CAD', retrieved: timestamp, status: 'LIVE' },
    { section: 'Impact Risk', source: 'NASA/JPL CNEOS SENTRY', retrieved: riskData?.retrievedAt || timestamp, status: riskData?.sentryMonitored ? 'LIVE' : 'NOT IN SENTRY' },
    { section: 'Diameter (estimated)', source: 'Planetory', retrieved: 'Computed', status: 'N/A' },
  ];

  return (
    <div style={{ padding: '20px', background: 'rgba(2, 4, 10, 0.95)', color: '#e0e8ff', fontFamily: 'sans-serif' }} className="neo-provenance">
      <h3 style={{ fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>Data Provenance</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '24px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left', color: '#8892a4' }}>
            <th style={{ padding: '8px' }}>Section</th>
            <th style={{ padding: '8px' }}>Source</th>
            <th style={{ padding: '8px' }}>Retrieved</th>
            <th style={{ padding: '8px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {provenanceData.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '8px', color: '#e0e8ff' }}>{row.section}</td>
              <td style={{ padding: '8px', color: '#00f0ff' }}>{row.source}</td>
              <td style={{ padding: '8px', color: '#8892a4' }}>{row.retrieved}</td>
              <td style={{ padding: '8px' }}>
                <span style={{
                  background: row.status === 'LIVE' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: row.status === 'LIVE' ? '#4caf50' : '#8892a4',
                  padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold'
                }}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        background: 'rgba(255, 61, 0, 0.05)',
        border: '1px solid #ff3d00',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <div style={{ fontSize: '24px' }}>⚠️</div>
        <div style={{ fontSize: '12px', color: '#e0e8ff', lineHeight: '1.5' }}>
          <strong style={{ color: '#ff3d00', display: 'block', marginBottom: '4px' }}>IMPORTANT NOTICE</strong>
          Orbital propagation: <span style={{ color: '#00f0ff' }}>PLANETORY TWO-BODY APPROXIMATION</span><br />
          NOT equivalent to NASA/JPL high-precision orbit determination.<br />
          Official impact risk: <span style={{ color: '#ff8c00', fontWeight: 'bold' }}>NASA/JPL CNEOS Sentry EXCLUSIVELY</span>.
        </div>
      </div>
    </div>
  );
};

export default NEOProvenance;

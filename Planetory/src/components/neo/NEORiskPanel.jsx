import React from 'react';

const NEORiskPanel = ({ riskData, neoName, loading }) => {
  if (loading) {
    return <div style={{ color: '#00f0ff', padding: '20px' }}>Loading Risk Data...</div>;
  }

  if (!riskData) {
    return <div style={{ color: '#8892a4', padding: '20px' }}>No risk data available for {neoName || 'this object'}.</div>;
  }

  const { sentryMonitored, impactProbability = 0, torinoScale = 0, palermoScale = -10, potentialImpacts = [], lastObs, retrievedAt } = riskData;

  const isNonZeroRisk = impactProbability > 0;
  
  let statusColor = '#4caf50';
  let statusText = 'NO CURRENTLY IDENTIFIED IMPACT RISK';
  if (sentryMonitored && !isNonZeroRisk) {
    statusColor = '#00f0ff';
    statusText = 'CLOSE APPROACH — NO CURRENT IMPACT PREDICTION';
  } else if (isNonZeroRisk) {
    statusColor = '#ff3d00';
    statusText = 'NON-ZERO IMPACT PROBABILITY IDENTIFIED';
  }

  const probDenominator = impactProbability > 0 ? Math.round(1 / impactProbability) : Infinity;
  const formattedProb = impactProbability > 0 ? impactProbability.toExponential(2) : '0';

  return (
    <div style={{ padding: '20px', background: 'rgba(2, 4, 10, 0.95)', color: '#e0e8ff', fontFamily: 'sans-serif' }} className="neo-risk-panel">
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#fff' }}>Impact Risk Assessment: {neoName}</h2>

      {/* STATUS BOX */}
      <div style={{
        background: `rgba(${isNonZeroRisk ? '255, 61, 0' : sentryMonitored ? '0, 240, 255' : '76, 175, 80'}, 0.1)`,
        border: `1px solid ${statusColor}`,
        borderRadius: '8px', padding: '16px', marginBottom: '24px',
        textAlign: 'center', fontWeight: 'bold', color: statusColor,
        animation: isNonZeroRisk ? 'pulseAlert 2s infinite' : 'none'
      }}>
        {statusText}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* TORINO SCALE */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '12px', color: '#8892a4', marginBottom: '8px', fontWeight: 'bold' }}>TORINO SCALE (0-10)</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: torinoScale > 0 ? '#ffb703' : '#4caf50' }}>{torinoScale}</div>
          <div style={{ fontSize: '12px', color: '#8892a4', marginTop: '8px' }}>Categorization for public communication of impact hazard.</div>
        </div>

        {/* PALERMO SCALE */}
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '12px', color: '#8892a4', marginBottom: '8px', fontWeight: 'bold' }}>PALERMO SCALE</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: palermoScale > -2 ? '#ffb703' : '#e0e8ff' }}>{palermoScale.toFixed(2)}</div>
          <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '8px' }}>Technical logarithmic scale used by specialists. Negative values indicate hazard less than background risk.</div>
        </div>
      </div>

      {/* IMPACT PROBABILITY */}
      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Cumulative Impact Probability</div>
          <div style={{ fontSize: '10px', background: 'rgba(255, 140, 0, 0.2)', color: '#ff8c00', padding: '4px 8px', borderRadius: '4px' }}>NASA/JPL CNEOS SENTRY</div>
        </div>
        <div style={{ fontSize: '24px', color: isNonZeroRisk ? '#ff3d00' : '#4caf50' }}>
          {formattedProb}
        </div>
        {isNonZeroRisk && probDenominator < 1e9 && (
          <div style={{ fontSize: '14px', color: '#ffb703', marginTop: '4px' }}>Approx. 1 in {probDenominator.toLocaleString()} chance of impact.</div>
        )}
      </div>

      {/* POTENTIAL IMPACT DATES */}
      {potentialImpacts && potentialImpacts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#8892a4', marginBottom: '12px' }}>Top Potential Impact Dates</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#8892a4' }}>
                <th style={{ padding: '8px' }}>Date</th>
                <th style={{ padding: '8px' }}>Probability</th>
                <th style={{ padding: '8px' }}>Energy (Mt)</th>
              </tr>
            </thead>
            <tbody>
              {potentialImpacts.slice(0, 5).map((ip, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px' }}>{ip.date}</td>
                  <td style={{ padding: '8px', color: ip.probability > 0 ? '#ff3d00' : '#e0e8ff' }}>{ip.probability.toExponential(2)}</td>
                  <td style={{ padding: '8px' }}>{ip.energyMt || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SENTRY FOOTER */}
      <div style={{ fontSize: '10px', color: '#8892a4', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        <div>Sentry Monitored: {sentryMonitored ? 'YES' : 'NO'}</div>
        <div>Last Observation: {lastObs || 'N/A'}</div>
        <div>Data Retrieved: {retrievedAt || 'N/A'}</div>
        <div style={{ marginTop: '8px', color: '#ffb703' }}>⚠️ Always verify with official NASA/JPL sources.</div>
      </div>

      <style>{`
        @keyframes pulseAlert {
          0% { box-shadow: 0 0 0 0 rgba(255, 61, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 61, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 61, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default NEORiskPanel;

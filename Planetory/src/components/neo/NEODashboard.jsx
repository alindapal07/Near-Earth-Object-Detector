import React, { useMemo } from 'react';

const NEODashboard = ({ feedData, earthApproaches, riskSummary, loading }) => {
  const stats = useMemo(() => {
    if (!feedData && !earthApproaches && !riskSummary) return null;

    let closestApproach = null;
    let upcomingCount = 0;
    if (earthApproaches?.approaches) {
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      closestApproach = Math.min(...earthApproaches.approaches.map(a => a.distAu));
      upcomingCount = earthApproaches.approaches.filter(a => {
        const approachTime = new Date(a.date).getTime();
        return approachTime >= now && approachTime <= now + thirtyDays;
      }).length;
    }

    let largestObj = 0;
    let fastestObj = 0;
    let phaCount = 0;
    if (feedData?.objects) {
      largestObj = Math.max(...feedData.objects.map(o => o.estimatedDiameterMaxKm || 0));
      fastestObj = Math.max(...feedData.objects.map(o => o.velocityKmS || 0));
      phaCount = feedData.objects.filter(o => o.isPha).length;
    }

    let nonZeroRiskCount = 0;
    if (riskSummary?.objects) {
      nonZeroRiskCount = riskSummary.objects.filter(o => o.probability > 0).length;
    }

    return {
      totalNeos: feedData?.count || 0,
      upcomingCount,
      closestApproach: closestApproach !== Infinity ? closestApproach : null,
      largestObj: largestObj !== -Infinity ? largestObj : null,
      fastestObj: fastestObj !== -Infinity ? fastestObj : null,
      phaCount,
      sentryMonitored: riskSummary?.count || 0,
      nonZeroRiskCount
    };
  }, [feedData, earthApproaches, riskSummary]);

  const cards = [
    { id: 1, icon: '🌍', label: 'TOTAL NEOs', value: stats?.totalNeos || 0, source: 'NASA NeoWs' },
    { id: 2, icon: '📅', label: 'UPCOMING APPROACHES (<=30 days)', value: stats?.upcomingCount || 0, source: 'JPL CNEOS CAD' },
    { id: 3, icon: '☄️', label: 'CLOSEST APPROACH', value: stats?.closestApproach ? `${(stats.closestApproach * 389.26).toFixed(2)} LD` : 'N/A', source: 'JPL CNEOS CAD' },
    { id: 4, icon: '📏', label: 'LARGEST OBJECT', value: stats?.largestObj ? `${stats.largestObj.toFixed(2)} km` : 'N/A', source: 'NASA NeoWs' },
    { id: 5, icon: '🚀', label: 'FASTEST APPROACH', value: stats?.fastestObj ? `${stats.fastestObj.toFixed(2)} km/s` : 'N/A', source: 'NASA NeoWs' },
    { id: 6, icon: '⚠️', label: 'PHA COUNT', value: stats?.phaCount || 0, source: 'NASA NeoWs' },
    { id: 7, icon: '📡', label: 'SENTRY MONITORED', value: stats?.sentryMonitored || 0, source: 'NASA/JPL CNEOS Sentry' },
    { id: 8, icon: '🔴', label: 'NON-ZERO RISK', value: stats?.nonZeroRiskCount || 0, source: 'NASA/JPL CNEOS Sentry' },
  ];

  return (
    <div style={{ padding: '20px', background: 'rgba(2, 4, 10, 0.95)', color: '#e0e8ff', fontFamily: 'sans-serif' }} className="neo-dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {cards.map(card => (
          <div key={card.id} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '12px', color: '#8892a4', fontWeight: 'bold' }}>{card.label}</div>
            
            {loading ? (
              <div style={{ height: '32px', background: '#333', borderRadius: '4px', marginTop: '8px', animation: 'pulse 1.5s infinite' }} />
            ) : (
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.label.includes('PHA') ? '#ffb703' : card.label.includes('RISK') ? '#ff3d00' : '#00f0ff', marginTop: '4px' }}>
                {card.value}
              </div>
            )}

            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              fontSize: '10px',
              padding: '2px 6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#8892a4'
            }}>
              {card.source}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#8892a4' }}>
        DATA SOURCES: NASA NeoWs • JPL CNEOS CAD • NASA/JPL CNEOS Sentry | Last updated: {new Date().toISOString()}
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default NEODashboard;

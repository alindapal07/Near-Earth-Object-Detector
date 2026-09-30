import React, { useState } from 'react';
import { formatDistance } from '../../utils/neoOrbitalCalc.js';

const NEOCloseApproachTimeline = ({ approaches, onSelectApproach, selectedApproach, simTimeDays }) => {
  const [filter, setFilter] = useState('ALL'); // PAST, FUTURE, ALL

  if (!approaches || approaches.length === 0) {
    return <div style={{ padding: '20px', color: '#8892a4' }}>No close approach data available.</div>;
  }

  const now = Date.now();
  
  const sortedApproaches = [...approaches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const filtered = sortedApproaches.filter(a => {
    const time = new Date(a.date).getTime();
    if (filter === 'PAST') return time < now;
    if (filter === 'FUTURE') return time >= now;
    return true;
  });

  const minDist = Math.min(...sortedApproaches.map(a => a.distAu));
  const maxVel = Math.max(...sortedApproaches.map(a => a.velocityKmS));
  const nextFuture = sortedApproaches.find(a => new Date(a.date).getTime() >= now);

  return (
    <div style={{ background: 'rgba(2, 4, 10, 0.95)', color: '#e0e8ff', height: '100%', display: 'flex', flexDirection: 'column' }} className="neo-timeline">
      <div style={{ display: 'flex', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '10px' }}>
        {['PAST', 'ALL', 'FUTURE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
            border: `1px solid ${filter === f ? '#00f0ff' : 'rgba(255,255,255,0.2)'}`,
            color: filter === f ? '#00f0ff' : '#8892a4',
            padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
          }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '24px', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.1)' }} />
        
        {filtered.map((item, idx) => {
          const isSelected = selectedApproach === item;
          const time = new Date(item.date).getTime();
          const isPast = time < now;
          const isClosest = item.distAu === minDist;
          const isFastest = item.velocityKmS === maxVel;
          const isNext = item === nextFuture;

          const distLD = (item.distAu * 389.26).toFixed(2);
          const distAuFormat = parseFloat(item.distAu).toFixed(5);

          return (
            <div key={idx} onClick={() => onSelectApproach && onSelectApproach(item)} style={{
              position: 'relative', paddingLeft: '40px', marginBottom: '24px', cursor: 'pointer',
              opacity: isPast ? 0.7 : 1
            }}>
              <div style={{
                position: 'absolute', left: '4px', top: '4px', width: '12px', height: '12px',
                borderRadius: '50%', background: isSelected ? '#00f0ff' : (isPast ? '#8892a4' : '#ffb703'),
                border: '2px solid rgba(2, 4, 10, 0.95)',
                boxShadow: isSelected ? '0 0 10px #00f0ff' : 'none',
                zIndex: 2, transform: 'translateX(-50%)'
              }} />

              <div style={{
                background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? '#00f0ff' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', padding: '12px',
                boxShadow: isSelected ? '0 0 15px rgba(0,240,255,0.1)' : 'none',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: isPast ? '#8892a4' : '#e0e8ff' }}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {isPast ? 'PAST' : 'FUTURE'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {isClosest && <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '2px 6px', borderRadius: '4px' }}>CLOSEST</span>}
                  {isNext && <span style={{ fontSize: '10px', background: 'rgba(255, 183, 3, 0.1)', color: '#ffb703', padding: '2px 6px', borderRadius: '4px' }}>NEXT</span>}
                  {isFastest && <span style={{ fontSize: '10px', background: 'rgba(255, 61, 0, 0.1)', color: '#ff3d00', padding: '2px 6px', borderRadius: '4px' }}>FASTEST</span>}
                </div>

                <div style={{ fontSize: '12px', color: '#8892a4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Distance: <span style={{ color: '#e0e8ff' }}>{distLD} LD</span> ({distAuFormat} AU)</div>
                  {item.distMinAu && item.distMaxAu && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Range: 
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '0%', width: '100%', height: '100%', background: 'rgba(0,240,255,0.3)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  )}
                  <div>Velocity: <span style={{ color: '#e0e8ff' }}>{parseFloat(item.velocityKmS).toFixed(2)} km/s</span></div>
                  <div>Body: <span style={{ color: '#00f0ff' }}>Earth</span></div>
                </div>
                
                <div style={{ fontSize: '9px', color: '#556075', marginTop: '12px', textAlign: 'right' }}>
                  Source: JPL CNEOS CAD
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NEOCloseApproachTimeline;

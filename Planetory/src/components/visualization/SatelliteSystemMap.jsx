import React from 'react';
import { formatKm, formatPeriod } from '../../utils/formatters';

/**
 * Satellite System Scientific Mini-Map & Period Comparison
 * Renders parent planet satellite system map with relative semi-major axis spacing,
 * physical vs visualization scale callout, and clickable focus selection.
 */
export default function SatelliteSystemMap({ parentObj, childMoons = [], onFocusMoon }) {
  if (!parentObj || childMoons.length === 0) return null;

  // Sort moons by orbital distance
  const sortedMoons = [...childMoons].sort((a, b) => (a.semiMajorAxisKm || a.a) - (b.semiMajorAxisKm || b.a));

  const maxDistKm = sortedMoons[sortedMoons.length - 1]?.semiMajorAxisKm || (sortedMoons[sortedMoons.length - 1]?.a * 149597870.7) || 1000000;
  const maxPeriodDays = Math.max(...sortedMoons.map(m => m.orbitalPeriodDays || 1));

  // SVG dimensions: viewBox 0 0 320 220, parent planet at center (160, 110)
  const cx = 160;
  const cy = 110;
  const maxRadiusPx = 135;

  return (
    <div className="sci-widget satellite-system-widget">
      <div className="widget-title">
        <span>{parentObj.name.toUpperCase()} SATELLITE SYSTEM ({childMoons.length} MAJOR MOONS)</span>
        <span className="scale-notice-badge">PHYSICAL ORBITAL SPACING</span>
      </div>

      {/* SVG Satellite Mini-Map */}
      <div className="sat-map-canvas-wrap">
        <svg viewBox="0 0 320 220" className="sat-map-svg">
          <defs>
            <radialGradient id="parentGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#003366" stopOpacity="0.4" />
            </radialGradient>
          </defs>

          {/* Central Parent Planet */}
          <circle cx={cx} cy={cy} r="14" fill="url(#parentGrad)" stroke="#00f0ff" strokeWidth="1.5" />
          <text x={cx} y={cy + 4} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
            {parentObj.name.toUpperCase()}
          </text>

          {/* Concentric Satellite Orbit Rings & Moon Dots */}
          {sortedMoons.map((moon, index) => {
            const distKm = moon.semiMajorAxisKm || (moon.a * 149597870.7);
            const distRatio = Math.max(0.12, distKm / maxDistKm);
            const rPx = distRatio * maxRadiusPx;

            // Distribute moons at varied angles for clear visual distinction
            const angle = (index / sortedMoons.length) * Math.PI * 2 + (index * 0.4);
            const mx = cx + rPx * Math.cos(angle);
            const my = cy + rPx * Math.sin(angle);

            return (
              <g key={moon.id} className="sat-map-group" onClick={() => onFocusMoon && onFocusMoon(moon)}>
                {/* Orbit Ring */}
                <circle cx={cx} cy={cy} r={rPx} fill="none" stroke="rgba(0, 240, 255, 0.25)" strokeDasharray="2 2" strokeWidth="1" />

                {/* Satellite Indicator Dot */}
                <circle cx={mx} cy={my} r="5" fill="#ffb703" stroke="#ffffff" strokeWidth="1" className="sat-dot" />

                {/* Moon Label */}
                <text x={mx + 7} y={my + 3} fill="#ffffff" fontSize="9" fontWeight="500" className="sat-map-label">
                  {moon.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Satellite Orbital Period Comparison List */}
      <div className="sat-period-list">
        <div className="sat-list-header">ORBITAL PERIOD COMPARISON</div>
        {sortedMoons.map(moon => {
          const pDays = moon.orbitalPeriodDays || 1;
          const pPct = Math.min(100, Math.max(4, (pDays / maxPeriodDays) * 100));
          return (
            <div 
              key={moon.id} 
              className="sat-period-row"
              onClick={() => onFocusMoon && onFocusMoon(moon)}
              title={`Click to focus ${moon.name}`}
            >
              <div className="sat-name-col">
                <span className="sat-icon">🌙</span>
                <span className="sat-name">{moon.name}</span>
              </div>
              <div className="sat-bar-col">
                <div className="sat-track">
                  <div className="sat-fill" style={{ width: `${pPct}%` }} />
                </div>
              </div>
              <div className="sat-val-col">
                {formatPeriod(pDays)}
              </div>
              <button className="sat-mini-focus">🎯</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

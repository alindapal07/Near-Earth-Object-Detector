import React, { useState } from 'react';
import { formatAU, formatKm } from '../../utils/formatters';

/**
 * ScientificLiveCharts.jsx - Real-Time Astronomical Telemetry Plotter
 * Plots Orbital Velocity vs Time, Solar Distance vs Time, and True Anomaly over time.
 */
export default function ScientificLiveCharts({ obj, simTimeDays }) {
  const [chartType, setChartType] = useState('velocity'); // 'velocity' | 'distance' | 'anomaly'

  if (!obj || obj.id === 'sun') return null;

  const a = obj?.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / 149597870.7 : 1.0);
  const e = obj?.e !== undefined ? obj.e : (obj?.eccentricity !== undefined ? obj.eccentricity : 0.0167);
  const period = obj?.orbitalPeriodDays || 365.25;

  // Generate 20 plot sample points across one full orbit
  const points = [];
  const totalSamples = 24;
  for (let i = 0; i <= totalSamples; i++) {
    const frac = i / totalSamples;
    const vRad = frac * Math.PI * 2;
    const rAu = (a * (1 - e * e)) / (1 + e * Math.cos(vRad));
    
    // Vis-viva velocity km/s
    const aKm = a * 149597870.7;
    const rKm = rAu * 149597870.7;
    const vKmS = Math.sqrt(Math.max(0, 1.3271244e11 * ((2 / rKm) - (1 / aKm))));

    points.push({
      frac,
      rAu,
      vKmS,
      vDeg: (vRad * 180) / Math.PI
    });
  }

  // Current playhead orbital fraction
  const currentFrac = ((simTimeDays / period) % 1 + 1) % 1;
  const playheadX = 40 + currentFrac * 260;

  // Scale Y coordinates for SVG viewBox 0 0 320 120
  const buildPolyline = () => {
    return points.map((p, idx) => {
      const x = 40 + (idx / totalSamples) * 260;
      let yVal = 60;
      if (chartType === 'velocity') {
        const minV = points[points.length - 1].vKmS;
        const maxV = points[0].vKmS;
        const norm = maxV > minV ? (p.vKmS - minV) / (maxV - minV) : 0.5;
        yVal = 100 - norm * 80;
      } else if (chartType === 'distance') {
        const minR = a * (1 - e);
        const maxR = a * (1 + e);
        const norm = maxR > minR ? (p.rAu - minR) / (maxR - minR) : 0.5;
        yVal = 100 - norm * 80;
      } else {
        yVal = 100 - (p.vDeg / 360) * 80;
      }
      return `${x},${yVal}`;
    }).join(' ');
  };

  return (
    <div className="sci-widget sci-live-charts-widget">
      <div className="widget-title font-mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ASTRODYNAMIC TELEMETRY PLOTTER</span>
        <div className="chart-type-toggle font-mono">
          <button className={`c-type-btn ${chartType === 'velocity' ? 'active' : ''}`} onClick={() => setChartType('velocity')}>Velocity</button>
          <button className={`c-type-btn ${chartType === 'distance' ? 'active' : ''}`} onClick={() => setChartType('distance')}>Distance</button>
          <button className={`c-type-btn ${chartType === 'anomaly' ? 'active' : ''}`} onClick={() => setChartType('anomaly')}>Anomaly</button>
        </div>
      </div>

      <div className="chart-svg-wrap">
        <svg viewBox="0 0 320 120" className="chart-svg">
          <defs>
            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#ffb703" />
              <stop offset="100%" stopColor="#00f0ff" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
          <line x1="40" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
          <line x1="40" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />

          {/* Axes */}
          <line x1="40" y1="10" x2="40" y2="100" stroke="rgba(0,240,255,0.4)" strokeWidth="1" />
          <line x1="40" y1="100" x2="300" y2="100" stroke="rgba(0,240,255,0.4)" strokeWidth="1" />

          {/* Plot Polyline */}
          <polyline fill="none" stroke="url(#chartGrad)" strokeWidth="2" points={buildPolyline()} />

          {/* Simulation Time Playhead */}
          <line x1={playheadX} y1="10" x2={playheadX} y2="100" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={playheadX} cy="55" r="4" fill="#00f0ff" stroke="#ffffff" strokeWidth="1" />
        </svg>
      </div>

      <div className="chart-footer font-mono">
        <span>Perihelion</span>
        <span>• Orbit Progress (0 - 100%) •</span>
        <span>Aphelion</span>
      </div>
    </div>
  );
}

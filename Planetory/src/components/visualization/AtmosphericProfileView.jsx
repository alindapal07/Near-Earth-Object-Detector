import React from 'react';
import { PLANETARY_DETAILS } from '../../data/planetaryDetails';

/**
 * AtmosphericProfileView.jsx - Scientific Atmospheric Graph & Layer Analyzer
 * Displays pressure curves, temperature gradients, atmospheric scale height, and chemical composition.
 */
export default function AtmosphericProfileView({ obj }) {
  const key = (obj?.id || '').toLowerCase();
  const details = PLANETARY_DETAILS[key] || (obj?.atmosphere ? PLANETARY_DETAILS['saturn'] : null);
  const atmos = details?.atmosphere;

  if (!atmos || !atmos.layers || atmos.layers.length === 0) {
    return (
      <div className="sci-widget atmospheric-widget font-mono">
        <div className="widget-title">ATMOSPHERIC PROFILE ANALYTICS</div>
        <div className="adp-note">
          No substantial atmosphere detected for {obj?.name || 'this body'} (Exosphere / Airless Body).
        </div>
      </div>
    );
  }

  const layers = atmos.layers;

  return (
    <div className="sci-widget atmospheric-widget">
      <div className="widget-title font-mono" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>ATMOSPHERIC STRUCTURE & ALTITUDE PROFILE</span>
        <span className="atmos-scale-badge font-mono">Scale Height: {atmos.scaleHeightKm} km</span>
      </div>

      <div className="atmos-summary-row font-mono">
        <div className="a-stat font-mono">
          <span className="a-lbl">SURFACE PRESSURE</span>
          <span className="a-val">{atmos.surfacePressureBar}</span>
        </div>
        <div className="a-stat font-mono">
          <span className="a-lbl">MAIN COMPOSITION</span>
          <span className="a-val">{obj?.atmosphere || layers[0]?.composition}</span>
        </div>
      </div>

      {/* SVG Altitude vs Temperature / Pressure Graph */}
      <div className="atmos-graph-wrap">
        <svg viewBox="0 0 320 130" className="atmos-svg">
          <defs>
            <linearGradient id="atmosTempGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#ffb703" />
              <stop offset="100%" stopColor="#ff0055" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
          <line x1="40" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
          <line x1="40" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />

          {/* Axes */}
          <line x1="40" y1="10" x2="40" y2="110" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" />
          <line x1="40" y1="110" x2="300" y2="110" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" />

          <text x="10" y="60" fill="rgba(255,255,255,0.6)" fontSize="7" className="font-mono" transform="rotate(-90 20 60)">
            Alt (km)
          </text>
          <text x="170" y="124" fill="rgba(255,255,255,0.6)" fontSize="7" className="font-mono" textAnchor="middle">
            Temperature (K) / Pressure (bar)
          </text>

          {/* Layer Plot Nodes */}
          {layers.map((l, i) => {
            const x = 50 + (i / Math.max(1, layers.length - 1)) * 230;
            const y = 100 - (i / Math.max(1, layers.length - 1)) * 80;

            return (
              <g key={i}>
                <circle cx={x} cy={y} r="4" fill="#00f0ff" stroke="#ffffff" strokeWidth="1" />
                <text x={x} y={y - 8} fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" className="font-mono">
                  {l.altitudeKm > 0 ? `+${l.altitudeKm}km` : `${l.altitudeKm}km`}
                </text>
                <text x={x} y={y + 12} fill="#ffb703" fontSize="6.5" textAnchor="middle" className="font-mono">
                  {l.tempK}K
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chemical Composition Breakdown Cards */}
      <div className="atmos-layers-list font-mono">
        {layers.map((l, i) => (
          <div key={i} className="atmos-layer-row">
            <div className="a-layer-col">
              <span className="a-layer-alt">{l.altitudeKm >= 0 ? `+${l.altitudeKm} km` : `${l.altitudeKm} km`}</span>
              <span className="a-layer-temp">{l.tempK} K</span>
            </div>
            <div className="a-layer-comp">{l.composition}</div>
            <div className="a-layer-press">{l.pressureBar} bar</div>
          </div>
        ))}
      </div>
    </div>
  );
}

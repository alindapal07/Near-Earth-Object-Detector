import React from 'react';
import { PLANETARY_DETAILS } from '../../data/planetaryDetails';

/**
 * MagneticFieldVisualization.jsx - Magnetosphere & Solar Wind Shield Module
 * Visualizes dipole magnetic field lines, tilt angle, field strength, magnetosphere radius, and auroral oval.
 */
export default function MagneticFieldVisualization({ selectedObj }) {
  const objId = selectedObj?.id || 'earth';
  const details = PLANETARY_DETAILS[objId] || {};
  const mag = details.magneticField || {
    strengthGauss: objId === 'earth' ? '0.25 - 0.65 G' : objId === 'jupiter' ? '4.2 - 14.0 G (20,000× Earth)' : 'Unknown / Weak',
    dipoleTiltDeg: objId === 'earth' ? 11.5 : objId === 'jupiter' ? 9.6 : 0,
    features: 'Global magnetosphere protecting planetary atmosphere from solar wind sputtering.'
  };

  const strengthText = mag.strengthGauss || 'N/A';
  const tiltDeg = mag.dipoleTiltDeg !== undefined ? mag.dipoleTiltDeg : 0;

  // SVG parameters
  const cx = 100;
  const cy = 70;
  const rad = (tiltDeg * Math.PI) / 180;

  return (
    <div className="sci-widget mag-field-widget sci-panel-v7">
      <div className="widget-title font-mono">🧲 MAGNETOSPHERE & DYNAMO ENGINE</div>

      <div className="mag-field-stage font-mono">
        <svg viewBox="0 0 200 140" className="mag-svg">
          <defs>
            <radialGradient id="auroraGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ffaa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00ffaa" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="solarWind" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffea00" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff3d00" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Solar Wind Vectors */}
          <g transform="translate(5, 20)">
            <line x1="0" y1="20" x2="35" y2="20" stroke="url(#solarWind)" strokeWidth="2" />
            <polygon points="35,17 40,20 35,23" fill="#ffea00" />
            <line x1="0" y1="50" x2="35" y2="50" stroke="url(#solarWind)" strokeWidth="2" />
            <polygon points="35,47 40,50 35,53" fill="#ffea00" />
            <line x1="0" y1="80" x2="35" y2="80" stroke="url(#solarWind)" strokeWidth="2" />
            <polygon points="35,77 40,80 35,83" fill="#ffea00" />
            <text x="2" y="10" fill="#ffea00" fontSize="7">SOLAR WIND ⚡</text>
          </g>

          {/* Bow Shock Line */}
          <path d="M 45 10 Q 25 70 45 130" fill="none" stroke="#ffb703" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="18" y="125" fill="#ffb703" fontSize="6">Bow Shock</text>

          {/* Dipole Field Loop Curves */}
          <g transform={`rotate(${tiltDeg}, 100, 70)`}>
            <ellipse cx="100" cy="50" rx="35" ry="25" fill="none" stroke="#00f0ff" strokeWidth="1.2" opacity="0.7" />
            <ellipse cx="100" cy="90" rx="35" ry="25" fill="none" stroke="#00f0ff" strokeWidth="1.2" opacity="0.7" />
            <ellipse cx="100" cy="35" rx="55" ry="40" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.45" />
            <ellipse cx="100" cy="105" rx="55" ry="40" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.45" />

            {/* Dipole Axis Line */}
            <line x1="100" y1="20" x2="100" y2="120" stroke="#00ffaa" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="104" y="24" fill="#00ffaa" fontSize="7" fontWeight="bold">N MAG</text>
            <text x="104" y="118" fill="#00ffaa" fontSize="7" fontWeight="bold">S MAG</text>

            {/* Auroral Oval Zones */}
            <ellipse cx="100" cy="52" rx="12" ry="5" fill="url(#auroraGlow)" />
            <ellipse cx="100" cy="88" rx="12" ry="5" fill="url(#auroraGlow)" />
          </g>

          {/* Planetary Sphere */}
          <circle cx={cx} cy={cy} r="18" fill="#061224" stroke="#00f0ff" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="16" fill="rgba(0,240,255,0.2)" />
        </svg>

        {/* Magnetic Field Specs Grid */}
        <div className="mag-specs-grid font-mono">
          <div className="mag-spec-item">
            <span className="m-lbl">Field Strength:</span>
            <span className="m-val text-cyan">{strengthText}</span>
          </div>
          <div className="mag-spec-item">
            <span className="m-lbl">Dipole Tilt:</span>
            <span className="m-val text-amber">{tiltDeg}°</span>
          </div>
          <div className="mag-spec-item full-width">
            <span className="m-lbl">Dynamo Dynamics:</span>
            <span className="m-val text-green">{mag.features}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { formatAngle } from '../../utils/formatters';

/**
 * RotationVisualization.jsx - Real Rotation Analyzer Module
 * Renders 3D/2D rotation globe with spin axis, axial tilt, North/South poles,
 * Day/Night terminator line, solar illumination, rotation direction arrows,
 * local solar time, and sub-solar latitude/longitude.
 */
export default function RotationVisualization({ selectedObj, simTimeDays = 0 }) {
  const tiltDeg = selectedObj?.axialTiltDeg !== undefined ? selectedObj.axialTiltDeg : (selectedObj?.id === 'earth' ? 23.44 : 0);
  const rotHours = selectedObj?.rotationPeriodHours || (selectedObj?.id === 'earth' ? 23.93 : null);
  const isRetrograde = rotHours && rotHours < 0;

  // Format rotation period text
  let rotText = 'N/A';
  if (rotHours != null) {
    const absHours = Math.abs(rotHours);
    if (absHours < 24) {
      rotText = `${absHours.toFixed(2)} h ${isRetrograde ? '(Retrograde)' : '(Prograde)'}`;
    } else {
      const days = absHours / 24;
      rotText = `${days.toFixed(1)} d (${absHours.toFixed(1)}h) ${isRetrograde ? '(Retrograde)' : ''}`;
    }
  }

  // Calculate local solar time & sub-solar coords based on simulation time
  const dayProgress = rotHours ? ((simTimeDays * 24) / Math.abs(rotHours)) % 1 : 0.5;
  const solarHours = Math.floor(dayProgress * 24);
  const solarMins = Math.floor((dayProgress * 24 - solarHours) * 60);
  const localSolarTime = `${solarHours.toString().padStart(2, '0')}:${solarMins.toString().padStart(2, '0')} LST`;

  const subSolarLat = (Math.sin((simTimeDays / 365.25) * Math.PI * 2) * tiltDeg).toFixed(1);
  const subSolarLon = (((360 - dayProgress * 360) % 360) - 180).toFixed(1);

  // SVG parameters
  const cx = 60;
  const cy = 60;
  const r = 38;
  const axisLen = 52;
  const rad = (tiltDeg * Math.PI) / 180;

  const nX = cx - axisLen * Math.sin(rad);
  const nY = cy - axisLen * Math.cos(rad);
  const sX = cx + axisLen * Math.sin(rad);
  const sY = cy + axisLen * Math.cos(rad);

  return (
    <div className="sci-widget rotation-widget sci-panel-v7">
      <div className="widget-title font-mono">🌐 REAL ROTATION DYNAMICS & ILLUMINATION ANALYZER</div>

      <div className="rot-flex">
        {/* SVG Interactive Globe Stage */}
        <div className="rot-svg-wrap">
          <svg viewBox="0 0 120 120" className="rot-svg">
            <defs>
              <linearGradient id="sunlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffb703" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.2" />
                <stop offset="50.1%" stopColor="#000000" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Sunlight Direction Arrows */}
            <line x1="2" y1="35" x2="18" y2="35" stroke="#ffb703" strokeWidth="1.5" />
            <polygon points="18,32 23,35 18,38" fill="#ffb703" />
            <line x1="2" y1="85" x2="18" y2="85" stroke="#ffb703" strokeWidth="1.5" />
            <polygon points="18,82 23,85 18,88" fill="#ffb703" />
            <text x="2" y="24" fill="#ffb703" fontSize="7" className="font-mono">SUNLIGHT ☀</text>

            {/* Orbital Plane Reference Line */}
            <line x1="10" y1="60" x2="110" y2="60" stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" strokeWidth="1" />
            <text x="82" y="55" fill="rgba(255,255,255,0.4)" fontSize="6" className="font-mono">ORBIT PLANE</text>

            {/* Vertical Ecliptic Normal */}
            <line x1="60" y1="10" x2="60" y2="110" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" strokeWidth="1" />

            {/* Rotated Axis Line */}
            <line x1={nX} y1={nY} x2={sX} y2={sY} stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" />

            {/* Planet Body Circle */}
            <circle cx={cx} cy={cy} r={r} fill="#060d1a" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1" />

            {/* Sunlight & Day/Night Terminator Gradient */}
            <circle cx={cx} cy={cy} r={r - 1} fill="url(#sunlightGrad)" />

            {/* Day/Night Terminator Line */}
            <line x1="60" y1="22" x2="60" y2="98" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />

            {/* Sub-Solar Point */}
            <circle cx="35" cy="60" r="3" fill="#ffea00" />
            <text x="22" y="72" fill="#ffea00" fontSize="6" fontWeight="bold" className="font-mono">SUB-SOLAR</text>

            {/* Rotation Arrow */}
            <path 
              d={isRetrograde ? "M 75 45 A 25 10 0 0 1 45 45" : "M 45 45 A 25 10 0 0 1 75 45"} 
              fill="none" 
              stroke="#00ffaa" 
              strokeWidth="1.5" 
              strokeDasharray="2 1"
            />
            <polygon 
              points={isRetrograde ? "45,42 41,45 45,48" : "75,42 79,45 75,48"} 
              fill="#00ffaa" 
            />

            {/* North Pole Pin */}
            <circle cx={nX} cy={nY} r="3" fill="#ffb703" />
            <text x={nX + 4} y={nY + 3} fill="#ffb703" fontSize="8" fontWeight="bold" className="font-mono">N POLE</text>

            {/* South Pole Pin */}
            <circle cx={sX} cy={sY} r="3" fill="#00f0ff" />
            <text x={sX + 4} y={sY + 3} fill="#00f0ff" fontSize="8" fontWeight="bold" className="font-mono">S POLE</text>
          </svg>
        </div>

        {/* Rotation Metrics Details */}
        <div className="rot-details font-mono">
          <div className="rot-row">
            <span className="r-lbl">Axial Tilt:</span>
            <span className="r-val text-cyan">{formatAngle(tiltDeg, 2)}</span>
          </div>
          <div className="rot-row">
            <span className="r-lbl">Rotation Period:</span>
            <span className="r-val">{rotText}</span>
          </div>
          <div className="rot-row">
            <span className="r-lbl">Spin Sense:</span>
            <span className="r-val text-amber">{isRetrograde ? 'Retrograde (Clockwise)' : 'Prograde (Direct)'}</span>
          </div>
          <div className="rot-row">
            <span className="r-lbl">Local Solar Time:</span>
            <span className="r-val text-green">{localSolarTime}</span>
          </div>
          <div className="rot-row">
            <span className="r-lbl">Sub-Solar Lat/Lon:</span>
            <span className="r-val">{subSolarLat}°N, {subSolarLon}°E</span>
          </div>
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { formatPeriod } from '../../utils/formatters';

/**
 * Circular Orbital Phase & Progress Component
 * Displays phase position relative to Perihelion and Aphelion.
 */
export default function OrbitalPhase({ obj, simTimeDays, currentTrueAnomalyRad }) {
  const periodDays = obj?.orbitalPeriodDays || 365.25;
  const daysInPeriod = ((simTimeDays % periodDays) + periodDays) % periodDays;
  const progressPct = ((daysInPeriod / periodDays) * 100).toFixed(1);

  // Angle for circular progress needle (0 deg at Perihelion = 90deg SVG angle)
  const angleRad = currentTrueAnomalyRad !== undefined 
    ? currentTrueAnomalyRad 
    : ((daysInPeriod / periodDays) * Math.PI * 2);

  const cx = 50;
  const cy = 50;
  const r = 38;

  // Needle tip coordinates
  const nx = cx + r * Math.cos(angleRad);
  const ny = cy + r * Math.sin(angleRad);

  return (
    <div className="sci-widget orbital-phase-widget">
      <div className="widget-title">ORBITAL PHASE & CYCLE PROGRESS</div>

      <div className="phase-flex">
        <div className="phase-dial-wrap">
          <svg viewBox="0 0 100 100" className="phase-svg">
            {/* Background Dial Track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />

            {/* Completed Progress Arc */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="6"
              strokeDasharray={`${(progressPct / 100) * (2 * Math.PI * r)} ${2 * Math.PI * r}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />

            {/* Perihelion Marker at 3 o'clock (0 rad) */}
            <circle cx={cx + r} cy={cy} r="3" fill="#ffb703" />

            {/* Aphelion Marker at 9 o'clock (PI rad) */}
            <circle cx={cx - r} cy={cy} r="3" fill="#00f0ff" />

            {/* Central Sun */}
            <circle cx={cx} cy={cy} r="6" fill="#ffea00" />

            {/* Current Position Needle */}
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx={nx} cy={ny} r="4" fill="#00f0ff" stroke="#ffffff" strokeWidth="1" />
          </svg>
        </div>

        <div className="phase-info">
          <div className="phase-stat-row">
            <span className="p-label">ORBITAL PHASE</span>
            <span className="p-val">{progressPct}% COMPLETE</span>
          </div>
          <div className="phase-stat-row">
            <span className="p-label">ELAPSED TIME</span>
            <span className="p-val">{daysInPeriod.toFixed(1)} / {formatPeriod(periodDays)}</span>
          </div>
          <div className="phase-markers">
            <span className="p-badge p-badge--peri">● PERIHELION (MIN DIST)</span>
            <span className="p-badge p-badge--aph">● APHELION (MAX DIST)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

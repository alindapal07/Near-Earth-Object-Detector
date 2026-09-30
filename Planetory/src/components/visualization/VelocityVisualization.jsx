import React from 'react';
import { calculateApsidalVelocities } from '../../utils/orbitalMath';

/**
 * Instantaneous Orbital Velocity Visualizer (Vis-Viva equation)
 * Displays live orbital velocity along min (aphelion) to max (perihelion) range.
 */
export default function VelocityVisualization({ obj, currentVelocityKmS }) {
  const aAu = obj?.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / 149597870.7 : 1.0);
  const e = obj?.e !== undefined ? obj.e : (obj?.eccentricity !== undefined ? obj.eccentricity : 0.0167);

  const { vPeri, vAph } = calculateApsidalVelocities(aAu, e, undefined, true);

  const vCurrent = currentVelocityKmS || (vPeri + vAph) / 2 || 29.78;

  // Percentage along velocity range (vAph = slowest, vPeri = fastest)
  const vMin = Math.min(vAph, vPeri);
  const vMax = Math.max(vAph, vPeri);
  const range = vMax - vMin;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((vCurrent - vMin) / range) * 100)) : 50;

  return (
    <div className="sci-widget velocity-widget">
      <div className="widget-title">
        <span>INSTANTANEOUS ORBITAL VELOCITY (VIS-VIVA)</span>
        <span className="formula-tag">v² = μ(2/r - 1/a)</span>
      </div>

      <div className="vel-hero-val">
        <span className="vel-main">{vCurrent.toFixed(2)}</span>
        <span className="vel-unit">km/s</span>
        <span className="vel-secondary">({(vCurrent * 3600).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h)</span>
      </div>

      {/* Velocity Range Bar */}
      <div className="vel-bar-wrap">
        <div className="vel-bar-labels">
          <span>APHELION (MIN): {vMin.toFixed(2)} km/s</span>
          <span>PERIHELION (MAX): {vMax.toFixed(2)} km/s</span>
        </div>

        <div className="vel-track">
          <div className="vel-fill" style={{ width: `${pct}%` }} />
          <div className="vel-pointer" style={{ left: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

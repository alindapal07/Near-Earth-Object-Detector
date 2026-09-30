import React from 'react';
import { formatKm, formatAU } from '../../utils/formatters';
import { calculateApsides } from '../../utils/orbitalMath';

/**
 * Dynamic Solar/Parent Distance Visualizer
 * Shows live dynamic distance changing as planet moves from perihelion to aphelion.
 */
export default function DistanceVisualization({ obj, currentDistanceKm, unitSystem = 'astronomical' }) {
  const aAu = obj?.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / 149597870.7 : 1.0);
  const e = obj?.e !== undefined ? obj.e : (obj?.eccentricity !== undefined ? obj.eccentricity : 0.0167);

  const { q, Q } = calculateApsides(aAu, e, true);

  const curAu = currentDistanceKm ? currentDistanceKm / 149597870.7 : aAu;
  const curKm = currentDistanceKm || (aAu * 149597870.7);

  // Position percentage along perihelion -> aphelion range
  const minAu = q || aAu * 0.98;
  const maxAu = Q || aAu * 1.02;
  const range = maxAu - minAu;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((curAu - minAu) / range) * 100)) : 50;

  const parentName = obj?.parentPlanet ? obj.parentPlanet.toUpperCase() : 'SUN';

  return (
    <div className="sci-widget distance-widget">
      <div className="widget-title">
        <span>DYNAMIC {parentName} DISTANCE</span>
        <span className="dist-live-tag">LIVE TELEMETRY</span>
      </div>

      <div className="dist-hero-val">
        <span className="dist-main">{formatAU(curAu, 4)}</span>
        <span className="dist-sub">({formatKm(curKm, 0)})</span>
      </div>

      {/* Visual Distance Track between Perihelion & Aphelion */}
      <div className="dist-bar-section">
        <div className="dist-bar-header">
          <span>PERIHELION: {formatAU(minAu, 3)}</span>
          <span>APHELION: {maxAu ? formatAU(maxAu, 3) : 'N/A'}</span>
        </div>

        <div className="dist-track">
          <div className="dist-indicator-dot" style={{ left: `${pct}%` }}>
            <span className="dist-dot-label">{curAu.toFixed(3)} AU</span>
          </div>
        </div>

        <div className="dist-bar-sub font-mono">
          Semi-Major Axis (a): {formatAU(aAu, 3)}
        </div>
      </div>
    </div>
  );
}

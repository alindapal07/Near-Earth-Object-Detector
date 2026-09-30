import React from 'react';
import { calculateSurfaceGravity, calculateEscapeVelocity } from '../../utils/orbitalMath';

/**
 * Surface Gravity & Escape Velocity Visualizer
 * Uses true physical mass & physical radius (never render radius).
 */
export default function GravityVisualization({ selectedObj }) {
  const radiusKm = selectedObj?.radiusKm || (selectedObj?.diameterKm ? selectedObj.diameterKm / 2 : null);
  const massKg = selectedObj?.massKg ? Number(selectedObj.massKg) : null;

  const calculatedG = calculateSurfaceGravity(massKg, radiusKm);
  const calculatedVEsc = calculateEscapeVelocity(massKg, radiusKm);

  const g = selectedObj?.gravity !== undefined ? Number(selectedObj.gravity) : calculatedG;
  const vEsc = selectedObj?.escapeVelocity !== undefined ? Number(selectedObj.escapeVelocity) : calculatedVEsc;

  const earthG = 9.80665;
  const gRatio = g != null ? (g / earthG).toFixed(2) : null;

  return (
    <div className="sci-widget gravity-widget">
      <div className="widget-title">SURFACE GRAVITY & ESCAPE VELOCITY</div>

      <div className="grav-grid">
        {/* Surface Gravity */}
        <div className="grav-card">
          <div className="grav-card-title">SURFACE GRAVITY (g)</div>
          <div className="grav-card-val">
            {g != null ? (
              <>
                <span className="g-num">{g.toFixed(2)}</span>
                <span className="g-unit">m/s²</span>
                <span className="g-ratio font-mono">({gRatio}× Earth g)</span>
              </>
            ) : (
              <span className="na-text">Not available</span>
            )}
          </div>
        </div>

        {/* Escape Velocity */}
        <div className="grav-card">
          <div className="grav-card-title">ESCAPE VELOCITY (v_esc)</div>
          <div className="grav-card-val">
            {vEsc != null ? (
              <>
                <span className="g-num">{vEsc.toFixed(2)}</span>
                <span className="g-unit">km/s</span>
                <span className="g-ratio font-mono">({(vEsc * 3600).toLocaleString()} km/h)</span>
              </>
            ) : (
              <span className="na-text">Not available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

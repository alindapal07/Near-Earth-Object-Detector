import React from 'react';
import { formatMass } from '../../utils/formatters';

/**
 * Scientific Mass & Mass Ratio Visualizer
 */
export default function MassComparison({ selectedObj }) {
  const massKg = selectedObj?.massKg ? Number(selectedObj.massKg) : null;
  const earthMassKg = 5.972e24;
  const jupiterMassKg = 1.898e27;

  if (!massKg) {
    return (
      <div className="sci-widget">
        <div className="widget-title">MASS & GRAVITATIONAL PARAMETERS</div>
        <div className="na-text">Mass data not available for this object.</div>
      </div>
    );
  }

  const earthRatio = (massKg / earthMassKg).toFixed(massKg / earthMassKg < 0.01 ? 4 : 2);
  const jupiterRatio = (massKg / jupiterMassKg).toFixed(massKg / jupiterMassKg < 0.01 ? 4 : 2);

  return (
    <div className="sci-widget mass-widget">
      <div className="widget-title">MASS & GRAVITATIONAL COMPARISON</div>

      <div className="mass-main-val">
        <span className="mass-val-str">{formatMass(massKg)}</span>
      </div>

      <div className="mass-ratio-grid">
        <div className="mass-ratio-card">
          <span className="m-ratio-num">{earthRatio} ×</span>
          <span className="m-ratio-lbl">Earth Mass (M⊕)</span>
        </div>
        <div className="mass-ratio-card">
          <span className="m-ratio-num">{jupiterRatio} ×</span>
          <span className="m-ratio-lbl">Jupiter Mass (MJ)</span>
        </div>
      </div>
    </div>
  );
}

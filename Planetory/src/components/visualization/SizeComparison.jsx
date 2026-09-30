import React, { useState } from 'react';
import { formatKm } from '../../utils/formatters';

const REFERENCE_BODIES = [
  { id: 'sun', name: 'Sun', radiusKm: 696340, color: '#ffb703' },
  { id: 'jupiter', name: 'Jupiter', radiusKm: 69911, color: '#d97706' },
  { id: 'saturn', name: 'Saturn', radiusKm: 58232, color: '#eab308' },
  { id: 'neptune', name: 'Neptune', radiusKm: 24622, color: '#0284c7' },
  { id: 'earth', name: 'Earth', radiusKm: 6371, color: '#00f0ff' },
  { id: 'venus', name: 'Venus', radiusKm: 6051, color: '#f97316' },
  { id: 'mars', name: 'Mars', radiusKm: 3389.5, color: '#ef4444' },
  { id: 'moon', name: 'Moon', radiusKm: 1737.4, color: '#94a3b8' }
];

/**
 * SizeComparison.jsx - Interactive Proportional Scale Visualizer
 * Draws proportional SVG circles with toggles: Compare to Earth / Sun / Selected.
 */
export default function SizeComparison({ selectedObj }) {
  const [scaleMode, setScaleMode] = useState('EARTH'); // 'EARTH' | 'SUN' | 'SELECTED'

  const selectedRadius = selectedObj?.radiusKm || (selectedObj?.diameterKm ? selectedObj.diameterKm / 2 : 6371);
  const selectedName = selectedObj?.name || selectedObj?.id || 'Selected Object';

  // Base reference selection
  let baseRadius = 6371;
  if (scaleMode === 'SUN') baseRadius = 696340;
  if (scaleMode === 'SELECTED') baseRadius = selectedRadius;

  const getCircleRadius = (rKm) => {
    if (scaleMode === 'SUN') {
      const ratio = rKm / 696340;
      return Math.max(3, Math.pow(ratio, 0.4) * 45);
    }
    const ratio = rKm / baseRadius;
    return Math.min(48, Math.max(4, Math.pow(ratio, 0.5) * 20));
  };

  return (
    <div className="sci-widget size-comparison-widget sci-panel-v7">
      <div className="widget-title font-mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📐 PLANETARY SCALE COMPARISON</span>
        <div className="scale-toggle-btns font-mono">
          <button 
            type="button"
            className={`scale-btn ${scaleMode === 'EARTH' ? 'scale-btn--active' : ''}`}
            onClick={() => setScaleMode('EARTH')}
          >
            vs EARTH
          </button>
          <button 
            type="button"
            className={`scale-btn ${scaleMode === 'SUN' ? 'scale-btn--active' : ''}`}
            onClick={() => setScaleMode('SUN')}
          >
            vs SUN
          </button>
          <button 
            type="button"
            className={`scale-btn ${scaleMode === 'SELECTED' ? 'scale-btn--active' : ''}`}
            onClick={() => setScaleMode('SELECTED')}
          >
            vs {selectedName.toUpperCase()}
          </button>
        </div>
      </div>

      {/* SVG Proportional Circles Canvas */}
      <div className="scale-circles-container">
        <svg viewBox="0 0 400 120" className="scale-svg font-mono">
          {REFERENCE_BODIES.map((body, idx) => {
            const isSelected = selectedObj?.id === body.id || selectedName.toLowerCase() === body.name.toLowerCase();
            const r = getCircleRadius(body.radiusKm);
            const cx = 30 + idx * 48;
            const cy = 60;
            const ratioVal = (body.radiusKm / selectedRadius).toFixed(2);

            return (
              <g key={body.id} className="scale-body-group">
                <circle 
                  cx={cx} cy={cy} r={r} 
                  fill={body.color} 
                  opacity={isSelected ? 0.95 : 0.6}
                  stroke={isSelected ? '#00f0ff' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text x={cx} y={cy + r + 14} fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight={isSelected ? 'bold' : 'normal'}>
                  {body.name}
                </text>
                <text x={cx} y={cy + r + 24} fill="rgba(255,255,255,0.5)" fontSize="6.5" textAnchor="middle">
                  {ratioVal}×
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="scale-summary-footer font-mono">
        <span>Selected Radius: <strong className="text-cyan">{formatKm(selectedRadius, 0)}</strong></span>
        <span>Ratio to Earth: <strong className="text-amber">{(selectedRadius / 6371).toFixed(2)}×</strong></span>
        <span>Ratio to Sun: <strong className="text-green">{(selectedRadius / 696340).toFixed(4)}×</strong></span>
      </div>
    </div>
  );
}


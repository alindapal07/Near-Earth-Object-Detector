import React, { useState } from 'react';
import { PLANETARY_DETAILS } from '../../data/planetaryDetails';

/**
 * InteriorStructureView.jsx - Interactive Layered Planetary Cutaway Diagram
 * Renders core, mantle, cloud deck, and crust layers with hover details and temperature profiles.
 */
export default function InteriorStructureView({ obj }) {
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  const key = (obj?.id || '').toLowerCase();
  const details = PLANETARY_DETAILS[key] || PLANETARY_DETAILS['saturn'];
  const layers = details?.interior || [];

  if (layers.length === 0) return null;
  const currentLayer = layers[activeLayerIndex] || layers[0];

  return (
    <div className="sci-widget interior-structure-widget">
      <div className="widget-title font-mono" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>INTERIOR GEOLOGY & STRUCTURAL CUTAWAY</span>
        <span className="cutaway-tag">{layers.length} LAYERS IDENTIFIED</span>
      </div>

      <div className="interior-flex-container">
        {/* SVG Concentric Cutaway Circle */}
        <div className="interior-svg-wrap">
          <svg viewBox="0 0 160 160" className="interior-svg">
            <defs>
              <filter id="layerGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Concentric Layer Rings */}
            {layers.map((layer, index) => {
              const radius = 70 - index * (60 / layers.length);
              const isSelected = activeLayerIndex === index;

              return (
                <circle
                  key={layer.name}
                  cx="80"
                  cy="80"
                  r={Math.max(8, radius)}
                  fill={layer.color || '#00f0ff'}
                  fillOpacity={isSelected ? 0.9 : 0.45}
                  stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSelected ? '2' : '1'}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => setActiveLayerIndex(index)}
                  onMouseEnter={() => setActiveLayerIndex(index)}
                  filter={isSelected ? 'url(#layerGlow)' : undefined}
                />
              );
            })}

            {/* Core Center Icon */}
            <circle cx="80" cy="80" r="4" fill="#ffffff" />
          </svg>
        </div>

        {/* Selected Layer Info Card */}
        <div className="interior-details-box font-mono">
          <div className="layer-header" style={{ color: currentLayer.color || 'var(--primary-color)' }}>
            <span className="layer-num">LAYER {activeLayerIndex + 1} OF {layers.length}:</span>
            <span className="layer-name">{currentLayer.name.toUpperCase()}</span>
          </div>

          <div className="layer-metrics-grid">
            <div className="l-metric">
              <span className="l-lbl">DEPTH RANGE</span>
              <span className="l-val">{currentLayer.depthKm}</span>
            </div>
            <div className="l-metric">
              <span className="l-lbl">TEMPERATURE</span>
              <span className="l-val">{currentLayer.tempK}</span>
            </div>
          </div>

          <div className="layer-desc font-mono">
            {currentLayer.desc}
          </div>

          {/* Layer Selection Chips */}
          <div className="layer-chips-row">
            {layers.map((l, idx) => (
              <button
                key={l.name}
                type="button"
                className={`layer-chip ${activeLayerIndex === idx ? 'layer-chip--active' : ''}`}
                onClick={() => setActiveLayerIndex(idx)}
                style={{ borderColor: l.color }}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

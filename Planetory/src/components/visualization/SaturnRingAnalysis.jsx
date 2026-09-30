import React, { useState } from 'react';
import { PLANETARY_DETAILS } from '../../data/planetaryDetails';

/**
 * SaturnRingAnalysis.jsx - Saturn Ring System & Gap Analyzer
 * Displays main rings (D, C, B, A, F, E), Cassini Division, Encke gap,
 * particle size distributions, ice purity %, and interactive ring map.
 */
export default function SaturnRingAnalysis({ obj }) {
  const [selectedRingIndex, setSelectedRingIndex] = useState(2); // Default B ring

  if (obj?.id !== 'saturn') return null;

  const ringsData = PLANETARY_DETAILS.saturn.rings;
  const mainRings = ringsData.mainRings;
  const currentRing = mainRings[selectedRingIndex] || mainRings[0];

  return (
    <div className="sci-widget saturn-ring-widget">
      <div className="widget-title font-mono" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>SATURNIAN RING SYSTEM & DIVISION LAB</span>
        <span className="ring-span-badge">SPAN: {ringsData.totalSpanKm}</span>
      </div>

      <div className="ring-summary font-mono">
        <div className="r-summary-item">
          <span className="r-lbl">RING THICKNESS</span>
          <span className="r-val">{ringsData.thicknessMeters}</span>
        </div>
        <div className="r-summary-item">
          <span className="r-lbl">RING MASS</span>
          <span className="r-val">{ringsData.massKg}</span>
        </div>
        <div className="r-summary-item">
          <span className="r-lbl">COMPOSITION</span>
          <span className="r-val">{ringsData.composition}</span>
        </div>
      </div>

      {/* SVG Interactive Ring Structure Map */}
      <div className="ring-map-wrap">
        <svg viewBox="0 0 320 100" className="ring-svg">
          {/* Central Saturn Planet Edge */}
          <rect x="0" y="0" width="30" height="100" fill="#d97706" opacity="0.8" />
          <text x="15" y="55" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono" transform="rotate(-90 15 55)">
            SATURN
          </text>

          {/* Concentric Ring Bands */}
          {mainRings.map((ring, idx) => {
            const x1 = 35 + idx * 38;
            const width = 34;
            const isSelected = selectedRingIndex === idx;
            const isGap = ring.name.includes('Division') || ring.name.includes('Gap');

            return (
              <g key={ring.name} style={{ cursor: 'pointer' }} onClick={() => setSelectedRingIndex(idx)} onMouseEnter={() => setSelectedRingIndex(idx)}>
                <rect 
                  x={x1} y="15" width={width} height="70" 
                  fill={isGap ? 'rgba(0,0,0,0.8)' : isSelected ? 'rgba(0, 240, 255, 0.4)' : 'rgba(251, 191, 36, 0.25)'}
                  stroke={isSelected ? '#00f0ff' : isGap ? '#ff3d00' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isSelected ? '2' : '1'}
                  rx="3"
                />
                <text x={x1 + width / 2} y="55" fill={isSelected ? '#00f0ff' : '#ffffff'} fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">
                  {ring.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Ring Details Card */}
      <div className="ring-details-card font-mono">
        <div className="ring-card-header">
          <span className="r-title">{currentRing.name.toUpperCase()}</span>
          <span className="r-range">{currentRing.innerRadiusKm.toLocaleString()} - {currentRing.outerRadiusKm.toLocaleString()} km</span>
        </div>
        <div className="ring-card-desc">
          {currentRing.desc}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { PLANETARY_DETAILS } from '../../data/planetaryDetails';

/**
 * JupiterStormAnalysis.jsx - Great Red Spot & Jovian Atmospheric Zone Analyzer
 * Displays Great Red Spot dimensions, 640 km/h wind speeds, latitude, and cloud band zones.
 */
export default function JupiterStormAnalysis({ obj }) {
  if (obj?.id !== 'jupiter') return null;

  const storm = PLANETARY_DETAILS.jupiter.storm;

  return (
    <div className="sci-widget jupiter-storm-widget font-mono">
      <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>GREAT RED SPOT & JOVIAN STORM LAB</span>
        <span className="storm-tag">ANTICYCLONIC VORTEX</span>
      </div>

      <div className="storm-hero-box font-mono">
        <div className="storm-icon-wrap">
          <span className="storm-red-dot">🔴</span>
        </div>
        <div className="storm-main-info">
          <div className="storm-name">{storm.name.toUpperCase()}</div>
          <div className="storm-sub">
            Diameter: {storm.diameterKm.toLocaleString()} km (1.3× Earth) • Winds: {storm.windSpeedKmH} km/h
          </div>
          <div className="storm-meta">
            Latitude: {storm.latitude} • Observed Duration: {storm.ageYears}
          </div>
        </div>
      </div>

      <div className="storm-desc">
        {storm.desc} Super-rotating atmospheric jet streams drive opposing equatorial belts (dark) and zones (light).
      </div>
    </div>
  );
}

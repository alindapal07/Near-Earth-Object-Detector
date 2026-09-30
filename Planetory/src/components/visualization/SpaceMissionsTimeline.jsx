import React from 'react';
import { SPACECRAFT_MISSIONS } from '../../data/spacecraftMissions';
import { PLANETARY_DETAILS } from '../../data/planetaryDetails';

/**
 * SpaceMissionsTimeline.jsx - Historic & Active Mission Timeline Console
 * Displays flyby, orbiter, lander, and future mission profiles with launch dates and status.
 */
export default function SpaceMissionsTimeline({ obj }) {
  const targetName = (obj?.name || obj?.id || '').toLowerCase();
  const details = PLANETARY_DETAILS[targetName];
  const planetMissions = details?.missions || [];

  // Filter missions matching planet from SPACECRAFT_MISSIONS catalog
  const matchingCatalogMissions = SPACECRAFT_MISSIONS.filter(m => 
    m.target.toLowerCase().includes(targetName) ||
    m.description.toLowerCase().includes(targetName) ||
    (m.id === 'cassini' && targetName === 'saturn') ||
    (m.id === 'jwst' && targetName === 'earth')
  );

  return (
    <div className="sci-widget space-missions-widget">
      <div className="widget-title font-mono" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>EXPLORATION MISSIONS & HISTORIC TIMELINE</span>
        <span className="mission-count-badge font-mono">{planetMissions.length + matchingCatalogMissions.length} MISSIONS</span>
      </div>

      {planetMissions.length > 0 && (
        <div className="planet-missions-grid font-mono">
          {planetMissions.map((m, idx) => (
            <div key={idx} className="p-mission-card">
              <div className="m-card-header">
                <span className="m-name">{m.name.toUpperCase()} ({m.year})</span>
                <span className="m-agency">{m.agency}</span>
              </div>
              <div className="m-type-tag">{m.type}</div>
              <div className="m-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      )}

      {matchingCatalogMissions.length > 0 && (
        <div className="catalog-missions-list font-mono" style={{ marginTop: '8px' }}>
          <div className="c-list-header">DEEP SPACE TELEMETRY CATALOAD:</div>
          {matchingCatalogMissions.map(m => (
            <div key={m.id} className="catalog-mission-row">
              <div className="c-m-info">
                <span className="c-m-name">{m.name}</span>
                <span className="c-m-status">{m.status}</span>
              </div>
              <div className="c-m-desc">{m.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MissionTelemetryPanel.jsx - Spacecraft Mission & Telemetry HUD Panel
 * Displays active mission telemetry, relative motion analytics, data provenance, and timeline events.
 */

import React from 'react';
import MissionEngine from '../engine/MissionEngine';
import { formatSimulationDate, j2000DaysToDate } from '../utils/dateUtils';

export default function MissionTelemetryPanel({
  spacecraftId,
  simTimeDays,
  onClose,
  onSeekToDate,
  onSelectTarget
}) {
  const mission = MissionEngine.getSpacecraft(spacecraftId);
  const state = MissionEngine.getSpacecraftState(spacecraftId, simTimeDays);
  const analytics = MissionEngine.calculateRelativeAnalytics(spacecraftId, 'mars', simTimeDays);

  if (!mission || !state) return null;

  const provenance = state.getProvenanceBadge();

  return (
    <div 
      className="object-intelligence-panel mission-telemetry-panel"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <div className="panel-micro-tag">SPACECRAFT TELEMETRY</div>
          <h2 className="panel-title">{mission.name}</h2>
          <div className="panel-subtitle">{mission.category} • {mission.operator}</div>
        </div>
        <button className="panel-close-btn" onClick={onClose} title="Close Panel (Esc)">✕</button>
      </div>

      {/* Provenance Badge (Req 3, 27) */}
      <div className="telemetry-provenance-bar" style={{ borderColor: provenance.color }}>
        <span className="prov-dot" style={{ background: provenance.color }} />
        <span className="prov-label">DATA SOURCE: {provenance.label}</span>
        <span className="prov-precision">{state.precision} PRECISION</span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="panel-section">
        <h3 className="section-title">FLIGHT DYNAMICS</h3>
        
        <div className="telemetry-row">
          <span className="t-lbl">STATUS</span>
          <span className="t-val t-val--highlight">{mission.status}</span>
        </div>

        <div className="telemetry-row">
          <span className="t-lbl">TARGET</span>
          <span className="t-val">{mission.target}</span>
        </div>

        <div className="telemetry-row">
          <span className="t-lbl">DIST FROM SUN</span>
          <span className="t-val">{state.getDistance().toFixed(2)} AU</span>
        </div>

        <div className="telemetry-row">
          <span className="t-lbl">ORBITAL SPEED</span>
          <span className="t-val">{state.getSpeed().toFixed(2)} km/s</span>
        </div>

        {analytics && (
          <>
            <div className="telemetry-row">
              <span className="t-lbl">DIST TO MARS</span>
              <span className="t-val">{analytics.distanceAu.toFixed(3)} AU ({(analytics.distanceKm / 1e6).toFixed(1)}M km)</span>
            </div>

            <div className="telemetry-row">
              <span className="t-lbl">CLOSING SPEED</span>
              <span className="t-val">{analytics.closingVelocityKmS.toFixed(2)} km/s</span>
            </div>
          </>
        )}
      </div>

      {/* Mission Description */}
      <div className="panel-section">
        <h3 className="section-title">MISSION OVERVIEW</h3>
        <p className="mission-desc-text">{mission.description}</p>
      </div>

      {/* Mission Events Timeline (Req 16, 22) */}
      {mission.events && mission.events.length > 0 && (
        <div className="panel-section">
          <h3 className="section-title">MISSION TIMELINE EVENTS</h3>
          <div className="mission-events-list">
            {mission.events.map((evt, idx) => (
              <div 
                key={idx} 
                className="mission-event-card"
                onClick={() => onSeekToDate && onSeekToDate(new Date(evt.date))}
                title={`Seek timeline to ${evt.date}`}
              >
                <div className="evt-header">
                  <span className="evt-type">{evt.type}</span>
                  <span className="evt-date">{evt.date}</span>
                </div>
                <div className="evt-title">{evt.title}</div>
                <div className="evt-desc">{evt.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

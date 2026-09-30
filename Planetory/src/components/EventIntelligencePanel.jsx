import React from 'react';
import { formatSimulationDate, j2000DaysToDate } from '../utils/dateUtils';

/**
 * Astronomical Event Intelligence Panel (PART 8, Req 14, 31, 32)
 */
export default function EventIntelligencePanel({ eventData, onSeekToEvent, onClose }) {
  if (!eventData) return null;

  const evDate = eventData.date || j2000DaysToDate(eventData.simTimeDays);

  return (
    <div className="asteroid-detail-panel event-intelligence-panel">
      <div className="adp-header">
        <div>
          <h2 className="adp-name">{eventData.name}</h2>
          <div className="adp-badges">
            <span className="badge badge--neo">{eventData.type || 'ASTRONOMICAL EVENT'}</span>
          </div>
        </div>
        <button className="adp-btn adp-btn--close" onClick={onClose}>✕</button>
      </div>

      <div className="adp-body">
        <div className="sci-widget">
          <div className="widget-title">EVENT TELEMETRY</div>
          
          <div className="detail-row">
            <span className="detail-label">EVENT DATE (UTC)</span>
            <span className="detail-value font-mono">{formatSimulationDate(evDate)}</span>
          </div>

          {eventData.duration && (
            <div className="detail-row">
              <span className="detail-label">DURATION</span>
              <span className="detail-value">{eventData.duration}</span>
            </div>
          )}

          {eventData.targetObjId && (
            <div className="detail-row">
              <span className="detail-label">PRIMARY CELESTIAL BODY</span>
              <span className="detail-value">{eventData.targetObjId.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="sci-widget">
          <div className="widget-title">SCIENTIFIC DESCRIPTION</div>
          <p className="event-desc-text">{eventData.description}</p>
        </div>

        <button className="event-jump-btn" onClick={() => onSeekToEvent(eventData)}>
          ⚡ SEEK TO EVENT TIME & FOCUS SCENE
        </button>
      </div>
    </div>
  );
}

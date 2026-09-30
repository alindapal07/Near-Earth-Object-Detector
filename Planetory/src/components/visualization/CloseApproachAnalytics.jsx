import React from 'react';
import { formatKm, formatAU } from '../../utils/formatters';

/**
 * Close Approach Analytics & Hazard Assessment Component
 * Displays authoritative NEO close approach telemetry, relative velocity,
 * lunar distance comparison, and timeline.
 */
export default function CloseApproachAnalytics({ selectedObj }) {
  const closeApproachData = selectedObj?.closeApproachData || selectedObj?.close_approach_data?.[0] || null;
  const isPha = selectedObj?.pha || selectedObj?.is_potentially_hazardous_asteroid;

  if (!closeApproachData && !selectedObj?.neo) {
    return null;
  }

  const dateStr = closeApproachData?.close_approach_date_full || closeApproachData?.close_approach_date || 'Known Close Approach Event';
  const missDistKm = closeApproachData?.miss_distance?.kilometers ? Number(closeApproachData.miss_distance.kilometers) : null;
  const missDistAu = closeApproachData?.miss_distance?.astronomical ? Number(closeApproachData.miss_distance.astronomical) : null;
  const relVelKmS = closeApproachData?.relative_velocity?.kilometers_per_second ? Number(closeApproachData.relative_velocity.kilometers_per_second) : null;

  // Comparison with Lunar Distance (1 LD = 384,400 km)
  const lunarDistanceKm = 384400;
  const ldRatio = missDistKm ? (missDistKm / lunarDistanceKm).toFixed(1) : null;

  return (
    <div className={`sci-widget close-approach-widget ${isPha ? 'widget--pha' : ''}`}>
      <div className="widget-title">
        <span>CLOSE APPROACH ANALYTICS</span>
        {isPha ? (
          <span className="pha-hazard-tag">⚠ POTENTIALLY HAZARDOUS OBJECT (PHA)</span>
        ) : (
          <span className="neo-tag">NEAR-EARTH OBJECT (NEO)</span>
        )}
      </div>

      <div className="ca-grid">
        <div className="ca-card">
          <span className="ca-lbl">CLOSEST APPROACH DATE</span>
          <span className="ca-val ca-val--highlight">{dateStr}</span>
        </div>

        <div className="ca-card">
          <span className="ca-lbl">MISS DISTANCE</span>
          <span className="ca-val">
            {missDistKm ? `${formatKm(missDistKm, 0)} (${ldRatio} LD)` : 'Authoritative Ephemeris Pending'}
          </span>
        </div>

        <div className="ca-card">
          <span className="ca-lbl">RELATIVE VELOCITY</span>
          <span className="ca-val">
            {relVelKmS ? `${relVelKmS.toFixed(2)} km/s (${(relVelKmS * 3600).toLocaleString()} km/h)` : 'N/A'}
          </span>
        </div>

        <div className="ca-card">
          <span className="ca-lbl">ORBIT CLASS</span>
          <span className="ca-val">{selectedObj?.orbitClass || 'Apollo / Aten / Amor Asteroid'}</span>
        </div>
      </div>

      {/* Lunar Distance Comparison Bar */}
      {missDistKm && (
        <div className="ca-distance-scale">
          <div className="ca-scale-header font-mono">
            <span>EARTH ●</span>
            <span>MOON (1 LD)</span>
            <span>NEO APPROACH ({ldRatio} LD)</span>
          </div>
          <div className="ca-scale-track">
            <div className="ca-earth-dot" style={{ left: '0%' }} />
            <div className="ca-moon-dot" style={{ left: '15%' }} />
            <div className="ca-neo-dot" style={{ left: `${Math.min(95, Math.max(25, (missDistKm / (lunarDistanceKm * 20)) * 100))}%` }} />
          </div>
        </div>
      )}

      {/* Past - Now - Future Timeline */}
      <div className="ca-timeline">
        <div className="timeline-item timeline-item--past">
          <span className="t-dot" />
          <span className="t-text">Discovery & Tracking</span>
        </div>
        <div className="timeline-item timeline-item--active">
          <span className="t-dot t-dot--active" />
          <span className="t-text">Closest Approach Phase</span>
        </div>
        <div className="timeline-item timeline-item--future">
          <span className="t-dot" />
          <span className="t-text">Outbound Heliocentric Trajectory</span>
        </div>
      </div>
    </div>
  );
}

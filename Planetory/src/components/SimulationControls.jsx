import React from 'react';
import { j2000DaysToDate, formatSimulationDate } from '../utils/dateUtils';

export default function SimulationControls({
  simTimeDays,
  isLive,
  isPaused,
  speedMultiplier,
  onToggleLive,
  onTogglePause,
  onSetSpeed,
  scaleMode,
  onSetScaleMode,
  showMoons,
  onToggleMoons,
  onResetCamera
}) {
  const currentDate = j2000DaysToDate(simTimeDays);

  const forwardSpeeds = [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];

  const handleToggleReverse = () => {
    onSetSpeed(speedMultiplier > 0 ? -Math.abs(speedMultiplier) : Math.abs(speedMultiplier));
  };

  return (
    <div className="simulation-controls sci-sim-controls">
      <div className="time-display">
        <h3>SIMULATION TIME (UTC)</h3>
        <p>{formatSimulationDate(currentDate)}</p>
      </div>
      
      <div className="controls-row">
        <button 
          onClick={handleToggleReverse} 
          className={`control-btn ${speedMultiplier < 0 ? 'active-reverse' : ''}`}
          title="Reverse simulation direction"
        >
          {speedMultiplier < 0 ? '⏪ REVERSE' : '⏩ FORWARD'}
        </button>

        <button onClick={onTogglePause} className={`control-btn ${isPaused ? 'active' : ''}`}>
          {isPaused ? '▶ Play' : '⏸ Pause'}
        </button>
        
        <button onClick={onToggleLive} className={`control-btn live-btn ${isLive ? 'active-live' : ''}`}>
          🔴 LIVE
        </button>

        {onResetCamera && (
          <button onClick={onResetCamera} className="control-btn">
            🎥 RESET VIEW
          </button>
        )}
      </div>

      <div className="speed-controls">
        <span>Speed:</span>
        <select 
          className="sort-select"
          value={Math.abs(speedMultiplier)} 
          onChange={(e) => {
            const mag = Number(e.target.value);
            onSetSpeed(speedMultiplier < 0 ? -mag : mag);
          }}
        >
          {forwardSpeeds.map(s => (
            <option key={s} value={s}>
              {s.toLocaleString()}x {speedMultiplier < 0 ? '(Rev)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="scale-controls">
        <button 
          className={`scale-btn ${showMoons ? 'active-scale' : ''}`}
          onClick={() => onToggleMoons(!showMoons)}
        >
          {showMoons ? '🌙 Moons: ON' : '🌑 Moons: OFF'}
        </button>

        <button 
          className={`scale-btn ${scaleMode !== 'balanced' ? 'active-scale' : ''}`}
          onClick={() => {
            const modes = ['balanced', 'educational', 'true'];
            const next = modes[(modes.indexOf(scaleMode) + 1) % modes.length];
            onSetScaleMode(next);
          }}
          title="Toggle visualization scale mode (Balanced preserves size hierarchy, Educational boosts small objects, True is astronomically accurate)"
        >
          ⚖ {scaleMode === 'balanced' ? 'BALANCED' : scaleMode === 'educational' ? 'EDUCATIONAL' : 'TRUE SCALE'}
        </button>
      </div>
    </div>
  );
}


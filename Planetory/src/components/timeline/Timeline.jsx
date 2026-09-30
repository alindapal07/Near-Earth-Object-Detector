import React, { useState, useRef } from 'react';
import { j2000DaysToDate, getDaysSinceJ2000, formatSimulationDate } from '../../utils/dateUtils';
import { getEventsForYear } from '../../utils/eventEngine';
import DatePickerModal from './DatePickerModal';

/**
 * Interactive Visual Timeline & Time Navigation Component (PART 8, Req 10-14, 36-37)
 */
export default function Timeline({
  simTimeDays,
  onSeekToDays,
  onSeekToDate,
  onSyncToNow,
  onStepTime,
  isLive,
  isPaused,
  speedMultiplier,
  onTogglePause,
  onSetSpeed,
  onSelectEvent
}) {
  const [granularity, setGranularity] = useState('years'); // 'hours' | 'days' | 'months' | 'years' | 'decades'
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const currentDate = j2000DaysToDate(simTimeDays);
  const currentYear = currentDate.getUTCFullYear();

  // Range determination based on granularity
  let rangeDays = 365.25 * 10; // Default 10 years
  if (granularity === 'hours') rangeDays = 2; // 48 hours
  else if (granularity === 'days') rangeDays = 30; // 30 days
  else if (granularity === 'months') rangeDays = 365.25; // 1 year
  else if (granularity === 'years') rangeDays = 365.25 * 10; // 10 years
  else if (granularity === 'decades') rangeDays = 365.25 * 100; // 100 years

  const minSimDays = simTimeDays - (rangeDays / 2);
  const maxSimDays = simTimeDays + (rangeDays / 2);

  // Fetch astronomical events in current time window
  const events = getEventsForYear(currentYear);

  // Handle click / drag along timeline scrubber bar
  const handleScrubberInteraction = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    const targetDays = minSimDays + ratio * (maxSimDays - minSimDays);
    onSeekToDays(targetDays);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleScrubberInteraction(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleScrubberInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="timeline-container">
      {/* Top Toolbar: Quick Step Navigation, Mode Buttons & Date Picker Launcher */}
      <div className="timeline-top-bar">
        <div className="timeline-nav-group">
          <button className="time-step-btn" onClick={() => onStepTime(-1, 'day')} title="Jump back 1 day">−1d</button>
          <button className="time-step-btn" onClick={() => onStepTime(-1, 'hour')} title="Jump back 1 hour">−1h</button>
          <button className="time-step-btn" onClick={() => onStepTime(-1, 'minute')} title="Jump back 1 minute">−1m</button>

          <button 
            className={`time-now-btn ${isLive ? 'time-now-btn--active' : ''}`}
            onClick={onSyncToNow}
            title="Set simulation time to current real UTC time (NOW)"
          >
            🔴 NOW
          </button>

          <button className="time-step-btn" onClick={() => onStepTime(1, 'minute')} title="Jump forward 1 minute">+1m</button>
          <button className="time-step-btn" onClick={() => onStepTime(1, 'hour')} title="Jump forward 1 hour">+1h</button>
          <button className="time-step-btn" onClick={() => onStepTime(1, 'day')} title="Jump forward 1 day">+1d</button>
        </div>

        {/* Current Date Readout */}
        <div className="timeline-date-readout">
          <span className="t-date-label">SIMULATION DATE (UTC):</span>
          <span className="t-date-val">{formatSimulationDate(currentDate)}</span>
        </div>

        {/* Granularity & Picker */}
        <div className="timeline-tools-group">
          <select 
            className="granularity-select" 
            value={granularity} 
            onChange={(e) => setGranularity(e.target.value)}
            title="Timeline Zoom Granularity"
          >
            <option value="hours">Zoom: Hours</option>
            <option value="days">Zoom: Days</option>
            <option value="months">Zoom: Months</option>
            <option value="years">Zoom: Years</option>
            <option value="decades">Zoom: Decades</option>
          </select>

          <button className="date-picker-trigger" onClick={() => setIsDatePickerOpen(true)}>
            📅 Date Picker
          </button>
        </div>
      </div>

      {/* Visual Timeline Scrubber Bar with Event Markers (Req 12-14) */}
      <div 
        className="timeline-track-wrap"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="timeline-track-bg">
          {/* Past / Future Divider Labels */}
          <span className="t-side-label t-side-label--left">PAST</span>
          <span className="t-side-label t-side-label--right">FUTURE</span>

          {/* Center Playhead Needle */}
          <div className="t-playhead" style={{ left: '50%' }}>
            <span className="t-playhead-tag">NOW SIM</span>
          </div>

          {/* Astronomical Event Markers on Timeline */}
          {events.map((ev) => {
            const evDays = ev.simTimeDays;
            if (evDays < minSimDays || evDays > maxSimDays) return null;
            const ratio = (evDays - minSimDays) / (maxSimDays - minSimDays);
            const leftPct = ratio * 100;

            const isEclipse = ev.type === 'SOLAR ECLIPSE' || ev.type === 'LUNAR ECLIPSE';

            return (
              <div 
                key={ev.id} 
                className={`t-event-marker ${isEclipse ? 't-event-marker--eclipse' : ''}`}
                style={{ left: `${leftPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeekToDays(ev.simTimeDays);
                  if (onSelectEvent) onSelectEvent(ev);
                }}
                title={`${ev.name} (${ev.dateStr || ''})`}
              >
                <span className="t-event-icon">{isEclipse ? '🌘' : '⭐'}</span>
                <span className="t-event-tooltip">{ev.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scientific Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        currentSimTimeDays={simTimeDays}
        onSeekToDate={onSeekToDate}
      />
    </div>
  );
}

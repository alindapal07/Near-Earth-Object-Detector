import React, { useState } from 'react';
import { j2000DaysToDate, getDaysSinceJ2000, formatISOUTC } from '../../utils/dateUtils';

/**
 * Scientific Date & Time Picker Modal (PART 8, Req 8, 9)
 * Allows entering Year, Month, Day, Hour, Minute, Second in explicit UTC.
 */
export default function DatePickerModal({ isOpen, onClose, currentSimTimeDays, onSeekToDate }) {
  if (!isOpen) return null;

  const initialDate = j2000DaysToDate(currentSimTimeDays);

  const [year, setYear] = useState(initialDate.getUTCFullYear());
  const [month, setMonth] = useState(initialDate.getUTCMonth() + 1); // 1-12
  const [day, setDay] = useState(initialDate.getUTCDate());
  const [hour, setHour] = useState(initialDate.getUTCHours());
  const [minute, setMinute] = useState(initialDate.getUTCMinutes());
  const [second, setSecond] = useState(initialDate.getUTCSeconds());

  const handleApply = (e) => {
    e.preventDefault();
    const utcDate = new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ));

    if (!isNaN(utcDate.getTime())) {
      onSeekToDate(utcDate);
      onClose();
    }
  };

  const handleSetPreset = (targetDate) => {
    setYear(targetDate.getUTCFullYear());
    setMonth(targetDate.getUTCMonth() + 1);
    setDay(targetDate.getUTCDate());
    setHour(targetDate.getUTCHours());
    setMinute(targetDate.getUTCMinutes());
    setSecond(targetDate.getUTCSeconds());
  };

  return (
    <div className="modal-overlay date-modal-overlay">
      <div className="modal-content date-modal-content">
        <div className="modal-header">
          <h2>📅 SCIENTIFIC DATE & TIME PICKER (UTC)</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleApply} className="date-picker-form">
          <div className="date-inputs-grid">
            <div className="date-input-group">
              <label>YEAR</label>
              <input 
                type="number" 
                value={year} 
                onChange={(e) => setYear(e.target.value)} 
                min="-5000" 
                max="5000" 
                required 
              />
            </div>

            <div className="date-input-group">
              <label>MONTH</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                  <option key={m} value={i + 1}>{i + 1} - {m}</option>
                ))}
              </select>
            </div>

            <div className="date-input-group">
              <label>DAY</label>
              <input 
                type="number" 
                value={day} 
                onChange={(e) => setDay(e.target.value)} 
                min="1" 
                max="31" 
                required 
              />
            </div>

            <div className="date-input-group">
              <label>HOUR (UTC)</label>
              <input 
                type="number" 
                value={hour} 
                onChange={(e) => setHour(e.target.value)} 
                min="0" 
                max="23" 
                required 
              />
            </div>

            <div className="date-input-group">
              <label>MINUTE</label>
              <input 
                type="number" 
                value={minute} 
                onChange={(e) => setMinute(e.target.value)} 
                min="0" 
                max="59" 
                required 
              />
            </div>

            <div className="date-input-group">
              <label>SECOND</label>
              <input 
                type="number" 
                value={second} 
                onChange={(e) => setSecond(e.target.value)} 
                min="0" 
                max="59" 
                required 
              />
            </div>
          </div>

          <div className="date-presets-row">
            <span className="preset-label">HISTORICAL & EVENT PRESETS:</span>
            <button type="button" className="preset-btn" onClick={() => handleSetPreset(new Date())}>
              Now (Real Time)
            </button>
            <button type="button" className="preset-btn" onClick={() => handleSetPreset(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)))}>
              J2000 Epoch (2000)
            </button>
            <button type="button" className="preset-btn" onClick={() => handleSetPreset(new Date(Date.UTC(2024, 3, 8, 18, 17, 0)))}>
              Solar Eclipse 2024
            </button>
            <button type="button" className="preset-btn" onClick={() => handleSetPreset(new Date(Date.UTC(2026, 7, 12, 17, 47, 0)))}>
              Solar Eclipse 2026
            </button>
            <button type="button" className="preset-btn" onClick={() => handleSetPreset(new Date(Date.UTC(2029, 3, 13, 21, 46, 0)))}>
              Apophis Approach 2029
            </button>
            <button type="button" className="preset-btn" onClick={() => handleSetPreset(new Date(Date.UTC(2061, 6, 28, 12, 0, 0)))}>
              Halley Comet 2061
            </button>
          </div>

          <div className="date-actions">
            <button type="submit" className="date-apply-btn">
              ⚡ SEEK TO SIMULATION TIME
            </button>
            <button type="button" className="date-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

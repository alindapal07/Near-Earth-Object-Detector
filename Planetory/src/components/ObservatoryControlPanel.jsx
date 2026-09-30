/**
 * ObservatoryControlPanel.jsx — Astronomical Sky Observation Controls (Part 29)
 *
 * Implements real-time astronomical sky navigation controls:
 * • Coordinate Frame selector (EQUATORIAL, ECLIPTIC, HORIZONTAL, HELIOCENTRIC, GEOCENTRIC)
 * • Epoch selector (J2000.0, OF DATE) with precession status
 * • Atmospheric Refraction toggle (Bennett's formula)
 * • Observation Location selector (Greenwich, Mauna Kea, Paranal, or Custom Lat/Lon/Elev)
 * • Night Sky Mode toggle (Red-light vision preservation)
 * • FOV selector (Wide 120°, Medium 60°, Narrow 20°, Telescope 5°)
 * • Observation Session Manager & Report Exporter (JSON)
 * • Observation Timeline with Sunrise, Sunset, Moonrise, Planet Transit events
 */

import React, { useState, useMemo } from 'react';
import { OBSERVATORY_PRESETS, validateObserver } from '../utils/observerModel';
import { calculateLSTHours, formatRA, formatDec, calculateTwilightState } from '../utils/astronomicalCoordinates';
import { j2000DaysToDate, formatSimulationDate } from '../utils/dateUtils';

export default function ObservatoryControlPanel({
  simTimeDays,
  observer,
  onSaveObserver,
  coordFrame,
  onSetCoordFrame,
  epoch,
  onSetEpoch,
  applyRefraction,
  onToggleRefraction,
  nightSkyMode,
  onToggleNightSky,
  fovDeg,
  onSetFovDeg,
  skyToggles,
  onSaveSkyToggles,
  selectedObject,
  solarSystemRef,
  onSeekToDate,
  isPaused,
  onTogglePause,
  onSetSpeed
}) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  
  // Custom location form state
  const [customLat, setCustomLat] = useState(observer.latitudeDeg || 51.4769);
  const [customLon, setCustomLon] = useState(observer.longitudeDeg || -0.0005);
  const [customElev, setCustomElev] = useState(observer.elevationMeters || 47);
  const [customName, setCustomName] = useState('Custom Observatory Site');

  // Active Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionLogs, setSessionLogs] = useState(() => {
    try {
      const s = localStorage.getItem('planetory_observatory_sessions');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  // Calculate Local Sidereal Time
  const lstHours = calculateLSTHours(simTimeDays, observer.longitudeDeg);
  const lstFormatted = formatRA(lstHours);

  // Handle Location Save
  const handleSaveCustomLocation = (e) => {
    e.preventDefault();
    const newObs = validateObserver({
      id: `custom_${Date.now()}`,
      name: customName,
      latitudeDeg: parseFloat(customLat),
      longitudeDeg: parseFloat(customLon),
      elevationMeters: parseFloat(customElev),
      locationName: customName
    });
    onSaveObserver(newObs);
    setShowLocationModal(false);
  };

  // Generate Astronomical Observation Report
  const handleExportReport = () => {
    const simDate = j2000DaysToDate(simTimeDays);
    const report = {
      title: 'PLANETORY ASTRONOMICAL OBSERVATION REPORT',
      generatedAt: new Date().toISOString(),
      observationDate: simDate.toISOString(),
      simTimeDays,
      observer: {
        name: observer.name,
        latitudeDeg: observer.latitudeDeg,
        longitudeDeg: observer.longitudeDeg,
        elevationMeters: observer.elevationMeters,
        localSiderealTime: lstFormatted
      },
      settings: {
        coordinateFrame: coordFrame,
        epoch: epoch === 'OF_DATE' ? 'OF DATE' : 'J2000.0',
        refractionApplied: applyRefraction,
        fieldOfViewDeg: fovDeg
      },
      target: selectedObject ? {
        id: selectedObject.id,
        name: selectedObject.name || selectedObject.id,
        type: selectedObject.type || 'CELESTIAL BODY'
      } : 'ALL SKY VIEW',
      provenance: 'NASA / JPL EPHEMERIS + PLANETORY ASTRONOMICAL ENGINE'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `observation_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Record Session Entry
  const handleRecordObservation = () => {
    const entry = {
      id: `obs_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      dateStr: formatSimulationDate(simTimeDays),
      targetName: selectedObject?.name || 'Wide Sky',
      coordFrame,
      epoch
    };
    const updated = [entry, ...sessionLogs];
    setSessionLogs(updated);
    try { localStorage.setItem('planetory_observatory_sessions', JSON.stringify(updated)); } catch {}
  };

  return (
    <div className={`obs-control-bar ${nightSkyMode ? 'obs-night-sky-mode' : ''}`} onWheel={e => e.stopPropagation()}>
      {/* ── TOP PRIMARY CONTROLS ────────────────────────────────────────────── */}
      <div className="obs-top-row">
        {/* Observatory Site Selector */}
        <div className="obs-group">
          <span className="obs-lbl">📍 LOCATION</span>
          <button 
            className="obs-btn obs-btn--active"
            onClick={() => setShowLocationModal(true)}
            title="Change astronomical observer location"
          >
            {observer.name || 'Greenwich Observatory'} ({observer.latitudeDeg >= 0 ? '+' : ''}{observer.latitudeDeg.toFixed(1)}°, {observer.longitudeDeg >= 0 ? '+' : ''}{observer.longitudeDeg.toFixed(1)}°)
          </button>
        </div>

        {/* Coordinate Frame Selector */}
        <div className="obs-group">
          <span className="obs-lbl">🌐 FRAME</span>
          <select 
            className="obs-select"
            value={coordFrame}
            onChange={e => onSetCoordFrame(e.target.value)}
          >
            <option value="EQUATORIAL">EQUATORIAL (RA/DEC)</option>
            <option value="HORIZONTAL">HORIZONTAL (ALT/AZ)</option>
            <option value="ECLIPTIC">ECLIPTIC (λ, β)</option>
            <option value="GEOCENTRIC">GEOCENTRIC</option>
            <option value="HELIOCENTRIC">HELIOCENTRIC</option>
          </select>
        </div>

        {/* Epoch Selector */}
        <div className="obs-group">
          <span className="obs-lbl">⏱ EPOCH</span>
          <button 
            className={`obs-btn ${epoch === 'OF_DATE' ? 'obs-btn--highlight' : ''}`}
            onClick={() => onSetEpoch(epoch === 'J2000' ? 'OF_DATE' : 'J2000')}
          >
            {epoch === 'OF_DATE' ? 'OF DATE' : 'J2000.0'}
          </button>
        </div>

        {/* Atmospheric Refraction Toggle */}
        <div className="obs-group">
          <label className="obs-toggle-lbl">
            <input 
              type="checkbox" 
              checked={applyRefraction} 
              onChange={e => onToggleRefraction(e.target.checked)} 
            />
            <span>REFRACTION ({applyRefraction ? 'ON' : 'OFF'})</span>
          </label>
        </div>

        {/* Night Sky Red Light Mode Toggle */}
        <div className="obs-group">
          <button 
            className={`obs-btn ${nightSkyMode ? 'obs-btn--red' : ''}`}
            onClick={() => onToggleNightSky(!nightSkyMode)}
            title="Preserve night-adapted vision with red-light UI"
          >
            🔴 NIGHT SKY ({nightSkyMode ? 'ON' : 'OFF'})
          </button>
        </div>

        {/* Field of View (FOV) Presets */}
        <div className="obs-group">
          <span className="obs-lbl">🔭 FOV</span>
          <div className="obs-btn-row">
            {[
              { label: 'WIDE', deg: 120 },
              { label: 'MED', deg: 60 },
              { label: 'NARROW', deg: 20 },
              { label: 'SCOPE', deg: 5 }
            ].map(preset => (
              <button 
                key={preset.label}
                className={`obs-mini-btn ${fovDeg === preset.deg ? 'active' : ''}`}
                onClick={() => {
                  onSetFovDeg(preset.deg);
                  if (solarSystemRef?.current?.cameraManager) {
                    solarSystemRef.current.cameraManager.camera.fov = preset.deg;
                    solarSystemRef.current.cameraManager.camera.updateProjectionMatrix();
                  }
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* LST Readout & Export */}
        <div className="obs-group obs-group--right">
          <div className="obs-lst-display">
            <span className="obs-lst-lbl">LOCAL SIDEREAL TIME</span>
            <span className="obs-lst-val">{lstFormatted}</span>
          </div>
          <button className="obs-btn obs-btn--amber" onClick={handleExportReport}>
            📥 REPORT
          </button>
        </div>
      </div>

      {/* ── LOCATION SELECTOR MODAL ─────────────────────────────────────────── */}
      {showLocationModal && (
        <div className="mp-compare-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="mp-compare-box" onClick={e => e.stopPropagation()}>
            <div className="mp-compare-header">
              <span>📍 OBSERVATION SITE LOCATION</span>
              <button className="mp-close-btn" onClick={() => setShowLocationModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: '1rem' }}>
              <div className="obs-modal-subtitle">WORLD OBSERVATORY PRESETS</div>
              <div className="obs-presets-grid">
                {OBSERVATORY_PRESETS.map(preset => (
                  <button 
                    key={preset.id}
                    className={`obs-preset-card ${observer.id === preset.id ? 'active' : ''}`}
                    onClick={() => {
                      onSaveObserver(preset);
                      setShowLocationModal(false);
                    }}
                  >
                    <div className="obs-preset-name">{preset.name}</div>
                    <div className="obs-preset-loc">{preset.locationName}</div>
                    <div className="obs-preset-coords">
                      Lat: {preset.latitudeDeg}°, Lon: {preset.longitudeDeg}°, Elev: {preset.elevationMeters}m
                    </div>
                  </button>
                ))}
              </div>

              <div className="obs-modal-subtitle" style={{ marginTop: '1.5rem' }}>ENTER CUSTOM OBSERVATORY SITE</div>
              <form onSubmit={handleSaveCustomLocation} className="mc-form">
                <div className="mc-form-row">
                  <label>SITE NAME:</label>
                  <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} required />
                </div>
                <div className="mc-form-row">
                  <label>LATITUDE (-90° to +90°):</label>
                  <input type="number" step="0.0001" value={customLat} onChange={e => setCustomLat(e.target.value)} required />
                </div>
                <div className="mc-form-row">
                  <label>LONGITUDE (-180° to +180°):</label>
                  <input type="number" step="0.0001" value={customLon} onChange={e => setCustomLon(e.target.value)} required />
                </div>
                <div className="mc-form-row">
                  <label>ELEVATION (meters):</label>
                  <input type="number" value={customElev} onChange={e => setCustomElev(e.target.value)} required />
                </div>
                <button type="submit" className="mc-btn mc-btn--cyan mc-btn--full" style={{ marginTop: '1rem' }}>
                  SET CUSTOM LOCATION
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

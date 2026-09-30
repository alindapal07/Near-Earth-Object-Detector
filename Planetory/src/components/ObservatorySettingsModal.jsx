import React, { useState } from 'react';
import { OBSERVATORY_PRESETS, validateObserver } from '../utils/observerModel.js';

/**
 * Observatory Settings & Location Configuration Modal (PART 9, Req 4, 5, 6, 62)
 */
export default function ObservatorySettingsModal({ 
  isOpen, 
  onClose, 
  observer, 
  onUpdateObserver,
  showConstellations,
  onToggleConstellations,
  showSkyGrid,
  onToggleSkyGrid
}) {
  if (!isOpen) return null;

  const [lat, setLat] = useState(observer.latitudeDeg);
  const [lon, setLon] = useState(observer.longitudeDeg);
  const [elev, setElev] = useState(observer.elevationMeters);
  const [name, setName] = useState(observer.name);
  const [selectedPresetId, setSelectedPresetId] = useState(observer.id || 'custom');

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setLat(preset.latitudeDeg);
    setLon(preset.longitudeDeg);
    setElev(preset.elevationMeters);
    setName(preset.name);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updated = validateObserver({
      id: selectedPresetId,
      name,
      latitudeDeg: Number(lat),
      longitudeDeg: Number(lon),
      elevationMeters: Number(elev),
      timezone: 'UTC'
    });
    onUpdateObserver(updated);
    onClose();
  };

  return (
    <div className="modal-overlay obs-modal-overlay">
      <div className="modal-content obs-modal-content">
        <div className="modal-header">
          <h2>🔭 OBSERVATORY LOCATION & SKY SETTINGS</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="obs-settings-form">
          {/* Preset Location Selector */}
          <div className="obs-preset-section">
            <label className="obs-label">SELECT OBSERVATORY PRESET:</label>
            <div className="preset-grid">
              {OBSERVATORY_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset.id}
                  className={`obs-preset-card ${selectedPresetId === preset.id ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-sub">{preset.locationName}</div>
                  <div className="preset-coords">
                    {preset.latitudeDeg >= 0 ? `${preset.latitudeDeg.toFixed(2)}° N` : `${Math.abs(preset.latitudeDeg).toFixed(2)}° S`}, {' '}
                    {preset.longitudeDeg >= 0 ? `${preset.longitudeDeg.toFixed(2)}° E` : `${Math.abs(preset.longitudeDeg).toFixed(2)}° W`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Coordinate Input */}
          <div className="obs-inputs-grid">
            <div className="obs-input-group">
              <label>OBSERVATORY NAME</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => { setName(e.target.value); setSelectedPresetId('custom'); }} 
                required 
              />
            </div>

            <div className="obs-input-group">
              <label>LATITUDE (-90° to +90°)</label>
              <input 
                type="number" 
                step="0.0001" 
                value={lat} 
                onChange={(e) => { setLat(e.target.value); setSelectedPresetId('custom'); }} 
                min="-90" 
                max="90" 
                required 
              />
            </div>

            <div className="obs-input-group">
              <label>LONGITUDE (-180° to +180°)</label>
              <input 
                type="number" 
                step="0.0001" 
                value={lon} 
                onChange={(e) => { setLon(e.target.value); setSelectedPresetId('custom'); }} 
                min="-180" 
                max="180" 
                required 
              />
            </div>

            <div className="obs-input-group">
              <label>ELEVATION (meters)</label>
              <input 
                type="number" 
                value={elev} 
                onChange={(e) => { setElev(e.target.value); setSelectedPresetId('custom'); }} 
                min="0" 
                max="10000" 
              />
            </div>
          </div>

          {/* Sky Layer Toggles */}
          <div className="obs-toggles-section">
            <label className="obs-label">CELESTIAL SKY OVERLAYS:</label>
            <div className="obs-toggle-row" onClick={() => onToggleConstellations(!showConstellations)}>
              <span>✨ Constellation Lines & Names</span>
              <span className="toggle-badge">{showConstellations ? 'ON' : 'OFF'}</span>
            </div>
            <div className="obs-toggle-row" onClick={() => onToggleSkyGrid(!showSkyGrid)}>
              <span>🌐 Ecliptic & Sky Coordinate Grids</span>
              <span className="toggle-badge">{showSkyGrid ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          <div className="obs-actions">
            <button type="submit" className="obs-save-btn">
              ✓ APPLY OBSERVATORY LOCATION
            </button>
            <button type="button" className="obs-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

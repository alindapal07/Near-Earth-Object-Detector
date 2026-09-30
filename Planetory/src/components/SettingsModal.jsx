import React, { useState } from 'react';

export default function SettingsModal({
  isOpen,
  onClose,
  scaleMode,
  onSetScaleMode,
  showOrbitLines,
  onToggleOrbitLines,
  showMoons,
  onToggleMoons,
  showStars,
  onToggleStars,
  showVectors,
  onToggleVectors,
  showTrails,
  onToggleTrails,
  skyToggles,
  onSaveSkyToggles
}) {
  const [activeTab, setActiveTab] = useState('display');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container settings-modal sci-modal-v11" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>⚙️ SIMULATOR CONFIGURATION CONSOLE</h2>
            <span className="adp-source font-mono">SYSTEM PARAMETERS & RENDER OVERLAYS</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="adp-tabs" style={{ padding: '8px 24px 0 24px' }}>
          <button
            className={`tab-btn ${activeTab === 'display' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('display')}
          >
            DISPLAY & HUD
          </button>
          <button
            className={`tab-btn ${activeTab === 'hud' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('hud')}
          >
            HUD LAYOUT & WORKSTATION
          </button>
          <button
            className={`tab-btn ${activeTab === 'scale' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('scale')}
          >
            SCALE & ORBITS
          </button>
          <button
            className={`tab-btn ${activeTab === 'astronomy' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('astronomy')}
          >
            OBSERVATORY SKY
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'display' && (
            <div className="settings-section">
              <h3 className="settings-title">3D TELEMETRY OVERLAYS & VECTORS</h3>
              <div className="toggle-list">
                <label className="toggle-row">
                  <span>🌌 Deep Space Star Field</span>
                  <input
                    type="checkbox"
                    checked={showStars}
                    onChange={e => onToggleStars(e.target.checked)}
                  />
                </label>

                <label className="toggle-row">
                  <span>↗ 3D Position & Velocity Vectors</span>
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={e => onToggleVectors && onToggleVectors(e.target.checked)}
                  />
                </label>

                <div className="toggle-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                  <span>🌀 Orbital Motion Trail Length</span>
                  <div className="mode-toggle-group" style={{ width: '100%', justifyContent: 'space-between' }}>
                    {['off', 'short', 'medium', 'long'].map(mode => (
                      <button
                        key={mode}
                        className={`mode-toggle-btn ${showTrails === mode ? 'active' : ''}`}
                        onClick={() => onToggleTrails && onToggleTrails(mode)}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hud' && (
            <div className="settings-section">
              <h3 className="settings-title">HUD WORKSTATION LAYOUT PROFILES</h3>
              <p className="settings-desc">Choose a predefined layout arrangement or drag panels into custom workstation docks:</p>

              <div className="scale-mode-selector">
                <button
                  className={`scale-option-btn ${skyToggles?.layoutProfile === 'DEFAULT' ? 'active' : ''}`}
                  onClick={() => skyToggles?.setLayoutProfile && skyToggles.setLayoutProfile('DEFAULT')}
                >
                  <span className="scale-name">DEFAULT LAYOUT (Alt+1)</span>
                  <span className="scale-sub">Clean professional arrangement, scene centered</span>
                </button>

                <button
                  className={`scale-option-btn ${skyToggles?.layoutProfile === 'COMPACT' ? 'active' : ''}`}
                  onClick={() => skyToggles?.setLayoutProfile && skyToggles.setLayoutProfile('COMPACT')}
                >
                  <span className="scale-name">COMPACT LAYOUT (Alt+2)</span>
                  <span className="scale-sub">Minimal panels, maximized 3D viewport</span>
                </button>

                <button
                  className={`scale-option-btn ${skyToggles?.layoutProfile === 'SCIENTIFIC' ? 'active' : ''}`}
                  onClick={() => skyToggles?.setLayoutProfile && skyToggles.setLayoutProfile('SCIENTIFIC')}
                >
                  <span className="scale-name">SCIENTIFIC WORKSTATION (Alt+3)</span>
                  <span className="scale-sub">All panels visible, telemetry & intelligence active</span>
                </button>

                <button
                  className={`scale-option-btn ${skyToggles?.layoutProfile === 'MISSION' ? 'active' : ''}`}
                  onClick={() => skyToggles?.setLayoutProfile && skyToggles.setLayoutProfile('MISSION')}
                >
                  <span className="scale-name">MISSION FLIGHT DECK (Alt+4)</span>
                  <span className="scale-sub">Docked panels optimized for trajectory & spacecraft telemetry</span>
                </button>
              </div>

              <h3 className="settings-title" style={{ marginTop: '16px' }}>WORKSTATION CONTROLS & RESET</h3>
              <div className="toggle-list" style={{ gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className={`mode-toggle-btn ${skyToggles?.isEditMode ? 'active' : ''}`}
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => skyToggles?.toggleEditMode && skyToggles.toggleEditMode()}
                  >
                    {skyToggles?.isEditMode ? '● EDIT LAYOUT ACTIVE' : '✏️ EDIT LAYOUT MODE'}
                  </button>

                  <button
                    className={`mode-toggle-btn ${skyToggles?.isLocked ? 'active' : ''}`}
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => skyToggles?.setHudLocked && skyToggles.setHudLocked(!skyToggles.isLocked)}
                  >
                    {skyToggles?.isLocked ? '🔒 HUD LOCKED' : '🔓 LOCK HUD PANELS'}
                  </button>
                </div>

                <button
                  className="reset-layout-btn"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 60, 60, 0.15)',
                    border: '1px solid rgba(255, 80, 80, 0.4)',
                    color: '#ff8888',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    letterSpacing: '0.05em'
                  }}
                  onClick={() => {
                    if (window.confirm('Reset all HUD panel positions, dock locations, and minimized states to default?')) {
                      skyToggles?.resetLayout && skyToggles.resetLayout();
                    }
                  }}
                >
                  ↺ RESET HUD LAYOUT TO DEFAULT
                </button>
              </div>
            </div>
          )}

          {activeTab === 'scale' && (
            <div className="settings-section">
              <h3 className="settings-title">VISUALIZATION SCALE MODE</h3>
              <p className="settings-desc">Controls body render sizes while preserving exact physical hierarchy:</p>

              <div className="scale-mode-selector">
                <button
                  className={`scale-option-btn ${scaleMode === 'balanced' ? 'active' : ''}`}
                  onClick={() => onSetScaleMode('balanced')}
                >
                  <span className="scale-name">BALANCED (Default)</span>
                  <span className="scale-sub">Scientific hierarchy, controlled gas giant sizes</span>
                </button>

                <button
                  className={`scale-option-btn ${scaleMode === 'educational' ? 'active' : ''}`}
                  onClick={() => onSetScaleMode('educational')}
                >
                  <span className="scale-name">EDUCATIONAL</span>
                  <span className="scale-sub">Power-law compression for maximum moon/asteroid visibility</span>
                </button>

                <button
                  className={`scale-option-btn ${scaleMode === 'true' ? 'active' : ''}`}
                  onClick={() => onSetScaleMode('true')}
                >
                  <span className="scale-name">TRUE SCALE</span>
                  <span className="scale-sub">Pure astronomical proportions (AU-based)</span>
                </button>
              </div>

              <h3 className="settings-title" style={{ marginTop: '16px' }}>ORBIT & SATELLITE TOGGLES</h3>
              <div className="toggle-list">
                <label className="toggle-row">
                  <span>⭕ Planetary Orbit Lines</span>
                  <input
                    type="checkbox"
                    checked={showOrbitLines}
                    onChange={e => onToggleOrbitLines(e.target.checked)}
                  />
                </label>

                <label className="toggle-row">
                  <span>🌙 Natural Satellites (Moons)</span>
                  <input
                    type="checkbox"
                    checked={showMoons}
                    onChange={e => onToggleMoons(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'astronomy' && (
            <div className="settings-section">
              <h3 className="settings-title">OBSERVATORY CELESTIAL OVERLAYS</h3>
              <div className="toggle-list">
                <label className="toggle-row">
                  <span>✨ Constellation Line Segments</span>
                  <input
                    type="checkbox"
                    checked={skyToggles?.showConstellations ?? true}
                    onChange={e => onSaveSkyToggles && onSaveSkyToggles({ ...skyToggles, showConstellations: e.target.checked })}
                  />
                </label>

                <label className="toggle-row">
                  <span>🌐 Celestial Grid & Ecliptic Path</span>
                  <input
                    type="checkbox"
                    checked={skyToggles?.showGrid ?? true}
                    onChange={e => onSaveSkyToggles && onSaveSkyToggles({ ...skyToggles, showGrid: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="settings-footer" style={{ marginTop: '20px' }}>
            <button className="apply-btn" onClick={onClose}>SAVE & RETURN TO SIMULATOR</button>
          </div>
        </div>
      </div>
    </div>
  );
}


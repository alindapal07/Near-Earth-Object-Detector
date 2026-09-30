import React, { useState, useRef, useEffect } from 'react';
import DataStatus from './DataStatus';
import { j2000DaysToDate, formatSimulationDate } from '../utils/dateUtils';

export default function TopHeader({ 
  simTimeDays,
  isPaused,
  isLive,
  speedMultiplier,
  isBackendOnline,
  neoCount,
  appMode = 'SOLAR_SYSTEM',
  observer,
  onModeChange,
  onOpenPlanner,
  onOpenObservatorySettings,
  onOpenFactory,
  onOpenEvents,
  onOpenSettings,
  onOpenShortcuts,
  onResetCamera,
  onToggleImmersive,
  onToggleFullscreen,
  onToggleSearch,
  isSearchOpen,
  isEditMode,
  isLocked,
  onToggleEditMode,
  onToggleLock,
  isEventsOpen,
  isFactoryOpen,
  onOpenNEO,
  isNEOExplorerOpen
}) {
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentDate = simTimeDays != null ? j2000DaysToDate(simTimeDays) : new Date();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getModeLabel = (mode) => {
    if (mode === 'SOLAR_SYSTEM') return ' SOLAR SYSTEM';
    if (mode === 'OBSERVATORY') return ' OBSERVATORY';
    if (mode === 'MISSION') return ' MISSION';
    return 'SOLAR SYSTEM';
  };

  return (
    <header className="top-header mission-control-header">
      {/* LEFT ZONE: Brand & Compact Status */}
      <div className="header-left-zone">
        <div className="brand-group">
          <h1 className="brand-title">N A S A</h1>
          <span className="brand-subtitle font-mono">CELESTIAL SIMULATOR</span>
        </div>

        <div className="header-status-strip font-mono" title="Current Simulation Status">
          <span className="status-dot-indicator" />
          <span className="h-stat-mode">{appMode.replace('_', ' ')}</span>
          <span className="h-stat-sep">•</span>
          <span className={`h-stat-state ${isPaused ? 'paused' : 'running'}`}>
            {isPaused ? 'PAUSED' : isLive ? 'LIVE' : 'RUNNING'}
          </span>
          <span className="h-stat-sep">•</span>
          <span className="h-stat-spd">{Math.abs(speedMultiplier)}×</span>
        </div>
      </div>

      {/* CENTER ZONE: Primary Mode Selector & Contextual Sub-actions */}
      <div className="header-center-zone" ref={dropdownRef}>
        <div className="mode-selector-wrap" style={{ display: 'flex', gap: '4px' }}>
          <button 
            className={`mode-opt-btn ${appMode === 'SOLAR_SYSTEM' ? 'active' : ''}`}
            onClick={() => onModeChange('SOLAR_SYSTEM')}
          >
             SOLAR SYSTEM
          </button>
          <button 
            className={`mode-opt-btn ${appMode === 'OBSERVATORY' ? 'active' : ''}`}
            onClick={() => onModeChange('OBSERVATORY')}
          >
             OBSERVATORY
          </button>
          <button 
            className={`mode-opt-btn ${appMode === 'MISSION' ? 'active' : ''}`}
            onClick={() => onModeChange('MISSION')}
          >
             MISSION
          </button>
          <button 
            className="mode-opt-btn"
            onClick={onOpenPlanner}
            title="Interplanetary Trajectory Planner"
          >
             PLANNING
          </button>
          <button 
            className={`mode-opt-btn ${isEventsOpen ? 'active' : ''}`}
            onClick={onOpenEvents}
            title="Celestial Events Center & Eclipse Simulator"
          >
             EVENTS
          </button>
          <button 
            className={`mode-opt-btn ${isFactoryOpen ? 'active' : ''}`}
            onClick={onOpenFactory}
            title="Space Data Factory & Central Scientific Hub"
          >
             DATA
          </button>
          <button
            className={`mode-opt-btn ${isNEOExplorerOpen ? 'active' : ''}`}
            onClick={onOpenNEO}
            title="NEO Intelligence System — Near-Earth Object Detection & Risk Analysis [N]"
          >
             NEO
          </button>
        </div>

        {/* Contextual Sub-Actions */}
        {appMode === 'OBSERVATORY' && (
          <button
            className="header-ctx-btn"
            onClick={onOpenObservatorySettings}
            title="Configure Observer Location & Sky Overlays"
          >
            📍 {observer?.name || 'Observatory'}
          </button>
        )}

        {appMode === 'MISSION' && (
          <button 
            className="header-ctx-btn"
            onClick={onOpenPlanner}
            title="Open Interplanetary Trajectory Planner"
          >
            🛰️ PLANNING
          </button>
        )}
      </div>

      {/* RIGHT ZONE: Compact Icon Actions */}
      <div className="header-right-zone">
        <button
          className={`header-icon-btn ${isEditMode ? 'active edit-active' : ''}`}
          onClick={onToggleEditMode}
          title={isEditMode ? 'Exit Edit Layout Mode (Ctrl+Shift+L)' : 'Enter Edit Layout Mode (Ctrl+Shift+L)'}
        >
          {isEditMode ? '✏️' : '📐'}
        </button>

        <button
          className={`header-icon-btn ${isLocked ? 'active locked-active' : ''}`}
          onClick={onToggleLock}
          title={isLocked ? 'Unlock HUD Panels' : 'Lock HUD Panels'}
        >
          {isLocked ? '🔒' : '🔓'}
        </button>

        <button 
          className={`header-icon-btn ${isSearchOpen ? 'active' : ''}`}
          onClick={onToggleSearch}
          title="Universal Celestial Search (Ctrl+K)"
        >
          🔍
        </button>

        <button 
          className="header-icon-btn"
          onClick={onResetCamera}
          title="Reset Camera Overview (R / Home)"
        >
          🌐
        </button>

        <button 
          className="header-icon-btn"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts Guide (?)"
        >
          ❓
        </button>

        <button 
          className="header-icon-btn"
          onClick={onToggleImmersive}
          title="Toggle Immersive HUD Mode (I)"
        >
          👁️
        </button>

        <button 
          className="header-icon-btn"
          onClick={onOpenSettings}
          title="Simulator Configuration & Settings (⚙️)"
        >
          ⚙️
        </button>

        <button 
          className="header-icon-btn"
          onClick={onToggleFullscreen}
          title="Toggle Browser Fullscreen (F11)"
        >
          ⛶
        </button>
      </div>
    </header>
  );
}

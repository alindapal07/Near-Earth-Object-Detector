import React, { useState, useRef, useEffect } from 'react';
import Timeline from './timeline/Timeline';
import { j2000DaysToDate, formatSimulationDate } from '../utils/dateUtils';
import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES } from '../data/satellites';

export default function FloatingBottomBar({
  isExpanded,
  onToggleExpanded,
  simTimeDays,
  isLive,
  isPaused,
  speedMultiplier,
  scaleMode,
  showMoons,
  showOrbitLines = true,
  onToggleOrbitLines,
  showVectors = false,
  onToggleVectors,
  showTrails = 'off',
  onToggleTrails,
  showStars = true,
  onToggleStars,
  appMode = 'SOLAR_SYSTEM',
  selectedObject,
  targetObject,
  catalog = [],
  isBackendOnline,
  neoCount,
  onToggleLive,
  onTogglePause,
  onSetSpeed,
  onSetScaleMode,
  onToggleMoons,
  onResetCamera,
  onSelectObject,
  onSelectTarget,
  seekToDays,
  seekToDate,
  syncToNow,
  stepTime,
  onSelectEvent,
  onModeChange,
  onOpenFactory
}) {
  const [activePopover, setActivePopover] = useState(null);
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [targetCategory, setTargetCategory] = useState('ALL');
  const [targetSelectedIndex, setTargetSelectedIndex] = useState(0);
  const popoverRef = useRef(null);
  const targetInputRef = useRef(null);

  const currentDate = simTimeDays != null ? j2000DaysToDate(simTimeDays) : new Date();
  const speedPresets = [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];

  const ALIAS_MAP = {
    sol: 'sun',
    terra: 'earth',
    luna: 'moon',
    jovian: 'jupiter',
    kronos: 'saturn'
  };

  useEffect(() => {
    if (activePopover === 'target') {
      setTimeout(() => targetInputRef.current?.focus(), 50);
    }
  }, [activePopover]);

  const handleToggleReverse = () => {
    onSetSpeed(speedMultiplier > 0 ? -Math.abs(speedMultiplier) : Math.abs(speedMultiplier));
  };

  const togglePopover = (name) => {
    setActivePopover(prev => prev === name ? null : name);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeTargetName = targetObject 
    ? (targetObject.name || targetObject.id).toUpperCase() 
    : selectedObject 
    ? (selectedObject.name || selectedObject.id).toUpperCase() 
    : 'NONE';

  const planetsList = React.useMemo(() => {
    if (!PLANET_DATA) return [];
    return Array.isArray(PLANET_DATA) ? PLANET_DATA : Object.values(PLANET_DATA);
  }, []);

  const satellitesList = React.useMemo(() => {
    if (!NATURAL_SATELLITES) return [];
    return Array.isArray(NATURAL_SATELLITES) ? NATURAL_SATELLITES : Object.values(NATURAL_SATELLITES);
  }, []);

  const catalogList = React.useMemo(() => {
    if (!catalog) return [];
    return Array.isArray(catalog) ? catalog : Object.values(catalog);
  }, [catalog]);

  const allObjects = React.useMemo(() => {
    return [
      ...planetsList,
      ...satellitesList,
      ...catalogList
    ];
  }, [planetsList, satellitesList, catalogList]);

  const getObjectIcon = (item) => {
    const type = (item.type || item.category || '').toLowerCase();
    const id = (item.id || item.name || '').toLowerCase();
    if (id === 'sun') return '☀️';
    if (type.includes('planet')) return '🪐';
    if (type.includes('satellite') || type.includes('moon') || item.parentPlanet) return '🌕';
    if (type.includes('spacecraft') || type.includes('artificial')) return '🚀';
    if (type.includes('comet')) return '☄️';
    return '🪨';
  };

  const rankedTargets = React.useMemo(() => {
    let filtered = allObjects;

    if (targetCategory === 'PLANETS') {
      filtered = filtered.filter(o => o.type === 'Planet' || o.type === 'Dwarf Planet' || o.id === 'sun' || (o.category && o.category.includes('PLANET')));
    } else if (targetCategory === 'MOONS') {
      filtered = filtered.filter(o => o.type === 'Natural Satellite' || o.parentPlanet || o.category === 'NATURAL SATELLITE');
    } else if (targetCategory === 'SMALL BODIES') {
      filtered = filtered.filter(o => o.type === 'Asteroid' || o.type === 'Comet' || o.neo || o.spkid);
    } else if (targetCategory === 'SPACECRAFT') {
      filtered = filtered.filter(o => o.type === 'SPACECRAFT' || o.category === 'ARTIFICIAL SATELLITE' || o.noradId);
    }

    if (!targetSearchQuery.trim()) return filtered.slice(0, 30);

    const rawQ = targetSearchQuery.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedQ = ALIAS_MAP[rawQ] || rawQ;

    const scored = filtered.map(item => {
      const name = (item.name || item.id || '').toLowerCase();
      let score = 0;

      if (name === rawQ || name === normalizedQ) {
        score = 100;
      } else if (name.startsWith(rawQ) || name.startsWith(normalizedQ)) {
        score = 80;
      } else if (name.includes(` ${rawQ}`) || name.includes(` ${normalizedQ}`)) {
        score = 60;
      } else if (name.includes(rawQ) || name.includes(normalizedQ)) {
        score = 40;
      }

      return { item, score };
    }).filter(x => x.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map(x => x.item).slice(0, 30);
  }, [allObjects, targetCategory, targetSearchQuery]);

  const handleSelectTargetItem = (item) => {
    if (onSelectTarget) {
      onSelectTarget(item);
    } else if (onSelectObject) {
      onSelectObject(item);
    }
    setActivePopover(null);
  };

  const handleTargetKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTargetSelectedIndex(prev => (rankedTargets.length ? (prev + 1) % rankedTargets.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTargetSelectedIndex(prev => (rankedTargets.length ? (prev - 1 + rankedTargets.length) % rankedTargets.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rankedTargets[targetSelectedIndex]) {
        handleSelectTargetItem(rankedTargets[targetSelectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setActivePopover(null);
    }
  };

  return (
    <div 
      className={`floating-bottom-nav ${isExpanded ? 'floating-bottom-nav--expanded' : 'floating-bottom-nav--collapsed'}`}
      onWheel={(e) => e.stopPropagation()}
      ref={popoverRef}
    >
      {/* Popovers Area */}
      {activePopover === 'time' && (
        <div className="console-popover console-popover--time">
          <div className="popover-header">
            <h4>⏱️ SIMULATION TIME CONSOLE</h4>
            <button className="popover-close-btn" onClick={() => setActivePopover(null)}>✕</button>
          </div>

          <div className="popover-body">
            <div className="popover-date-readout font-mono">
              <span className="p-date-main">{formatSimulationDate(currentDate)}</span>
              <span className="p-jd-sub">JULIAN DATE: {(2451545.0 + simTimeDays).toFixed(2)}</span>
            </div>

            <div className="popover-btn-row">
              <button 
                className={`pop-btn ${speedMultiplier < 0 ? 'active-reverse' : ''}`}
                onClick={handleToggleReverse}
              >
                {speedMultiplier < 0 ? '⏪ REVERSE' : '⏩ FORWARD'}
              </button>
              <button 
                className={`pop-btn ${isPaused ? 'active-paused' : 'active-playing'}`}
                onClick={onTogglePause}
              >
                {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
              </button>
              <button 
                className={`pop-btn ${isLive ? 'active-live' : ''}`}
                onClick={onToggleLive}
              >
                {isLive ? '🔴 LIVE' : '🕒 SYNC LIVE'}
              </button>
            </div>

            <div className="popover-section">
              <label className="popover-label">SIMULATION SPEED MULTIPLIER</label>
              <div className="speed-pill-grid">
                {speedPresets.map(spd => (
                  <button
                    key={spd}
                    className={`spd-pill ${Math.abs(speedMultiplier) === spd ? 'active' : ''}`}
                    onClick={() => onSetSpeed(speedMultiplier < 0 ? -spd : spd)}
                  >
                    {spd >= 1000000 ? '1M×' : spd >= 1000 ? `${spd/1000}k×` : `${spd}×`}
                  </button>
                ))}
              </div>
            </div>

            <div className="popover-section">
              <label className="popover-label">QUICK TIME STEP</label>
              <div className="step-btn-grid font-mono">
                <button onClick={() => stepTime && stepTime(-1, 'day')}>-1d</button>
                <button onClick={() => stepTime && stepTime(-1, 'hour')}>-1h</button>
                <button onClick={() => stepTime && stepTime(-1, 'minute')}>-1m</button>
                <button onClick={() => stepTime && stepTime(1, 'minute')}>+1m</button>
                <button onClick={() => stepTime && stepTime(1, 'hour')}>+1h</button>
                <button onClick={() => stepTime && stepTime(1, 'day')}>+1d</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePopover === 'camera' && (
        <div className="console-popover console-popover--camera">
          <div className="popover-header">
            <h4>🎥 CAMERA CONTROLS</h4>
            <button className="popover-close-btn" onClick={() => setActivePopover(null)}>✕</button>
          </div>
          <div className="popover-body">
            <div className="popover-section">
              <label className="popover-label">CAMERA MODE</label>
              <div className="cam-mode-grid">
                <button 
                  className={`pop-btn ${appMode === 'SOLAR_SYSTEM' ? 'active' : ''}`}
                  onClick={() => onModeChange && onModeChange('SOLAR_SYSTEM')}
                >
                  ☀️ HELIOCENTRIC
                </button>
                <button 
                  className={`pop-btn ${appMode === 'OBSERVATORY' ? 'active' : ''}`}
                  onClick={() => onModeChange && onModeChange('OBSERVATORY')}
                >
                  🔭 OBSERVATORY
                </button>
                <button 
                  className={`pop-btn ${appMode === 'MISSION' ? 'active' : ''}`}
                  onClick={() => onModeChange && onModeChange('MISSION')}
                >
                  🚀 MISSION
                </button>
              </div>
            </div>

            <div className="popover-section">
              <button className="pop-action-btn" onClick={onResetCamera}>
                🌐 RESET CAMERA OVERVIEW (R)
              </button>
            </div>
          </div>
        </div>
      )}

      {activePopover === 'view' && (
        <div className="console-popover console-popover--view">
          <div className="popover-header">
            <h4>👁️ VISUALIZATION & OVERLAYS</h4>
            <button className="popover-close-btn" onClick={() => setActivePopover(null)}>✕</button>
          </div>
          <div className="popover-body">
            <div className="popover-section">
              <label className="popover-label">SCALE MODE</label>
              <div className="scale-mode-btns">
                <button 
                  className={`pop-btn ${scaleMode === 'balanced' ? 'active' : ''}`}
                  onClick={() => onSetScaleMode('balanced')}
                >
                  ⚖️ BALANCED
                </button>
                <button 
                  className={`pop-btn ${scaleMode === 'educational' ? 'active' : ''}`}
                  onClick={() => onSetScaleMode('educational')}
                >
                  🎓 EDUCATIONAL
                </button>
                <button 
                  className={`pop-btn ${scaleMode === 'true' ? 'active' : ''}`}
                  onClick={() => onSetScaleMode('true')}
                >
                  🔬 TRUE SCALE
                </button>
              </div>
            </div>

            <div className="popover-section">
              <label className="popover-label">RENDER OVERLAYS</label>
              <div className="toggle-grid">
                <label className="pop-toggle-row">
                  <span>🪐 Orbit Lines</span>
                  <input 
                    type="checkbox" 
                    checked={showOrbitLines} 
                    onChange={e => onToggleOrbitLines && onToggleOrbitLines(e.target.checked)} 
                  />
                </label>
                <label className="pop-toggle-row">
                  <span>🌙 Natural Moons</span>
                  <input 
                    type="checkbox" 
                    checked={showMoons} 
                    onChange={e => onToggleMoons && onToggleMoons(e.target.checked)} 
                  />
                </label>
                <label className="pop-toggle-row">
                  <span>🌌 Star Field</span>
                  <input 
                    type="checkbox" 
                    checked={showStars} 
                    onChange={e => onToggleStars && onToggleStars(e.target.checked)} 
                  />
                </label>
                <label className="pop-toggle-row">
                  <span>↗ 3D Velocity Vectors</span>
                  <input 
                    type="checkbox" 
                    checked={showVectors} 
                    onChange={e => onToggleVectors && onToggleVectors(e.target.checked)} 
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePopover === 'target' && (
        <div className="console-popover console-popover--target" onPointerDown={e => e.stopPropagation()}>
          <div className="popover-header">
            <h4>🎯 TARGET SELECTOR</h4>
            <button className="popover-close-btn" onClick={() => setActivePopover(null)}>✕</button>
          </div>
          <div className="popover-body">
            {/* Controlled Search Input with Event Isolation */}
            <div className="target-search-row">
              <input
                ref={targetInputRef}
                type="text"
                className="target-search-input"
                placeholder="🔍 Search target (e.g. Earth, Jupiter, Europa, Sol, Luna)..."
                value={targetSearchQuery}
                onChange={e => {
                  setTargetSearchQuery(e.target.value);
                  setTargetSelectedIndex(0);
                }}
                onKeyDown={handleTargetKeyDown}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
              />
              {targetSearchQuery && (
                <button 
                  className="target-search-clear" 
                  onClick={() => { setTargetSearchQuery(''); setTargetSelectedIndex(0); }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Compact Category Segmented Filter */}
            <div className="target-segmented-bar">
              {['ALL', 'PLANETS', 'MOONS', 'SMALL BODIES', 'SPACECRAFT'].map(cat => (
                <button
                  key={cat}
                  className={`target-seg-btn ${targetCategory === cat ? 'active' : ''}`}
                  onClick={() => { setTargetCategory(cat); setTargetSelectedIndex(0); }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Results List */}
            <div className="target-results-list font-mono">
              {rankedTargets.length > 0 ? (
                rankedTargets.map((item, idx) => {
                  const isHighlighted = idx === targetSelectedIndex;
                  const isCurrentTarget = (targetObject?.id === item.id) || (!targetObject && selectedObject?.id === item.id);
                  const icon = getObjectIcon(item);
                  const typeLabel = item.type || item.category || (item.parentPlanet ? `MOON (${item.parentPlanet})` : 'CELESTIAL BODY');

                  return (
                    <div
                      key={item.id || item.spkid || idx}
                      className={`target-result-row ${isHighlighted ? 'highlighted' : ''} ${isCurrentTarget ? 'active-target' : ''}`}
                      onClick={() => handleSelectTargetItem(item)}
                      onMouseEnter={() => setTargetSelectedIndex(idx)}
                    >
                      <span className="target-icon">{icon}</span>
                      <div className="target-name-wrap">
                        <span className="target-name-text">{item.name || item.id}</span>
                        {item.parentPlanet && <span className="target-parent-text"> ({item.parentPlanet})</span>}
                      </div>
                      <span className="target-badge">{typeLabel.toUpperCase()}</span>
                    </div>
                  );
                })
              ) : (
                /* Empty State (Req 12) */
                <div className="target-empty-state font-mono">
                  <p className="empty-title">NO CELESTIAL OBJECTS FOUND</p>
                  <p className="empty-sub">Search planets, moons, asteroids, spacecraft...</p>
                  <div className="empty-chip-suggestions">
                    <span>Try:</span>
                    {['Earth', 'Jupiter', 'Europa', 'Titan', 'Moon'].map(chip => (
                      <button 
                        key={chip} 
                        className="empty-chip-btn" 
                        onClick={() => { setTargetSearchQuery(chip); setTargetSelectedIndex(0); }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="target-footer-actions">
              <button 
                type="button"
                className="pop-action-btn clear-target-btn"
                onClick={() => {
                  onSelectTarget && onSelectTarget(null);
                  setActivePopover(null);
                }}
              >
                ✕ CLEAR TARGET OVERVIEW
              </button>
            </div>
          </div>
        </div>
      )}

      {activePopover === 'data' && (
        <div className="console-popover console-popover--data">
          <div className="popover-header">
            <h4>📡 DATA CENTER & ENGINE STATUS</h4>
            <button className="popover-close-btn" onClick={() => setActivePopover(null)}>✕</button>
          </div>
          <div className="popover-body">
            <div className="data-stat-row">
              <span>NASA PROXY STATUS:</span>
              <strong className={isBackendOnline ? 'online' : 'offline'}>
                {isBackendOnline ? '🟢 LIVE NASA PROXY' : '🟠 LOCAL FALLBACK'}
              </strong>
            </div>
            <div className="data-stat-row">
              <span>CATALOGED ASTEROIDS:</span>
              <strong>{catalog?.length || 0} OBJECTS</strong>
            </div>
            <div className="data-stat-row">
              <span>NEAR-EARTH FEED:</span>
              <strong>{neoCount || 0} NEOs</strong>
            </div>
            <button className="pop-action-btn" onClick={() => { onOpenFactory && onOpenFactory(); setActivePopover(null); }}>
              🏭 OPEN SPACE DATA FACTORY
            </button>
          </div>
        </div>
      )}

      {/* Expanded Content: Timeline */}
      {isExpanded && (
        <div className="bottom-expanded-content">
          <Timeline
            simTimeDays={simTimeDays}
            onSeekToDays={seekToDays}
            onSeekToDate={seekToDate}
            onSyncToNow={syncToNow}
            onStepTime={stepTime}
            isLive={isLive}
            isPaused={isPaused}
            speedMultiplier={speedMultiplier}
            onTogglePause={onTogglePause}
            onSetSpeed={onSetSpeed}
            onSelectEvent={onSelectEvent}
          />
        </div>
      )}

      {/* Structured Spacecraft Simulator Console Bar (Req 12, 13, 14) */}
      <div className="bottom-compact-bar simulator-console-bar">
        <button 
          className={`console-group-btn ${activePopover === 'time' ? 'active' : ''}`}
          onClick={() => togglePopover('time')}
          title="Simulation Time & Speed Controls"
        >
          ⏱️ TIME ▾ <span className="grp-badge font-mono">{Math.abs(speedMultiplier)}×</span>
        </button>

        <button 
          className={`console-group-btn ${activePopover === 'camera' ? 'active' : ''}`}
          onClick={() => togglePopover('camera')}
          title="Camera Modes & Focus"
        >
          🎥 CAMERA ▾
        </button>

        <button 
          className={`console-group-btn ${activePopover === 'view' ? 'active' : ''}`}
          onClick={() => togglePopover('view')}
          title="Visualization Scale & Overlays"
        >
          👁️ VIEW ▾
        </button>

        <button 
          className={`console-group-btn ${activePopover === 'target' ? 'active' : ''}`}
          onClick={() => togglePopover('target')}
          title="Select Target Object"
        >
          🎯 TARGET ▾ <span className="grp-badge font-mono">{activeTargetName}</span>
        </button>

        <button 
          className={`console-group-btn ${activePopover === 'data' ? 'active' : ''}`}
          onClick={() => togglePopover('data')}
          title="NASA Engine & Data Sources"
        >
          📡 DATA ▾
        </button>

        <div className="console-divider" />

        <button
          className={`console-expand-btn ${isExpanded ? 'expanded' : ''}`}
          onClick={() => onToggleExpanded(!isExpanded)}
          title={isExpanded ? 'Minimize Timeline Scrubber (B)' : 'Expand Timeline Scrubber (B)'}
        >
          {isExpanded ? '▼ TIMELINE' : '▲ TIMELINE'}
        </button>
      </div>
    </div>
  );
}

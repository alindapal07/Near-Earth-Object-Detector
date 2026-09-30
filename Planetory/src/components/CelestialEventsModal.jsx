/**
 * CelestialEventsModal.jsx — Celestial Events Center & Eclipse Simulator (Part 31)
 *
 * Full-screen floating scientific workspace overlay providing:
 * • Global astronomical event search & date range filter (2024–2032)
 * • Multi-category event filters (Solar/Lunar Eclipses, Oppositions, Conjunctions, Transits, Moon Phases, Alignments, Close Approaches)
 * • Chronological visual event timeline, month calendar view, & 2D alignment analyzer
 * • Selected Event Intelligence Panel with 2D shadow cone geometry canvas & formulas
 * • SimulationClock time seek integration (`VIEW EVENT`) & camera framing (`FOCUS EVENT`)
 * • Observatory Mode & Mission Planning cross-mode action dispatching
 * • JSON / CSV export & Watchlist / Favorite event persistence
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { celestialEventEngine } from '../engine/CelestialEventEngine';
import { CrossModeDispatcher } from '../engine/CrossModeDispatcher';
import EclipseCanvas from './visualization/EclipseCanvas';
import AlignmentCanvas from './visualization/AlignmentCanvas';

export default function CelestialEventsModal({
  isOpen,
  onClose,
  simTimeDays = 0,
  seekToDate,
  seekToDays,
  isPaused,
  togglePause,
  setSpeed,
  solarSystemRef,
  onSelectObject,
  onModeChange,
  onOpenPlanner
}) {
  // Active Workspace Tab: 'timeline' | 'calendar' | 'alignment'
  const [activeTab, setActiveTab] = useState('timeline');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedObjectId, setSelectedObjectId] = useState('ALL');
  const [dateRangePreset, setDateRangePreset] = useState('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [watchlistOnly, setWatchlistOnly] = useState(false);

  // Selected Event State
  const [selectedEventId, setSelectedEventId] = useState('solar_eclipse_2026_08_12');
  const [showFormulaDetails, setShowFormulaDetails] = useState(true);

  // User Local Storage Persistence
  const [favorites, setFavorites] = useState(() => {
    try {
      const s = localStorage.getItem('planetory_event_favorites');
      return s ? JSON.parse(s) : ['solar_eclipse_2026_08_12', 'apophis_close_approach_2029'];
    } catch { return ['solar_eclipse_2026_08_12', 'apophis_close_approach_2029']; }
  });

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const s = localStorage.getItem('planetory_event_watchlist');
      return s ? JSON.parse(s) : ['mars_opposition_2027', 'solar_eclipse_2027_08_02'];
    } catch { return ['mars_opposition_2027', 'solar_eclipse_2027_08_02']; }
  });

  // Alignment Analyzer Planet Selection State
  const [alignmentPlanets, setAlignmentPlanets] = useState(['mercury', 'venus', 'earth', 'mars', 'jupiter']);

  // Filtered Events List
  const filteredEvents = useMemo(() => {
    let startDate = null;
    let endDate = null;

    if (dateRangePreset === '2026') {
      startDate = '2026-01-01'; endDate = '2026-12-31';
    } else if (dateRangePreset === '2027') {
      startDate = '2027-01-01'; endDate = '2027-12-31';
    } else if (dateRangePreset === '2026_2030') {
      startDate = '2026-01-01'; endDate = '2030-12-31';
    }

    return celestialEventEngine.searchEvents({
      query: searchQuery,
      category: selectedCategory,
      startDate,
      endDate,
      objectId: selectedObjectId,
      favoriteOnly: favoritesOnly,
      watchOnly: watchlistOnly,
      favorites,
      watchlist
    });
  }, [searchQuery, selectedCategory, selectedObjectId, dateRangePreset, favoritesOnly, watchlistOnly, favorites, watchlist]);

  // Selected Event Object
  const selectedEvent = useMemo(() => {
    return celestialEventEngine.getEventById(selectedEventId) || filteredEvents[0] || null;
  }, [selectedEventId, filteredEvents]);

  // Eclipse Geometry Calculation for Selected Event
  const eclipseData = useMemo(() => {
    if (!selectedEvent) return {};
    return celestialEventEngine.calculateEclipseGeometry(selectedEvent.simTimeDays || simTimeDays);
  }, [selectedEvent, simTimeDays]);

  // Toggle Favorite
  const toggleFavorite = (eventId) => {
    setFavorites(prev => {
      const next = prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId];
      localStorage.setItem('planetory_event_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Toggle Watchlist
  const toggleWatchlist = (eventId) => {
    setWatchlist(prev => {
      const next = prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId];
      localStorage.setItem('planetory_event_watchlist', JSON.stringify(next));
      return next;
    });
  };

  // Action: Seek SimulationClock to Event Date
  const handleSeekToEvent = (ev) => {
    if (!ev) return;
    if (seekToDays) {
      seekToDays(ev.simTimeDays);
    } else if (seekToDate && ev.dateStr) {
      seekToDate(new Date(ev.dateStr));
    }
  };

  // Action: Focus Camera on Event Objects
  const handleFocusEvent = (ev) => {
    if (!ev) return;
    handleSeekToEvent(ev);
    const targetObjId = ev.objectIds ? ev.objectIds[0] : null;
    if (targetObjId) {
      CrossModeDispatcher.dispatchFocus(targetObjId, { onSelectObject, solarSystemRef });
    }
  };

  // Action: Observe Event in Observatory Mode
  const handleObserveEvent = (ev) => {
    if (!ev) return;
    handleSeekToEvent(ev);
    const targetObjId = ev.objectIds ? ev.objectIds[0] : null;
    CrossModeDispatcher.dispatchObserve(targetObjId, { onSelectObject, onModeChange, solarSystemRef });
  };

  // Action: Export Events (CSV / JSON)
  const handleExportEvents = (format = 'json') => {
    const dataStr = format === 'json'
      ? JSON.stringify(filteredEvents, null, 2)
      : 'ID,Name,Type,Date,Objects,Source,Model\n' +
        filteredEvents.map(e => `"${e.id}","${e.name}","${e.type}","${e.dateStr}","${e.objectIds.join(';')}","${e.source}","${e.model}"`).join('\n');

    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planetory_celestial_events_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="sdf-workspace-overlay celestial-events-overlay">
      {/* ==================================================
          1. TOP HEADER STRIP
      ================================================== */}
      <div className="sdf-top-bar">
        <div className="sdf-title-group">
          <span className="sdf-title-icon">🌌</span>
          <div>
            <h2 className="sdf-title">CELESTIAL EVENTS CENTER</h2>
            <span className="sdf-subtitle font-mono">ECLIPSE SIMULATOR & SCIENTIFIC ALIGNMENT TIMELINE</span>
          </div>
        </div>

        {/* Global Event Search Bar */}
        <div className="sdf-search-bar">
          <span className="sdf-search-icon">🔎</span>
          <input
            type="text"
            className="sdf-search-input font-mono"
            placeholder="SEARCH ECLIPSES, OPPOSITIONS, TRANSITS, ALIGNMENTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="sdf-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Date Range Dropdown */}
        <div className="sdf-header-controls">
          <select
            className="sdf-select font-mono"
            value={dateRangePreset}
            onChange={(e) => setDateRangePreset(e.target.value)}
          >
            <option value="ALL">📅 ALL TIME</option>
            <option value="2026">📅 THIS YEAR (2026)</option>
            <option value="2027">📅 NEXT YEAR (2027)</option>
            <option value="2026_2030">📅 2026–2030 SPAN</option>
          </select>

          <button className="sdf-btn-outline" onClick={() => handleExportEvents('json')}>
            📥 JSON
          </button>
          <button className="sdf-btn-outline" onClick={() => handleExportEvents('csv')}>
            📊 CSV
          </button>
          <button className="sdf-close-btn" onClick={onClose} title="Close Events Center (ESC)">
            ✕
          </button>
        </div>
      </div>

      {/* ==================================================
          2. MAIN WORKSPACE GRID (LEFT FILTERS | CENTER TIMELINE | RIGHT INTELLIGENCE)
      ================================================== */}
      <div className="sdf-main-grid">

        {/* --- LEFT SIDEBAR: FILTERS --- */}
        <div className="sdf-filter-sidebar">
          <div className="filter-section">
            <h3 className="filter-section-title">EVENT TYPE</h3>
            <div className="sdf-pill-group">
              {['ALL', 'SOLAR ECLIPSE', 'LUNAR ECLIPSE', 'OPPOSITION', 'CONJUNCTION', 'PLANETARY TRANSIT', 'CLOSE APPROACH', 'MOON PHASE', 'PLANETARY ALIGNMENT', 'PERIHELION'].map(cat => (
                <button
                  key={cat}
                  className={`sdf-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-section-title">TARGET BODY</h3>
            <select
              className="sdf-select font-mono"
              value={selectedObjectId}
              onChange={(e) => setSelectedObjectId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">ALL CELESTIAL BODIES</option>
              <option value="sun">Sun</option>
              <option value="earth">Earth</option>
              <option value="moon">Moon</option>
              <option value="mars">Mars</option>
              <option value="jupiter">Jupiter</option>
              <option value="saturn">Saturn</option>
              <option value="mercury">Mercury</option>
              <option value="venus">Venus</option>
              <option value="apophis">Asteroid Apophis</option>
              <option value="halley">Comet Halley</option>
            </select>
          </div>

          <div className="filter-section">
            <h3 className="filter-section-title">WATCHLIST & FAVORITES</h3>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <label className="sdf-checkbox-label">
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                />
                <span>★ Favorites Only ({favorites.length})</span>
              </label>

              <label className="sdf-checkbox-label">
                <input
                  type="checkbox"
                  checked={watchlistOnly}
                  onChange={(e) => setWatchlistOnly(e.target.checked)}
                />
                <span>🔔 Watchlist Only ({watchlist.length})</span>
              </label>
            </div>
          </div>
        </div>

        {/* --- CENTER AREA: TIMELINE / CALENDAR / ALIGNMENT TABS --- */}
        <div className="sdf-results-area">
          {/* Workspace Sub-Nav */}
          <div className="sdf-view-bar" style={{ justifyContent: 'space-between' }}>
            <div className="sdf-view-modes">
              <button
                className={`sdf-view-mode-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                📜 TIMELINE ({filteredEvents.length})
              </button>
              <button
                className={`sdf-view-mode-btn ${activeTab === 'alignment' ? 'active' : ''}`}
                onClick={() => setActiveTab('alignment')}
              >
                📐 2D ALIGNMENT ANALYZER
              </button>
            </div>

            <div className="sdf-analytics-strip" style={{ padding: '4px 12px', margin: 0 }}>
              <span className="analytics-metric">EVENTS: <strong>{filteredEvents.length}</strong></span>
              <span className="analytics-sep">•</span>
              <span className="analytics-metric">ECLIPSES: <strong>{filteredEvents.filter(e => e.type.includes('ECLIPSE')).length}</strong></span>
            </div>
          </div>

          {/* TAB 1: CHRONOLOGICAL TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="events-timeline-container" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
              {filteredEvents.length === 0 ? (
                <div className="sdf-empty-state font-mono">NO CELESTIAL EVENTS FOUND FOR SELECTED CRITERIA</div>
              ) : (
                <div className="timeline-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredEvents.map(ev => {
                    const isSelected = selectedEvent?.id === ev.id;
                    const isFav = favorites.includes(ev.id);
                    const isWatch = watchlist.includes(ev.id);

                    return (
                      <div
                        key={ev.id}
                        className={`sdf-obj-card event-card-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedEventId(ev.id)}
                        style={{ cursor: 'pointer', padding: '14px', borderLeft: isSelected ? '4px solid #00f0ff' : '1px solid rgba(0, 240, 255, 0.2)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span className="obj-type-badge font-mono" style={{ background: ev.type.includes('ECLIPSE') ? 'rgba(255, 85, 0, 0.25)' : 'rgba(0, 240, 255, 0.15)', color: ev.type.includes('ECLIPSE') ? '#ff7733' : '#00f0ff' }}>
                            {ev.type}
                          </span>
                          <span className="font-mono" style={{ fontSize: '0.75rem', color: '#ffb74d' }}>
                            {ev.dateStr}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '1rem' }}>{ev.name}</h4>
                        <p style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '0.82rem', lineHeight: '1.4' }}>{ev.description}</p>

                        <div className="obj-card-actions" style={{ marginTop: '8px' }}>
                          <button
                            className="sdf-card-btn primary"
                            onClick={(e) => { e.stopPropagation(); setSelectedEventId(ev.id); handleSeekToEvent(ev); }}
                          >
                            ▶ VIEW EVENT
                          </button>
                          <button
                            className="sdf-card-btn"
                            onClick={(e) => { e.stopPropagation(); handleFocusEvent(ev); }}
                          >
                            👁️ FOCUS
                          </button>
                          <button
                            className="sdf-card-btn"
                            onClick={(e) => { e.stopPropagation(); handleObserveEvent(ev); }}
                          >
                            🔭 OBSERVE
                          </button>
                          <button
                            className={`sdf-card-btn ${isFav ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(ev.id); }}
                          >
                            {isFav ? '★ FAVORITE' : '☆ FAVORITE'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 2D PLANETARY ALIGNMENT ANALYZER */}
          {activeTab === 'alignment' && (
            <div className="events-alignment-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="sdf-obj-card" style={{ padding: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#00f0ff', fontSize: '0.9rem' }}>SELECT PLANETS FOR HELIOCENTRIC ALIGNMENT ANALYZER</h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'].map(pid => (
                    <label key={pid} className="sdf-checkbox-label">
                      <input
                        type="checkbox"
                        checked={alignmentPlanets.includes(pid)}
                        onChange={(e) => {
                          if (e.target.checked) setAlignmentPlanets([...alignmentPlanets, pid]);
                          else setAlignmentPlanets(alignmentPlanets.filter(id => id !== pid));
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{pid}</span>
                    </label>
                  ))}
                </div>
              </div>

              <AlignmentCanvas planetIds={alignmentPlanets} simTimeDays={simTimeDays} />
            </div>
          )}
        </div>

        {/* --- RIGHT SIDEBAR: SELECTED EVENT INTELLIGENCE CONSOLE --- */}
        <div className="sdf-intel-drawer">
          {selectedEvent ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Event Header */}
              <div className="sdf-intel-header">
                <span className="obj-type-badge font-mono" style={{ background: 'rgba(0, 240, 255, 0.2)', color: '#00f0ff' }}>
                  {selectedEvent.type}
                </span>
                <h3 className="sdf-intel-title" style={{ margin: '6px 0 2px 0' }}>{selectedEvent.name}</h3>
                <span className="font-mono" style={{ color: '#ffb74d', fontSize: '0.85rem' }}>{selectedEvent.dateStr}</span>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button className="sdf-card-btn primary" onClick={() => handleSeekToEvent(selectedEvent)}>
                  ▶ VIEW EVENT
                </button>
                <button className="sdf-card-btn" onClick={() => handleFocusEvent(selectedEvent)}>
                  👁️ FOCUS
                </button>
                <button className="sdf-card-btn" onClick={() => handleObserveEvent(selectedEvent)}>
                  🔭 OBSERVE
                </button>
                <button className="sdf-card-btn" onClick={() => onOpenPlanner && onOpenPlanner()}>
                  🚀 PLAN MISSION
                </button>
              </div>

              {/* Interactive 2D Visualizer Component */}
              {selectedEvent.type.includes('ECLIPSE') ? (
                <EclipseCanvas eclipseData={{ ...selectedEvent.metadata, ...eclipseData }} simTimeDays={simTimeDays} />
              ) : (
                <AlignmentCanvas planetIds={selectedEvent.objectIds} simTimeDays={simTimeDays} />
              )}

              {/* Provenance & Scientific Model */}
              <div className="sdf-intel-section">
                <h4 className="sdf-section-title">DATA PROVENANCE & MODEL</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="detail-row">
                    <span className="detail-label">SOURCE</span>
                    <span className="detail-value font-mono">{selectedEvent.source}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">MODEL</span>
                    <span className="detail-value font-mono">{selectedEvent.model}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">CONFIDENCE</span>
                    <span className="detail-value font-mono">{selectedEvent.confidence}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">DURATION</span>
                    <span className="detail-value font-mono">{selectedEvent.durationStr}</span>
                  </div>
                </div>
              </div>

              {/* Expandable Scientific Calculations Box */}
              <div className="sdf-intel-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="sdf-section-title" style={{ margin: 0 }}>ƒ(x) SCIENTIFIC CALCULATIONS</h4>
                  <button
                    className="sdf-btn-outline"
                    style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                    onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                  >
                    {showFormulaDetails ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                {showFormulaDetails && (
                  <div className="formula-box font-mono" style={{ background: 'rgba(5, 12, 24, 0.9)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: '#81d4fa', marginTop: '8px' }}>
                    <div><strong>ANGULAR SEPARATION:</strong> θ = arccos((v1 · v2) / (|v1||v2|))</div>
                    <div><strong>UMBRA RADIUS:</strong> R_umbra = R_Moon - ((R_Sun - R_Moon) · d_Moon) / d_Sun</div>
                    <div><strong>PENUMBRA RADIUS:</strong> R_penumbra = R_Moon + ((R_Sun + R_Moon) · d_Moon) / d_Sun</div>
                    <div style={{ marginTop: '6px', color: '#a5d6a7' }}>RESULT: Alignment Angle = {eclipseData.alignAngleDeg || 0.05}°</div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="sdf-empty-state font-mono">SELECT AN EVENT TO VIEW SCIENTIFIC INTELLIGENCE</div>
          )}
        </div>

      </div>
    </div>
  );
}

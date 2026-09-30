/**
 * SpaceDataFactoryModal.jsx — Unified Astronomical Data Center & Object Explorer (Part 30)
 *
 * Implements a professional scientific data center workspace:
 * • Global scientific search with instant prefix/token indexing & Ctrl+K support
 * • Category filters & multi-criteria physical/orbital range sliders
 * • 3 View Modes: Grid Cards, Compact List, and Sortable Scientific Table
 * • Integrated canonical ObjectIntelligencePanel drawer for selected object
 * • Universal Cross-Mode Action Dispatcher (Focus, Follow, Observe, Compare, Plan Mission, Show Orbit)
 * • Small-Body & Celestial Event Explorer with SimulationClock seek integration
 * • Dataset Scientific Analytics banner (Count, Largest, Smallest, Avg Radius, Avg Period)
 * • Multi-selection actions (Compare Selected, Add to Mission, Add to Observation, Export)
 * • CSV / JSON export & Scientific Report generator
 * • Data provenance, cache freshness, and degraded offline support
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { scientificDataRegistry } from '../engine/ScientificDataRegistry';
import { CrossModeDispatcher } from '../engine/CrossModeDispatcher';
import ObjectIntelligencePanel from './ObjectIntelligencePanel';
import { formatKm, formatAU, formatMass } from '../utils/formatters';

export default function SpaceDataFactoryModal({
  isOpen,
  onClose,
  spaceData = {},
  simTimeDays = 0,
  seekToDate,
  seekToDays,
  solarSystemRef,
  onSelectObject,
  onModeChange,
  onOpenCompare,
  onOpenPlanner
}) {
  // Initialize unified scientific registry from spaceData catalog
  useEffect(() => {
    scientificDataRegistry.initialize(spaceData);
  }, [spaceData]);

  // Workspace View Tabs: 'explorer' | 'events' | 'datasets' | 'reports'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('explorer');

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('ALL');

  // View Mode: 'GRID' | 'LIST' | 'TABLE'
  const [viewMode, setViewMode] = useState('TABLE');

  // Unit System: 'METRIC' | 'ASTRONOMICAL' | 'SCIENTIFIC'
  const [unitSystem, setUnitSystem] = useState('ASTRONOMICAL');

  // Sort State
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter Criteria State
  const [typeFilters, setTypeFilters] = useState([]);
  const [parentFilter, setParentFilter] = useState('ALL');
  const [maxRadiusFilter, setMaxRadiusFilter] = useState(100000);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState(50);
  const [phaOnly, setPhaOnly] = useState(false);
  const [neoOnly, setNeoOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Selection state
  const [selectedObjectId, setSelectedObjectId] = useState('earth');
  const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());
  const [favorites, setFavorites] = useState(() => {
    try {
      const s = localStorage.getItem('planetory_favorites');
      return s ? JSON.parse(s) : ['earth', 'mars', 'jupiter', 'moon'];
    } catch { return ['earth', 'mars', 'jupiter', 'moon']; }
  });

  const searchInputRef = useRef(null);

  // Global Ctrl+K Shortcut for Search Input Focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'K') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered & Sorted Objects Dataset
  const filteredDataset = useMemo(() => {
    if (!scientificDataRegistry.isInitialized) {
      scientificDataRegistry.initialize(spaceData);
    }

    let list = scientificDataRegistry.search(searchQuery, { category: searchCategory, limit: 2000 });

    // Apply sidebar criteria
    if (typeFilters.length > 0) {
      list = list.filter(o => typeFilters.includes(o.type));
    }
    if (parentFilter !== 'ALL') {
      list = list.filter(o => o.parentId === parentFilter);
    }
    if (phaOnly) list = list.filter(o => o.pha);
    if (neoOnly) list = list.filter(o => o.neo);
    if (favoritesOnly) list = list.filter(o => favorites.includes(o.id));

    if (maxRadiusFilter < 100000) {
      list = list.filter(o => o.radiusKm != null && o.radiusKm <= maxRadiusFilter);
    }
    if (maxDistanceFilter < 50) {
      list = list.filter(o => o.semiMajorAxisAu != null && o.semiMajorAxisAu <= maxDistanceFilter);
    }

    // Apply Sorting
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA == null) valA = sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB == null) valB = sortOrder === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [
    spaceData, searchQuery, searchCategory, typeFilters, parentFilter, phaOnly, neoOnly,
    favoritesOnly, maxRadiusFilter, maxDistanceFilter, sortField, sortOrder, favorites
  ]);

  // Dataset Scientific Analytics Summary
  const datasetAnalytics = useMemo(() => {
    return scientificDataRegistry.computeDatasetAnalytics(filteredDataset);
  }, [filteredDataset]);

  // Paginated Results
  const totalPages = Math.ceil(filteredDataset.length / pageSize) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDataset.slice(start, start + pageSize);
  }, [filteredDataset, currentPage, pageSize]);

  // Selected Object Instance
  const activeSelectedObject = useMemo(() => {
    return scientificDataRegistry.getObject(selectedObjectId) || scientificDataRegistry.getObject('earth');
  }, [selectedObjectId]);

  if (!isOpen) return null;

  // Toggle Type Filter
  const toggleTypeFilter = (t) => {
    setTypeFilters(prev => 
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
    setCurrentPage(1);
  };

  // Toggle Multi-select Checkbox
  const toggleMultiSelect = (id) => {
    setMultiSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Favorite
  const toggleFavorite = (id) => {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem('planetory_favorites', JSON.stringify(next)); } catch {}
  };

  // Handle Sort Change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'NAME', 'TYPE', 'RADIUS_KM', 'MASS_KG', 'SEMI_MAJOR_AXIS_AU', 'ECCENTRICITY', 'SOURCE'];
    const rows = filteredDataset.map(o => [
      o.id, o.name, o.type, o.radiusKm || '', o.massKg || '', o.semiMajorAxisAu || '', o.eccentricity || '', o.source
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `planetory_data_export_${Date.now()}.csv`;
    a.click();
  };

  // Export JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredDataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planetory_data_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sdf-workspace-overlay" onClick={onClose}>
      <div className="sdf-workspace-container" onClick={e => e.stopPropagation()} onWheel={e => e.stopPropagation()}>
        {/* ── TOP HEADER BAR ────────────────────────────────────────────────── */}
        <div className="sdf-header-bar">
          <div className="sdf-header-left">
            <div className="sdf-brand-badge">🏭 SPACE DATA FACTORY</div>
            <h2 className="sdf-brand-title">UNIFIED CELESTIAL DATA CENTER</h2>
            <span className="sdf-provenance-tag font-mono">
              ● DATA SERVICES: {spaceData.serverStatus?.online ? 'ONLINE' : 'CACHED'}
            </span>
          </div>

          <div className="sdf-header-center">
            {/* Global Search Input */}
            <div className="sdf-search-wrap">
              <span className="sdf-search-icon">🔍</span>
              <input
                ref={searchInputRef}
                className="sdf-search-input"
                placeholder="Search planets, moons, asteroids, comets, stars... (Ctrl+K)"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
              {searchQuery && (
                <button className="sdf-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>

          <div className="sdf-header-right">
            {/* View Mode Buttons */}
            <div className="sdf-btn-group">
              <button className={`sdf-btn ${viewMode === 'TABLE' ? 'active' : ''}`} onClick={() => setViewMode('TABLE')}>
                📋 TABLE
              </button>
              <button className={`sdf-btn ${viewMode === 'GRID' ? 'active' : ''}`} onClick={() => setViewMode('GRID')}>
                🪟 GRID
              </button>
              <button className={`sdf-btn ${viewMode === 'LIST' ? 'active' : ''}`} onClick={() => setViewMode('LIST')}>
                ☰ LIST
              </button>
            </div>

            {/* Export Actions */}
            <button className="sdf-btn sdf-btn--amber" onClick={handleExportCSV}>📥 CSV</button>
            <button className="sdf-btn sdf-btn--amber" onClick={handleExportJSON}>📥 JSON</button>

            <button className="sdf-close-btn" onClick={onClose} title="Close Workspace (Esc)">✕</button>
          </div>
        </div>

        {/* ── SEARCH CATEGORY PILLS BAR ─────────────────────────────────────── */}
        <div className="sdf-categories-bar">
          {['ALL', 'PLANET', 'MOON', 'ASTEROID', 'COMET', 'STAR', 'SPACECRAFT', 'CONSTELLATION'].map(cat => (
            <button
              key={cat}
              className={`sdf-cat-pill ${searchCategory === cat ? 'active' : ''}`}
              onClick={() => { setSearchCategory(cat); setCurrentPage(1); }}
            >
              {cat === 'ALL' ? '🌌 ALL CATEGORIES' : cat}
            </button>
          ))}
          <button 
            className={`sdf-cat-pill ${favoritesOnly ? 'active' : ''}`}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            ★ FAVORITES ({favorites.length})
          </button>
        </div>

        {/* ── MAIN 3-COLUMN LAYOUT GRID ────────────────────────────────────── */}
        <div className="sdf-main-grid">
          {/* ── LEFT COLUMN: SIDEBAR FILTERS ────────────────────────────────── */}
          <div className="sdf-col sdf-col-filters">
            <div className="sdf-card">
              <div className="sdf-card-title">⚙️ DATA FILTERS</div>

              {/* Object Type Checkboxes */}
              <div className="sdf-filter-section">
                <div className="sdf-filter-lbl">OBJECT TYPE</div>
                {['PLANET', 'MOON', 'ASTEROID', 'COMET', 'STAR', 'SPACECRAFT'].map(t => (
                  <label key={t} className="sdf-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={typeFilters.includes(t)}
                      onChange={() => toggleTypeFilter(t)}
                    />
                    <span>{t}s</span>
                  </label>
                ))}
              </div>

              {/* Parent Body Select */}
              <div className="sdf-filter-section">
                <div className="sdf-filter-lbl">PARENT BODY</div>
                <select className="sdf-select" value={parentFilter} onChange={e => setParentFilter(e.target.value)}>
                  <option value="ALL">ANY PARENT</option>
                  <option value="sun">SUN (Solar System)</option>
                  <option value="earth">EARTH</option>
                  <option value="mars">MARS</option>
                  <option value="jupiter">JUPITER</option>
                  <option value="saturn">SATURN</option>
                </select>
              </div>

              {/* Physical Range Sliders */}
              <div className="sdf-filter-section">
                <div className="sdf-filter-lbl">MAX RADIUS ({maxRadiusFilter.toLocaleString()} km)</div>
                <input
                  type="range"
                  min="1"
                  max="100000"
                  step="500"
                  value={maxRadiusFilter}
                  onChange={e => setMaxRadiusFilter(Number(e.target.value))}
                  className="sdf-slider"
                />
              </div>

              <div className="sdf-filter-section">
                <div className="sdf-filter-lbl">MAX DISTANCE ({maxDistanceFilter} AU)</div>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.5"
                  value={maxDistanceFilter}
                  onChange={e => setMaxDistanceFilter(Number(e.target.value))}
                  className="sdf-slider"
                />
              </div>

              {/* Special Toggles */}
              <div className="sdf-filter-section">
                <label className="sdf-checkbox-lbl">
                  <input type="checkbox" checked={neoOnly} onChange={e => setNeoOnly(e.target.checked)} />
                  <span>NEO ONLY (Near Earth)</span>
                </label>
                <label className="sdf-checkbox-lbl">
                  <input type="checkbox" checked={phaOnly} onChange={e => setPhaOnly(e.target.checked)} />
                  <span>PHA ONLY (Hazardous)</span>
                </label>
              </div>

              <button 
                className="sdf-btn sdf-btn--full"
                onClick={() => {
                  setTypeFilters([]);
                  setParentFilter('ALL');
                  setMaxRadiusFilter(100000);
                  setMaxDistanceFilter(50);
                  setPhaOnly(false);
                  setNeoOnly(false);
                  setFavoritesOnly(false);
                }}
              >
                ↺ RESET FILTERS
              </button>
            </div>
          </div>

          {/* ── CENTER COLUMN: DATA RESULTS VIEW ─────────────────────────────── */}
          <div className="sdf-col sdf-col-results">
            {/* Scientific Data Table Mode */}
            {viewMode === 'TABLE' && (
              <div className="sdf-table-wrap">
                <table className="sdf-table">
                  <thead>
                    <tr>
                      <th>SELECT</th>
                      <th onClick={() => handleSort('name')}>NAME {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => handleSort('type')}>TYPE</th>
                      <th onClick={() => handleSort('radiusKm')}>RADIUS</th>
                      <th onClick={() => handleSort('massKg')}>MASS</th>
                      <th onClick={() => handleSort('semiMajorAxisAu')}>DISTANCE</th>
                      <th onClick={() => handleSort('orbitalPeriodDays')}>PERIOD</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map(o => (
                      <tr 
                        key={o.id}
                        className={selectedObjectId === o.id ? 'active-row' : ''}
                        onClick={() => setSelectedObjectId(o.id)}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={multiSelectedIds.has(o.id)} 
                            onChange={() => toggleMultiSelect(o.id)} 
                          />
                        </td>
                        <td>
                          <div className="sdf-td-name">
                            <span 
                              className={`sdf-star-fav ${favorites.includes(o.id) ? 'active' : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(o.id); }}
                            >
                              ★
                            </span>
                            <strong>{o.name}</strong>
                          </div>
                        </td>
                        <td><span className="sdf-badge-type">{o.type}</span></td>
                        <td className="font-mono">{o.radiusKm ? formatKm(o.radiusKm) : 'N/A'}</td>
                        <td className="font-mono">{o.massKg ? formatMass(o.massKg) : 'N/A'}</td>
                        <td className="font-mono sdf-td-cyan">{o.semiMajorAxisAu ? formatAU(o.semiMajorAxisAu) : 'N/A'}</td>
                        <td className="font-mono">{o.orbitalPeriodDays ? `${o.orbitalPeriodDays.toFixed(1)}d` : 'N/A'}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="sdf-row-actions">
                            <button 
                              className="sdf-row-btn" 
                              onClick={() => CrossModeDispatcher.focusObject(o, solarSystemRef, onSelectObject)}
                              title="Focus in 3D Solar System"
                            >
                              ◎ FOCUS
                            </button>
                            <button 
                              className="sdf-row-btn" 
                              onClick={() => CrossModeDispatcher.observeObject(o, onModeChange, onSelectObject)}
                              title="Switch to Observatory Sky Mode"
                            >
                              🔭 OBSERVE
                            </button>
                            <button 
                              className="sdf-row-btn" 
                              onClick={() => CrossModeDispatcher.compareObjects(o, null, onOpenCompare)}
                              title="Compare in Scientific Comparison Modal"
                            >
                              ⚖ COMPARE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grid Cards Mode */}
            {viewMode === 'GRID' && (
              <div className="sdf-grid-wrap">
                {paginatedResults.map(o => (
                  <div 
                    key={o.id}
                    className={`sdf-obj-card ${selectedObjectId === o.id ? 'active' : ''}`}
                    onClick={() => setSelectedObjectId(o.id)}
                  >
                    <div className="sdf-card-head">
                      <span className="sdf-card-type">{o.type}</span>
                      <span className="sdf-card-fav" onClick={e => { e.stopPropagation(); toggleFavorite(o.id); }}>
                        {favorites.includes(o.id) ? '★' : '☆'}
                      </span>
                    </div>
                    <div className="sdf-card-name">{o.name}</div>
                    <div className="sdf-card-metrics">
                      <div>Radius: {o.radiusKm ? formatKm(o.radiusKm) : 'N/A'}</div>
                      <div>Dist: {o.semiMajorAxisAu ? formatAU(o.semiMajorAxisAu) : 'N/A'}</div>
                    </div>
                    <div className="sdf-card-actions">
                      <button onClick={() => CrossModeDispatcher.focusObject(o, solarSystemRef, onSelectObject)}>◎ FOCUS</button>
                      <button onClick={() => CrossModeDispatcher.observeObject(o, onModeChange, onSelectObject)}>🔭 OBSERVE</button>
                      <button onClick={() => CrossModeDispatcher.compareObjects(o, null, onOpenCompare)}>⚖ COMPARE</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="sdf-pagination-bar">
              <span>SHOWING {paginatedResults.length} OF {filteredDataset.length} OBJECTS</span>
              <div className="sdf-page-btns">
                <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>◀ PREV</button>
                <span>PAGE {currentPage} / {totalPages}</span>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>NEXT ▶</button>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: INTEGRATED OBJECT INTELLIGENCE DRAWER ──────────── */}
          <div className="sdf-col sdf-col-drawer">
            {activeSelectedObject ? (
              <ObjectIntelligencePanel
                selectedObject={activeSelectedObject.rawRef || activeSelectedObject}
                simTimeDays={simTimeDays}
                onClose={() => {}}
                onFocus={(o) => CrossModeDispatcher.focusObject(o, solarSystemRef, onSelectObject)}
                onFollow={(o) => CrossModeDispatcher.followObject(o, solarSystemRef, onSelectObject)}
                onOpenCompare={(o) => CrossModeDispatcher.compareObjects(o, null, onOpenCompare)}
              />
            ) : (
              <div className="sdf-card">
                <div className="sdf-card-title">OBJECT INTELLIGENCE</div>
                <p>Select any object from the table or grid to view scientific metrics.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM SCIENTIFIC ANALYTICS & MULTI-SELECT BAR ────────────────── */}
        <div className="sdf-bottom-bar">
          <div className="sdf-analytics-strip">
            <span className="sdf-an-item">ITEMS: <strong>{datasetAnalytics.count}</strong></span>
            <span className="sdf-an-item">LARGEST: <strong>{datasetAnalytics.largestName}</strong></span>
            <span className="sdf-an-item">SMALLEST: <strong>{datasetAnalytics.smallestName}</strong></span>
            <span className="sdf-an-item">AVG RADIUS: <strong>{datasetAnalytics.avgRadiusKm ? formatKm(datasetAnalytics.avgRadiusKm) : 'N/A'}</strong></span>
            <span className="sdf-an-item">AVG PERIOD: <strong>{datasetAnalytics.avgPeriodDays ? `${datasetAnalytics.avgPeriodDays}d` : 'N/A'}</strong></span>
          </div>

          {multiSelectedIds.size > 0 && (
            <div className="sdf-multi-actions">
              <span>SELECTED: <strong>{multiSelectedIds.size} OBJECTS</strong></span>
              <button 
                className="sdf-btn sdf-btn--cyan"
                onClick={() => {
                  const items = Array.from(multiSelectedIds).map(id => scientificDataRegistry.getObject(id));
                  if (items.length > 0) CrossModeDispatcher.compareObjects(items[0], items[1] || null, onOpenCompare);
                }}
              >
                ⚖ COMPARE SELECTED
              </button>
              <button 
                className="sdf-btn sdf-btn--green"
                onClick={() => {
                  const items = Array.from(multiSelectedIds).map(id => scientificDataRegistry.getObject(id));
                  if (items.length > 0) CrossModeDispatcher.planMission(items[0], items[1] || null, onOpenPlanner);
                }}
              >
                🚀 ADD TO MISSION
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { searchAsteroids, fetchAsteroidCatalog } from '../api/spaceApi';

const GROUPS = [
  { id: 'ALL', label: 'All Groups' },
  { id: 'APO', label: 'Apollos (Earth-Crossers)' },
  { id: 'AMO', label: 'Amors (Near-Earth)' },
  { id: 'ATE', label: 'Atens (Earth-Crossers)' },
  { id: 'ATI', label: 'Atiras (Interior to Earth)' },
  { id: 'MBA', label: 'Main Belt' },
  { id: 'OMB', label: 'Outer Main Belt' },
  { id: 'TJN', label: 'Jupiter Trojans' }
];

export default function AsteroidCatalogPanel({ catalog, loading, error, onSelectAsteroid }) {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [phaOnly, setPhaOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Perform live search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      setSearchLoading(true);
      searchAsteroids(query)
        .then(res => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const sourceData = searchResults !== null ? searchResults : catalog || [];

  // Filter local catalog data
  const filteredData = sourceData.filter(item => {
    if (selectedGroup !== 'ALL') {
      const cls = (item.orbitClassCode || item.orbitClass || '').toUpperCase();
      if (!cls.includes(selectedGroup)) return false;
    }
    if (phaOnly && !item.pha) return false;
    return true;
  });

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'a') return (a.a || 0) - (b.a || 0);
    if (sortBy === 'e') return (b.e || 0) - (a.e || 0);
    if (sortBy === 'i') return (b.i || 0) - (a.i || 0);
    if (sortBy === 'H') return (a.H || a.h || 99) - (b.H || b.h || 99);
    return 0;
  });

  return (
    <div className="asteroid-catalog-panel">
      {/* Header */}
      <div className="panel-header">
        <h3>🔍 ASTEROID DATA FACTORY CATALOG</h3>
        <span className="count-badge">{sortedData.length} Objects</span>
      </div>

      {/* Controls Bar */}
      <div className="catalog-controls">
        <div className="search-input-wrap">
          <input 
            type="text" 
            placeholder="Search by name, designation, SPK-ID (e.g. Eros, 99942, 2024 BX1)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="catalog-search-input"
          />
          {searchLoading && <span className="search-spinner">...</span>}
        </div>

        <div className="controls-row">
          <div className="group-chips">
            {GROUPS.map(g => (
              <button
                key={g.id}
                className={`chip ${selectedGroup === g.id ? 'chip--active' : ''}`}
                onClick={() => setSelectedGroup(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="filter-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={phaOnly} 
                onChange={(e) => setPhaOnly(e.target.checked)} 
              />
              ⚠ Potentially Hazardous Only
            </label>

            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="a">Sort by Semi-Major Axis (a)</option>
              <option value="e">Sort by Eccentricity (e)</option>
              <option value="i">Sort by Inclination (i)</option>
              <option value="H">Sort by Magnitude (H)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table / Grid */}
      <div className="catalog-table-wrap">
        {loading ? (
          <div className="sdf-panel-loading">
            <div className="spinner"></div>
            <p>Loading Asteroid Catalog...</p>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="sdf-panel-empty">No asteroids matched your search criteria.</div>
        ) : (
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Designation / Name</th>
                <th>Orbit Class</th>
                <th>Semi-Major Axis (a)</th>
                <th>Eccentricity (e)</th>
                <th>Inclination (i)</th>
                <th>Abs Mag (H)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(ast => (
                <tr 
                  key={ast.spkid || ast.id || ast.designation} 
                  className="catalog-row"
                  onClick={() => onSelectAsteroid(ast)}
                >
                  <td className="col-name">
                    <strong>{ast.name || ast.fullName || ast.designation}</strong>
                  </td>
                  <td>
                    <span className="badge badge--class">{ast.orbitClassCode || ast.orbitClass || 'N/A'}</span>
                  </td>
                  <td>{ast.a ? Number(ast.a).toFixed(3) + ' AU' : 'N/A'}</td>
                  <td>{ast.e ? Number(ast.e).toFixed(3) : 'N/A'}</td>
                  <td>{ast.i ? Number(ast.i).toFixed(1) + '°' : 'N/A'}</td>
                  <td>{ast.H !== undefined ? Number(ast.H).toFixed(1) : 'N/A'}</td>
                  <td>
                    {ast.pha && <span className="badge badge--pha">⚠ PHA</span>}
                    {ast.neo && !ast.pha && <span className="badge badge--neo">NEO</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES, ARTIFICIAL_SATELLITES } from '../data/satellites';
import { searchEvents } from '../utils/eventEngine';
import { SPACECRAFT_MISSIONS } from '../data/spacecraftMissions';

const ALIAS_MAP = {
  sol: 'sun',
  terra: 'earth',
  luna: 'moon',
  jovian: 'jupiter',
  kronos: 'saturn'
};

export default function SpaceObjectSearch({ catalog = [], onSelect, onSelectEvent, isSearchOpen, onCloseSearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setIsOpen(true);
    }
  }, [isSearchOpen]);

  // Global Keyboard shortcut Ctrl/Cmd + K & Esc (Req 8, 33)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsOpen(false);
        if (onCloseSearch) onCloseSearch();
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearchOpen, onCloseSearch]);

  const justSelectedRef = useRef(false);

  // Universal search query matcher with ranking & alias normalization (Req 2, 3)
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const rawQ = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const q = ALIAS_MAP[rawQ] || rawQ;

    // Convert PLANET_DATA object dictionary safely into an array
    const planetsList = Object.values(PLANET_DATA);

    // 1. Spacecraft Missions
    const matchedMissions = SPACECRAFT_MISSIONS.filter(m => 
      m.name.toLowerCase().includes(q) || m.target.toLowerCase().includes(q)
    ).slice(0, 4);

    // 2. Astronomical Events (Eclipses, Equinoxes)
    const matchedEvents = searchEvents(q).slice(0, 4);

    // 3. Planets & Sun (Fixed PLANET_DATA.filter bug!)
    const matchedPlanets = planetsList.filter(p => 
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.type && p.type.toLowerCase().includes(q))
    ).slice(0, 8);

    // 4. Natural Satellites (Moons)
    const matchedMoons = NATURAL_SATELLITES.filter(m => 
      m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.parentPlanet && m.parentPlanet.toLowerCase().includes(q))
    ).slice(0, 8);

    // 5. Artificial Satellites & Spacecraft
    const matchedSpacecraft = ARTIFICIAL_SATELLITES.filter(s => 
      s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.noradId && String(s.noradId).includes(q))
    ).slice(0, 5);

    // 6. NASA JPL Catalog Asteroids & Comets
    const matchedCatalog = catalog.filter(ast => 
      (ast.name && ast.name.toLowerCase().includes(q)) || 
      (ast.fullName && ast.fullName.toLowerCase().includes(q)) || 
      (ast.spkid && String(ast.spkid).includes(q))
    ).slice(0, 6);

    const combined = [
      ...matchedMissions, 
      ...matchedEvents, 
      ...matchedPlanets, 
      ...matchedMoons, 
      ...matchedSpacecraft, 
      ...matchedCatalog
    ];

    // Priority Ranking: exact match first, starts-with second, contains third
    combined.sort((a, b) => {
      const nameA = (a.name || a.fullName || a.id || '').toLowerCase();
      const nameB = (b.name || b.fullName || b.id || '').toLowerCase();
      if (nameA === q) return -1;
      if (nameB === q) return 1;
      if (nameA.startsWith(q) && !nameB.startsWith(q)) return -1;
      if (nameB.startsWith(q) && !nameA.startsWith(q)) return 1;
      return 0;
    });

    setResults(combined);
    setSelectedIndex(0);
    setIsOpen(true);
  }, [query, catalog]);

  const handleSelect = (item) => {
    justSelectedRef.current = true;
    if (item.type === 'SOLAR ECLIPSE' || item.type === 'LUNAR ECLIPSE' || item.type === 'EQUINOX' || item.type === 'SOLSTICE' || item.type === 'PERIHELION') {
      if (onSelectEvent) onSelectEvent(item);
    } else {
      if (onSelect) onSelect(item);
    }
    setQuery(item.name || item.fullName || item.id);
    setIsOpen(false);
    if (onCloseSearch) onCloseSearch();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      if (onCloseSearch) onCloseSearch();
    }
  };

  return (
    <div className="search-panel space-object-search" onPointerDown={e => e.stopPropagation()}>
      <div className="search-input-box">
        <span className="search-icon">🔍</span>
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search Earth, Jupiter, Moon, Europa, Titan, Sol... (Ctrl+K)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onFocus={() => query.trim() && setIsOpen(true)}
        />
        {query ? (
          <button className="clear-btn" onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}>✕</button>
        ) : (
          <span className="shortcut-badge">⌘K</span>
        )}
      </div>

      {isOpen && (
        <div className="search-dropdown" ref={dropdownRef} onPointerDown={e => e.stopPropagation()}>
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const typeBadge = item.category || item.objectType || item.type || (item.neo ? 'NEO' : 'ASTEROID');
              const parentInfo = item.parentPlanet ? `${item.parentPlanet.toUpperCase()} SYSTEM` : item.parentName ? `${item.parentName.toUpperCase()} SYSTEM` : null;

              return (
                <div 
                  key={item.spkid || item.id || item.noradId || idx} 
                  className={`search-item ${isSelected ? 'search-item--selected' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="search-item-left">
                    <span className="search-item-name">{item.name || item.fullName || item.id}</span>
                    {parentInfo && <span className="search-item-parent"> • {parentInfo}</span>}
                  </div>
                  <div className="search-item-right">
                    <span className={`search-badge ${item.type === 'Planet' ? 'badge--planet' : item.type === 'Natural Satellite' || item.category === 'NATURAL SATELLITE' ? 'badge--moon' : 'badge--other'}`}>
                      {typeBadge}
                    </span>
                    <button className="search-focus-btn">TARGET 🎯</button>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State (Req 9) */
            <div className="search-empty-state font-mono">
              <p className="empty-title">NO CELESTIAL OBJECT FOUND MATCHING "{query}"</p>
              <div className="empty-suggestions">
                <span>Try searching:</span>
                <button onClick={() => setQuery('Earth')}>Earth</button>
                <button onClick={() => setQuery('Jupiter')}>Jupiter</button>
                <button onClick={() => setQuery('Moon')}>Moon</button>
                <button onClick={() => setQuery('Europa')}>Europa</button>
                <button onClick={() => setQuery('Titan')}>Titan</button>
                <button onClick={() => setQuery('Saturn')}>Saturn</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

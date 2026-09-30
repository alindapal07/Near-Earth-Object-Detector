import React, { useState, useEffect } from 'react';
import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES, ARTIFICIAL_SATELLITES } from '../data/satellites';
import { searchAsteroids } from '../api/spaceApi';

export default function SearchPanel({ catalog = [], onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const q = query.toLowerCase();

    // 1. Search Planets
    const matchedPlanets = Object.values(PLANET_DATA).filter(p => 
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );

    // 2. Search Natural Satellites (Moons)
    const matchedMoons = NATURAL_SATELLITES.filter(m => 
      m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.parentName && m.parentName.toLowerCase().includes(q))
    );

    // 3. Search Artificial Satellites & Spacecraft (Req 41)
    const matchedSpacecraft = ARTIFICIAL_SATELLITES.filter(s => 
      s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.noradId && String(s.noradId).includes(q))
    );

    // 4. Search local catalog asteroids
    const matchedCatalog = (catalog || []).filter(ast => 
      (ast.name && ast.name.toLowerCase().includes(q)) ||
      (ast.designation && ast.designation.toLowerCase().includes(q)) ||
      (ast.spkid && String(ast.spkid).includes(q))
    ).slice(0, 5);

    setResults([...matchedPlanets, ...matchedMoons, ...matchedSpacecraft, ...matchedCatalog]);
    setIsOpen(true);

    // 5. Remote asteroid search
    if (q.length >= 3 && matchedCatalog.length < 3) {
      searchAsteroids(query).then(res => {
        if (res.data) {
          setResults(prev => {
            const combined = [...matchedPlanets, ...matchedMoons, ...matchedSpacecraft, ...res.data.slice(0, 6)];
            const unique = [];
            const seen = new Set();
            for (const item of combined) {
              const key = item.spkid || item.id || item.noradId;
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
              }
            }
            return unique;
          });
        }
      }).catch(() => {});
    }
  }, [query, catalog]);

  const handleSelect = (item) => {
    onSelect(item);
    setQuery(item.name || item.fullName || item.id);
    setIsOpen(false);
  };

  return (
    <div className="search-panel">
      <div className="search-input-box">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search planets, moons (Europa, Titan), ISS, JWST..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
        />
        {query && (
          <button className="clear-btn" onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}>✕</button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((item, idx) => (
            <div 
              key={item.spkid || item.id || item.noradId || idx} 
              className="search-item"
              onClick={() => handleSelect(item)}
            >
              <div className="search-item-left">
                <span className="search-item-name">{item.name || item.fullName || item.id}</span>
                {item.parentName && <span className="search-item-parent"> ({item.parentName.toUpperCase()})</span>}
              </div>
              <span className="search-item-type">
                {item.category || item.objectType || item.type || (item.neo ? 'NEO Asteroid' : 'Asteroid')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

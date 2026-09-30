import React, { useState, useMemo } from 'react';
import { formatKm, formatAU, formatMass, formatPeriod, formatAngle } from '../../utils/formatters';
import { calculateSurfaceGravity, calculateEscapeVelocity, calculateOrbitalVelocity, validateScientificData } from '../../utils/orbitalMath';
import { PLANET_DATA } from '../../data/planets';
import { NATURAL_SATELLITES } from '../../data/satellites';
import PlanetPreviewCanvas from './PlanetPreviewCanvas';

/**
 * OrbitComparisonDiagram - 2D Top-Down Orbit-to-Orbit Comparison Canvas
 * Visualizes Object A and Object B orbital paths around the Sun together,
 * live positions driven by SimulationClock, orbital velocity vectors,
 * and real-time inter-object distance line.
 */
function OrbitComparisonDiagram({ objA, objB, simTimeDays = 0 }) {
  if (!objA || !objB) return null;

  const validA = validateScientificData(objA);
  const validB = validateScientificData(objB);

  const aA = validA.a || (objA.semiMajorAxisKm ? objA.semiMajorAxisKm / 149597870.7 : 1.0);
  const aB = validB.a || (objB.semiMajorAxisKm ? objB.semiMajorAxisKm / 149597870.7 : 1.52);

  const eA = validA.e !== undefined ? validA.e : (objA.eccentricity ?? 0.0167);
  const eB = validB.e !== undefined ? validB.e : (objB.eccentricity ?? 0.0934);

  const omegaA = objA.omegaDeg || objA.argPerihelionDeg || 0;
  const omegaB = objB.omegaDeg || objB.argPerihelionDeg || 0;

  const periodA = objA.orbitalPeriodDays || 365.25;
  const periodB = objB.orbitalPeriodDays || 686.98;

  const vA = ((simTimeDays / periodA) * Math.PI * 2) % (Math.PI * 2);
  const vB = ((simTimeDays / periodB) * Math.PI * 2) % (Math.PI * 2);

  const rAuA = (aA * (1 - eA * eA)) / (1 + eA * Math.cos(vA));
  const rAuB = (aB * (1 - eB * eB)) / (1 + eB * Math.cos(vB));

  const radA = (omegaA * Math.PI) / 180;
  const radB = (omegaB * Math.PI) / 180;

  const xA = rAuA * Math.cos(vA + radA);
  const yA = rAuA * Math.sin(vA + radA);

  const xB = rAuB * Math.cos(vB + radB);
  const yB = rAuB * Math.sin(vB + radB);

  const dxAU = xB - xA;
  const dyAU = yB - yA;
  const distAU = Math.sqrt(dxAU * dxAU + dyAU * dyAU);
  const distKm = distAU * 149597870.7;

  const vSpeedA = calculateOrbitalVelocity(aA, rAuA, undefined, true);
  const vSpeedB = calculateOrbitalVelocity(aB, rAuB, undefined, true);

  const center = { x: 170, y: 130 };
  const maxAu = Math.max(0.1, aA, aB);
  const scalePx = 105 / maxAu;

  const rxA = Math.max(12, aA * scalePx);
  const ryA = Math.max(10, rxA * Math.sqrt(Math.max(0.001, 1 - eA * eA)));
  const cPxA = rxA * eA;

  const rxB = Math.max(12, aB * scalePx);
  const ryB = Math.max(10, rxB * Math.sqrt(Math.max(0.001, 1 - eB * eB)));
  const cPxB = rxB * eB;

  const pxA = center.x + xA * scalePx;
  const pyA = center.y - yA * scalePx;

  const pxB = center.x + xB * scalePx;
  const pyB = center.y - yB * scalePx;

  return (
    <div className="sci-widget compare-orbit-diagram-box font-mono" style={{ marginTop: '12px' }}>
      <div className="widget-title">📡 ORBIT-TO-ORBIT 2D COMPARISON DIAGRAM (SYNCHRONIZED)</div>
      
      <div className="oil-telemetry-cockpit font-mono" style={{ marginTop: '8px', marginBottom: '8px' }}>
        <div className="t-cockpit-cell">
          <span className="t-lbl">INTER-OBJECT DISTANCE</span>
          <span className="t-val text-green">{formatAU(distAU, 4)}</span>
          <span className="t-sub">{formatKm(distKm, 0)}</span>
        </div>
        <div className="t-cockpit-cell">
          <span className="t-lbl">{objA.name.toUpperCase()} VELOCITY</span>
          <span className="t-val text-cyan">{vSpeedA.toFixed(2)} km/s</span>
          <span className="t-sub">Radius: {formatAU(rAuA, 3)}</span>
        </div>
        <div className="t-cockpit-cell">
          <span className="t-lbl">{objB.name.toUpperCase()} VELOCITY</span>
          <span className="t-val text-amber">{vSpeedB.toFixed(2)} km/s</span>
          <span className="t-sub">Radius: {formatAU(rAuB, 3)}</span>
        </div>
      </div>

      <div className="oil-diagram-wrap">
        <svg viewBox="0 0 340 260" className="oil-svg" style={{ maxWidth: '340px', maxHeight: '240px' }}>
          <defs>
            <radialGradient id="sunGlowGradComp" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffea00" stopOpacity="1" />
              <stop offset="60%" stopColor="#ff9100" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff3d00" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric Reference Grid */}
          <circle cx={center.x} cy={center.y} r="35" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
          <circle cx={center.x} cy={center.y} r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
          <circle cx={center.x} cy={center.y} r="105" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />

          {/* Orbit Ellipse A */}
          <g transform={`rotate(${omegaA}, ${center.x}, ${center.y})`}>
            <ellipse 
              cx={center.x - cPxA} 
              cy={center.y} 
              rx={rxA} 
              ry={ryA} 
              fill="none" 
              stroke="#00f0ff" 
              strokeWidth="1.6" 
              strokeDasharray="4 2"
              opacity="0.85"
            />
          </g>

          {/* Orbit Ellipse B */}
          <g transform={`rotate(${omegaB}, ${center.x}, ${center.y})`}>
            <ellipse 
              cx={center.x - cPxB} 
              cy={center.y} 
              rx={rxB} 
              ry={ryB} 
              fill="none" 
              stroke="#ffb703" 
              strokeWidth="1.6" 
              strokeDasharray="4 2"
              opacity="0.85"
            />
          </g>

          {/* Inter-object Distance Line */}
          <line x1={pxA} y1={pyA} x2={pxB} y2={pyB} stroke="#00ffaa" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x={(pxA + pxB)/2 + 4} y={(pyA + pyB)/2 - 4} fill="#00ffaa" fontSize="8" fontWeight="bold">
            d = {formatAU(distAU, 3)}
          </text>

          {/* Central Sun */}
          <circle cx={center.x} cy={center.y} r="10" fill="url(#sunGlowGradComp)" />
          <circle cx={center.x} cy={center.y} r="3" fill="#ffffff" />
          <text x={center.x - 14} y={center.y + 18} fill="#ffffff" fontSize="8" fontWeight="bold">SUN ☉</text>

          {/* Object A Marker */}
          <g>
            <circle cx={pxA} cy={pyA} r="6" fill="#00f0ff" stroke="#ffffff" strokeWidth="1.5" />
            <text x={pxA + 8} y={pyA - 4} fill="#00f0ff" fontSize="9" fontWeight="bold">
              {objA.name.toUpperCase()} (A)
            </text>
          </g>

          {/* Object B Marker */}
          <g>
            <circle cx={pxB} cy={pyB} r="6" fill="#ffb703" stroke="#ffffff" strokeWidth="1.5" />
            <text x={pxB + 8} y={pyB + 10} fill="#ffb703" fontSize="9" fontWeight="bold">
              {objB.name.toUpperCase()} (B)
            </text>
          </g>
        </svg>

        <div className="oil-legend font-mono" style={{ marginTop: '4px' }}>
          <span className="text-cyan">● {objA.name.toUpperCase()} ORBIT</span>
          <span>•</span>
          <span className="text-amber">● {objB.name.toUpperCase()} ORBIT</span>
          <span>•</span>
          <span className="text-green">-- INTER-OBJECT DISTANCE ({formatAU(distAU, 3)})</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Two-Object Side-by-Side Scientific Comparison Console
 * Part 25: NASA/JPL Scientific Exploration Upgrade
 */
export default function ComparisonModal({ isOpen, onClose, initialObjA, catalog = [], onFocusObject, simTimeDays = 0 }) {
  if (!isOpen) return null;

  // Fallback catalog if catalog prop is empty
  const fullCatalog = useMemo(() => {
    if (catalog && catalog.length > 0) return catalog;
    const planetsList = Object.values(PLANET_DATA);
    return [...planetsList, ...NATURAL_SATELLITES];
  }, [catalog]);

  const [objAId, setObjAId] = useState(initialObjA?.id || 'earth');
  const [objBId, setObjBId] = useState(() => {
    if (initialObjA?.id === 'jupiter') return 'earth';
    return 'jupiter';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'PLANET' | 'MOON' | 'SMALL_BODY' | 'SPACECRAFT'
  const [humanMassKg, setHumanMassKg] = useState(70);

  const objA = fullCatalog.find(o => o.id === objAId || o.spkid === objAId) || initialObjA || fullCatalog[0];
  const objB = fullCatalog.find(o => o.id === objBId || o.spkid === objBId) || fullCatalog.find(o => o.id === 'jupiter' || o.id === 'mars') || fullCatalog[1];

  const isSameObject = objA && objB && (objA.id === objB.id || (objA.spkid && objA.spkid === objB.spkid));

  // Filtered catalog for selectors with partial matching
  const filteredCatalog = useMemo(() => {
    let list = fullCatalog;
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'PLANET') list = list.filter(o => o.type === 'Planet' || o.type === 'Dwarf Planet');
      else if (categoryFilter === 'MOON') list = list.filter(o => o.category === 'NATURAL SATELLITE' || o.type === 'Natural Satellite');
      else if (categoryFilter === 'SMALL_BODY') list = list.filter(o => o.spkid || o.orbitClass || o.neo || o.pha);
      else if (categoryFilter === 'SPACECRAFT') list = list.filter(o => o.category === 'ARTIFICIAL SATELLITE' || o.type === 'SPACECRAFT');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => (o.name || o.id || o.designation || '').toLowerCase().includes(q));
    }
    return list;
  }, [fullCatalog, categoryFilter, searchQuery]);

  // Scientific data extraction
  const validDataA = validateScientificData(objA);
  const validDataB = validateScientificData(objB);

  const rA = validDataA.radiusKm || 6371;
  const rB = validDataB.radiusKm || 69911;
  const maxR = Math.max(rA, rB);
  const pctRadiusA = Math.min(100, Math.max(6, (rA / maxR) * 100));
  const pctRadiusB = Math.min(100, Math.max(6, (rB / maxR) * 100));

  // Volume calculations (V = 4/3 pi R^3)
  const volA = (4 / 3) * Math.PI * Math.pow(rA, 3);
  const volB = (4 / 3) * Math.PI * Math.pow(rB, 3);
  const volRatio = (volA / volB).toFixed(2);

  const mA = validDataA.massKg ? Number(validDataA.massKg) : 5.972e24;
  const mB = validDataB.massKg ? Number(validDataB.massKg) : 1.898e27;

  // Logarithmic Mass scale calculation
  let pctMassA = 50;
  let pctMassB = 50;
  if (mA && mB && mA > 0 && mB > 0) {
    const logA = Math.log10(mA);
    const logB = Math.log10(mB);
    const maxLog = Math.max(logA, logB);
    const minLog = Math.min(logA, logB);
    const range = Math.max(1, maxLog - minLog + 2);
    pctMassA = Math.min(100, Math.max(8, ((logA - (minLog - 1)) / range) * 100));
    pctMassB = Math.min(100, Math.max(8, ((logB - (minLog - 1)) / range) * 100));
  }

  const gA = objA?.gravity !== undefined ? Number(objA.gravity) : calculateSurfaceGravity(mA, rA);
  const gB = objB?.gravity !== undefined ? Number(objB.gravity) : calculateSurfaceGravity(mB, rB);
  const maxG = Math.max(gA || 1, gB || 1);
  const pctG_A = gA ? Math.min(100, Math.max(6, (gA / maxG) * 100)) : 0;
  const pctG_B = gB ? Math.min(100, Math.max(6, (gB / maxG) * 100)) : 0;

  const weightA = ((humanMassKg * gA) / 9.80665).toFixed(1);
  const weightB = ((humanMassKg * gB) / 9.80665).toFixed(1);

  const vEscA = objA?.escapeVelocity !== undefined ? Number(objA.escapeVelocity) : calculateEscapeVelocity(mA, rA);
  const vEscB = objB?.escapeVelocity !== undefined ? Number(objB.escapeVelocity) : calculateEscapeVelocity(mB, rB);

  const aA = validDataA.a || (objA?.semiMajorAxisKm ? objA.semiMajorAxisKm / 149597870.7 : 1.0);
  const aB = validDataB.a || (objB?.semiMajorAxisKm ? objB.semiMajorAxisKm / 149597870.7 : 5.2);

  const handleSwap = () => {
    const temp = objAId;
    setObjAId(objBId);
    setObjBId(temp);
  };

  const handleRemoveB = () => {
    onClose();
  };

  return (
    <div className="modal-overlay compare-modal-overlay" onClick={onClose}>
      <div className="modal-content compare-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header compare-modal-header">
          <div className="compare-header-title font-mono">
            <span>⚖ SCIENTIFIC NASA/JPL TWO-OBJECT COMPARISON SYSTEM</span>
            <span className="compare-subtitle-tag">{objA.name.toUpperCase()} VS {objB.name.toUpperCase()}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close comparison console (Esc)">✕</button>
        </div>

        {/* Same Object Warning Banner */}
        {isSameObject && (
          <div className="compare-warning-banner font-mono">
            ⚠ SELECT A DIFFERENT SECOND OBJECT TO ENABLE COMPARISON ANALYTICS
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="compare-filter-bar font-mono">
          <input 
            type="text" 
            className="compare-search-input" 
            placeholder="🔍 Search object name (e.g. Earth, Europa, Ceres, Jupiter, Moon)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="compare-cat-pills">
            {['ALL', 'PLANET', 'MOON', 'SMALL_BODY', 'SPACECRAFT'].map(cat => (
              <button 
                key={cat} 
                className={`compare-pill ${categoryFilter === cat ? 'compare-pill--active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Object Selectors Bar */}
        <div className="compare-selectors font-mono">
          <div className="compare-select-box">
            <label>OBJECT A (PRIMARY):</label>
            <select value={objAId} onChange={(e) => setObjAId(e.target.value)}>
              {filteredCatalog.map(o => (
                <option key={o.id || o.spkid} value={o.id || o.spkid}>
                  {o.name || o.id} [{o.category || o.type || 'CELESTIAL'}]
                </option>
              ))}
            </select>
          </div>

          <button 
            type="button"
            className="compare-vs compare-swap-btn"
            title="Swap Primary & Secondary Objects (⇄)"
            onClick={handleSwap}
          >
            ⇄ SWAP
          </button>

          <div className="compare-select-box">
            <label>OBJECT B (SECONDARY):</label>
            <select value={objBId} onChange={(e) => setObjBId(e.target.value)}>
              {filteredCatalog.map(o => (
                <option key={o.id || o.spkid} value={o.id || o.spkid}>
                  {o.name || o.id} [{o.category || o.type || 'CELESTIAL'}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3D Physical Object Visual Preview Pair */}
        <div className="compare-visual-previews-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '12px 0' }}>
          <div className="sci-widget compare-preview-card font-mono">
            <div className="widget-title text-cyan">PRIMARY OBJECT A: {objA.name.toUpperCase()}</div>
            <PlanetPreviewCanvas obj={objA} isFollowing={false} />
          </div>

          <div className="sci-widget compare-preview-card font-mono">
            <div className="widget-title text-amber">SECONDARY OBJECT B: {objB.name.toUpperCase()}</div>
            <PlanetPreviewCanvas obj={objB} isFollowing={false} />
          </div>
        </div>

        {/* Orbit-to-Orbit 2D Diagram */}
        <OrbitComparisonDiagram objA={objA} objB={objB} simTimeDays={simTimeDays} />

        {/* 70 kg Human Mass Weight Calculator Box */}
        <div className="sci-widget human-weight-calc-box font-mono" style={{ marginTop: '12px' }}>
          <div className="widget-title">🧑 HUMAN SURFACE WEIGHT COMPARATOR ({humanMassKg} kg MASS)</div>
          <div className="weight-calc-flex">
            <div className="weight-input-wrap">
              <label>Human Mass:</label>
              <input 
                type="number" 
                value={humanMassKg} 
                onChange={e => setHumanMassKg(Number(e.target.value) || 70)}
                className="weight-input"
              />
              <span>kg</span>
            </div>

            <div className="weight-results-grid">
              <div className="w-result-cell">
                <span className="w-lbl">{objA.name}:</span>
                <span className="w-val text-cyan">{weightA} kgf ({((gA / 9.80665) * 100).toFixed(0)}% Earth)</span>
              </div>
              <div className="w-result-cell">
                <span className="w-lbl">{objB.name}:</span>
                <span className="w-val text-amber">{weightB} kgf ({((gB / 9.80665) * 100).toFixed(0)}% Earth)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Scale & Volume Comparisons Box */}
        <div className="compare-visual-box font-mono" style={{ marginTop: '12px' }}>
          {/* Physical Radius Scale */}
          <div className="comp-vis-section">
            <div className="comp-vis-header">
              <span>PHYSICAL RADIUS COMPARISON (TRUE RATIO)</span>
              <span className="comp-ratio-badge">Ratio: {(rA / rB).toFixed(2)}×</span>
            </div>
            
            <div className="comp-vis-row">
              <span className="comp-vis-label">{objA.name}</span>
              <div className="comp-vis-track">
                <div className="comp-vis-fill comp-vis-fill--a" style={{ width: `${pctRadiusA}%` }} />
              </div>
              <span className="comp-vis-num">{formatKm(rA, 0)}</span>
            </div>

            <div className="comp-vis-row">
              <span className="comp-vis-label">{objB.name}</span>
              <div className="comp-vis-track">
                <div className="comp-vis-fill comp-vis-fill--b" style={{ width: `${pctRadiusB}%` }} />
              </div>
              <span className="comp-vis-num">{formatKm(rB, 0)}</span>
            </div>
          </div>

          {/* Volume Scale */}
          <div className="comp-vis-section" style={{ marginTop: '10px' }}>
            <div className="comp-vis-header">
              <span>PHYSICAL VOLUME COMPARISON V = 4/3 πR³</span>
              <span className="comp-ratio-badge">Volume Ratio: {volRatio}×</span>
            </div>
            <div className="comp-vis-row">
              <span className="comp-vis-label">{objA.name}</span>
              <span className="comp-vis-num text-cyan">{(volA / 1e9).toExponential(2)} km³</span>
            </div>
            <div className="comp-vis-row">
              <span className="comp-vis-label">{objB.name}</span>
              <span className="comp-vis-num text-amber">{(volB / 1e9).toExponential(2)} km³</span>
            </div>
          </div>

          {/* Surface Gravity Scale */}
          {gA != null && gB != null && (
            <div className="comp-vis-section" style={{ marginTop: '10px' }}>
              <div className="comp-vis-header">
                <span>SURFACE GRAVITY COMPARISON (m/s²)</span>
                <span className="comp-ratio-badge">Ratio: {(gA / gB).toFixed(2)}×</span>
              </div>
              
              <div className="comp-vis-row">
                <span className="comp-vis-label">{objA.name}</span>
                <div className="comp-vis-track">
                  <div className="comp-vis-fill comp-vis-fill--a" style={{ width: `${pctG_A}%` }} />
                </div>
                <span className="comp-vis-num">{gA.toFixed(2)} m/s²</span>
              </div>

              <div className="comp-vis-row">
                <span className="comp-vis-label">{objB.name}</span>
                <div className="comp-vis-track">
                  <div className="comp-vis-fill comp-vis-fill--b" style={{ width: `${pctG_B}%` }} />
                </div>
                <span className="comp-vis-num">{gB.toFixed(2)} m/s²</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Substituted Physics Formulas Panel */}
        <div className="sci-widget live-equations-panel font-mono" style={{ marginTop: '12px' }}>
          <div className="widget-title">📐 LIVE SUBSTITUTED PHYSICS EQUATIONS [ƒx]</div>
          <div className="equations-grid">
            <div className="eq-card">
              <div className="eq-title text-cyan">Surface Gravity g = GM / R²</div>
              <div className="eq-sub">
                {objA.name}: g = (6.674e-11 × {mA.toExponential(2)}) / ({rA * 1000}m)² = <strong className="text-cyan">{gA.toFixed(2)} m/s²</strong>
              </div>
              <div className="eq-sub">
                {objB.name}: g = (6.674e-11 × {mB.toExponential(2)}) / ({rB * 1000}m)² = <strong className="text-amber">{gB.toFixed(2)} m/s²</strong>
              </div>
            </div>

            <div className="eq-card">
              <div className="eq-title text-green">Escape Velocity v_esc = √(2GM / R)</div>
              <div className="eq-sub">
                {objA.name}: v_esc = √(2 × 6.674e-11 × {mA.toExponential(2)} / {rA * 1000}) = <strong className="text-cyan">{vEscA.toFixed(2)} km/s</strong>
              </div>
              <div className="eq-sub">
                {objB.name}: v_esc = √(2 × 6.674e-11 × {mB.toExponential(2)} / {rB * 1000}) = <strong className="text-amber">{vEscB.toFixed(2)} km/s</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Scientific Comparison Table */}
        <div className="compare-table-wrap" style={{ marginTop: '12px' }}>
          <table className="compare-table font-mono">
            <thead>
              <tr>
                <th>SCIENTIFIC PROPERTY</th>
                <th className="col-a">{objA.name.toUpperCase()}</th>
                <th className="col-b">{objB.name.toUpperCase()}</th>
                <th>RATIO (A / B)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Category / Class</td>
                <td>{objA.category || objA.type}</td>
                <td>{objB.category || objB.type}</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Physical Radius</td>
                <td>{formatKm(rA, 1)}</td>
                <td>{formatKm(rB, 1)}</td>
                <td>{(rA / rB).toFixed(3)} ×</td>
              </tr>
              <tr>
                <td>Physical Diameter</td>
                <td>{formatKm(rA * 2, 1)}</td>
                <td>{formatKm(rB * 2, 1)}</td>
                <td>{(rA / rB).toFixed(3)} ×</td>
              </tr>
              <tr>
                <td>Physical Volume</td>
                <td>{(volA / 1e9).toExponential(2)} km³</td>
                <td>{(volB / 1e9).toExponential(2)} km³</td>
                <td>{volRatio} ×</td>
              </tr>
              <tr>
                <td>Mass</td>
                <td>{formatMass(mA)}</td>
                <td>{formatMass(mB)}</td>
                <td>{mA && mB ? `${(mA / mB).toExponential(2)} ×` : '—'}</td>
              </tr>
              <tr>
                <td>Mean Density</td>
                <td>{objA?.density ? `${objA.density} g/cm³` : '—'}</td>
                <td>{objB?.density ? `${objB.density} g/cm³` : '—'}</td>
                <td>{objA?.density && objB?.density ? `${(objA.density / objB.density).toFixed(2)} ×` : '—'}</td>
              </tr>
              <tr>
                <td>Surface Gravity</td>
                <td>{gA != null ? `${gA.toFixed(2)} m/s²` : '—'}</td>
                <td>{gB != null ? `${gB.toFixed(2)} m/s²` : '—'}</td>
                <td>{gA != null && gB != null ? `${(gA / gB).toFixed(2)} ×` : '—'}</td>
              </tr>
              <tr>
                <td>Escape Velocity</td>
                <td>{vEscA != null ? `${vEscA.toFixed(2)} km/s` : '—'}</td>
                <td>{vEscB != null ? `${vEscB.toFixed(2)} km/s` : '—'}</td>
                <td>{vEscA != null && vEscB != null ? `${(vEscA / vEscB).toFixed(2)} ×` : '—'}</td>
              </tr>
              <tr>
                <td>Semi-Major Axis (a)</td>
                <td>{formatAU(aA, 3)}</td>
                <td>{formatAU(aB, 3)}</td>
                <td>{aA && aB ? `${(aA / aB).toFixed(2)} ×` : '—'}</td>
              </tr>
              <tr>
                <td>Orbital Period</td>
                <td>{formatPeriod(objA.orbitalPeriodDays)}</td>
                <td>{formatPeriod(objB.orbitalPeriodDays)}</td>
                <td>
                  {objA.orbitalPeriodDays && objB.orbitalPeriodDays 
                    ? `${(objA.orbitalPeriodDays / objB.orbitalPeriodDays).toFixed(2)} ×` 
                    : '—'}
                </td>
              </tr>
              <tr>
                <td>Axial Tilt</td>
                <td>{formatAngle(objA.axialTiltDeg, 2)}</td>
                <td>{formatAngle(objB.axialTiltDeg, 2)}</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Rotation Period</td>
                <td>{objA.rotationPeriodHours ? `${objA.rotationPeriodHours}h` : '—'}</td>
                <td>{objB.rotationPeriodHours ? `${objB.rotationPeriodHours}h` : '—'}</td>
                <td>
                  {objA.rotationPeriodHours && objB.rotationPeriodHours 
                    ? `${(objA.rotationPeriodHours / objB.rotationPeriodHours).toFixed(2)} ×` 
                    : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Controls */}
        <div className="compare-actions font-mono" style={{ marginTop: '16px' }}>
          <button className="compare-btn compare-btn--focus" onClick={() => { onFocusObject && onFocusObject(objA); }}>
            🔭 FOCUS {objA.name.toUpperCase()}
          </button>
          <button className="compare-btn compare-btn--focus" onClick={() => { onFocusObject && onFocusObject(objB); }}>
            🔭 FOCUS {objB.name.toUpperCase()}
          </button>
          <button className="compare-btn compare-btn--swap" onClick={handleSwap}>
            ⇄ SWAP A / B
          </button>
          <button className="compare-btn compare-btn--close" onClick={handleRemoveB}>
            ✕ BACK TO OBJECT
          </button>
        </div>
      </div>
    </div>
  );
}




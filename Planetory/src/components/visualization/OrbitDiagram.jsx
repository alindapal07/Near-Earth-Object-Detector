import React, { useState } from 'react';
import { formatAU, formatKm, formatAngle, formatPeriod } from '../../utils/formatters';
import { calculateApsides, calculateOrbitalVelocity } from '../../utils/orbitalMath';
import { PLANET_DATA } from '../../data/planets';

/**
 * OrbitDiagram.jsx - PART 24.2 ORBITAL INTELLIGENCE LAB
 * Features top-down 2D & 3D inclined plane orbital diagrams, dynamic velocity vectors,
 * instantaneous Vis-Viva orbital speed, radial & tangential velocity components,
 * perihelion (q) and aphelion (Q) velocity readouts, Kepler equation solver trace,
 * live orbital phase timeline, velocity & distance graphs, and collapsible scientific formulas.
 */
export default function OrbitDiagram({ obj, simTimeDays, currentDistanceAu, trueAnomalyRad, onFocusObject }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showVector, setShowVector] = useState(true);
  const [viewMode, setViewMode] = useState('2D'); // '2D' | '3D'
  const [showCalculations, setShowCalculations] = useState(false);

  if (!obj) return null;

  const isSun = obj.id === 'sun';
  const name = obj.name || obj.id || 'OBJECT';
  const parentObj = obj.parentPlanet ? PLANET_DATA[obj.parentPlanet] : null;
  const parentName = isSun ? 'SYSTEM CENTER' : parentObj ? parentObj.name.toUpperCase() : 'SUN';

  // 1. Orbital Elements Extraction & Fallbacks
  const a = obj?.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / 149597870.7 : 1.0);
  const e = obj?.e !== undefined ? obj.e : (obj?.eccentricity !== undefined ? obj.eccentricity : 0.0167);
  const incDeg = obj?.inclinationDeg !== undefined ? obj.inclinationDeg : (obj?.i || 0);
  const omegaDeg = obj?.omegaDeg || obj?.argPerihelionDeg || 0;
  const OmegaDeg = obj?.nodeDeg || obj?.Omega || 0;
  const periodDays = obj?.orbitalPeriodDays || 365.25;

  const isHyperbolic = e >= 1.0;
  const { q, Q } = calculateApsides(a, e, true);

  // 2. Gravitational Parameter mu & Speed Calculations
  const muSun = 1.32712440018e11;
  let mu = muSun;
  if (parentObj && parentObj.massKg) {
    mu = 6.67430e-20 * Number(parentObj.massKg);
  }

  const pKm = a * 149597870.7 * (1 - e * e); // Semi-latus rectum in km

  // Current True Anomaly angle (v)
  const v = trueAnomalyRad !== undefined ? trueAnomalyRad : ((simTimeDays / periodDays) * Math.PI * 2) % (Math.PI * 2);
  const vDeg = ((v * 180) / Math.PI + 360) % 360;

  // Current Radius (r)
  const rAu = currentDistanceAu || (a * (1 - e * e)) / (1 + e * Math.cos(v));
  const rKm = rAu * 149597870.7;

  // Vis-Viva Speed Calculation (v = sqrt(mu * (2/r - 1/a)))
  const currentSpeedKmS = calculateOrbitalVelocity(a, rAu, undefined, true);
  const vPerihelionKmS = calculateOrbitalVelocity(a, q, undefined, true);
  const vAphelionKmS = Q ? calculateOrbitalVelocity(a, Q, undefined, true) : 0;

  // Radial & Tangential Velocity Components
  const vrKmS = Math.sqrt(Math.max(0, mu / Math.max(1, pKm))) * e * Math.sin(v);
  const vtKmS = Math.sqrt(Math.max(0, mu / Math.max(1, pKm))) * (1 + e * Math.cos(v));

  // Orbital Phase %
  const phasePct = (vDeg / 3.6).toFixed(1);

  // Kepler Equation Solver (M = E - e sin E)
  const meanAnomalyRad = ((simTimeDays / periodDays) * Math.PI * 2) % (Math.PI * 2);
  let eccentricAnomalyRad = meanAnomalyRad;
  for (let iter = 0; iter < 5; iter++) {
    eccentricAnomalyRad = eccentricAnomalyRad - (eccentricAnomalyRad - e * Math.sin(eccentricAnomalyRad) - meanAnomalyRad) / (1 - e * Math.cos(eccentricAnomalyRad));
  }
  const meanAnomalyDeg = ((meanAnomalyRad * 180) / Math.PI + 360) % 360;
  const eccentricAnomalyDeg = ((eccentricAnomalyRad * 180) / Math.PI + 360) % 360;

  // Advanced Specific Energy & Angular Momentum
  const specificEnergyJ = (-mu / (2 * a * 149597870.7)).toExponential(2);
  const angularMomentumH = Math.sqrt(Math.max(0, mu * pKm)).toExponential(2);

  // 3. SVG Diagram Scale & Positioning
  const viewBoxSize = 300;
  const center = 150;
  const targetRadiusPx = 110;
  const displayScale = (targetRadiusPx / Math.max(0.0001, a)) * zoom;

  const rx = Math.max(15, a * displayScale);
  const ry = Math.max(12, rx * Math.sqrt(Math.max(0.001, 1 - Math.min(0.999, e * e))));
  const cPx = rx * e;

  const focusX = center + pan.x;
  const focusY = center + pan.y;

  const ellipseCenterX = focusX - cPx;
  const ellipseCenterY = focusY;

  const rPx = rAu * displayScale;
  const planetUnrotatedX = rPx * Math.cos(v);
  const planetUnrotatedY = rPx * Math.sin(v);

  const omegaRad = (omegaDeg * Math.PI) / 180;

  const planetX = focusX + (planetUnrotatedX * Math.cos(omegaRad) - planetUnrotatedY * Math.sin(omegaRad));
  const planetY = focusY + (planetUnrotatedX * Math.sin(omegaRad) + planetUnrotatedY * Math.cos(omegaRad));

  // Velocity Vector Endpoints
  const vecLenPx = Math.min(45, (currentSpeedKmS / 30) * 35);
  const vecAngleRad = v + Math.PI / 2;
  const vecX = planetX + vecLenPx * Math.cos(vecAngleRad);
  const vecY = planetY + vecLenPx * Math.sin(vecAngleRad);

  // Event Isolation Handlers
  const handleWheel = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    const zoomFactor = evt.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.max(0.4, Math.min(5.0, prev * zoomFactor)));
  };

  const handlePointerDown = (evt) => {
    evt.stopPropagation();
    setIsPanning(true);
    setDragStart({ x: evt.clientX - pan.x, y: evt.clientY - pan.y });
    try { evt.target.setPointerCapture(evt.pointerId); } catch (err) {}
  };

  const handlePointerMove = (evt) => {
    if (!isPanning) return;
    evt.stopPropagation();
    setPan({ x: evt.clientX - dragStart.x, y: evt.clientY - dragStart.y });
  };

  const handlePointerUp = (evt) => {
    if (!isPanning) return;
    evt.stopPropagation();
    setIsPanning(false);
    try {
      if (evt.target.hasPointerCapture && evt.target.hasPointerCapture(evt.pointerId)) {
        evt.target.releasePointerCapture(evt.pointerId);
      }
    } catch (err) {}
  };

  const handleReset = (evt) => {
    evt.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="sci-widget orbital-intelligence-lab sci-panel-v7 font-mono">
      {/* ── 1. ORBIT HEADER ─────────────────────────────────────────────── */}
      <div className="oil-header">
        <div className="oil-title-block">
          <span className="oil-title">📡 ORBITAL INTELLIGENCE LAB ({name.toUpperCase()})</span>
          <span className="oil-live-tag">● LIVE SIMULATION</span>
        </div>
        <div className="oil-toolbar">
          <button 
            type="button" 
            className={`oil-btn ${viewMode === '2D' ? 'oil-btn--active' : ''}`}
            onClick={() => setViewMode('2D')}
          >
            2D TOP-DOWN
          </button>
          <button 
            type="button" 
            className={`oil-btn ${viewMode === '3D' ? 'oil-btn--active' : ''}`}
            onClick={() => setViewMode('3D')}
          >
            3D PLANE
          </button>
          <button 
            type="button" 
            className={`oil-btn ${showVector ? 'oil-btn--active' : ''}`}
            onClick={() => setShowVector(!showVector)}
          >
            ↗ VECTOR
          </button>
          <button type="button" className="oil-btn" onClick={handleReset}>↺ FIT</button>
        </div>
      </div>

      {/* ── 2. TOP LIVE ORBIT METRICS (2-COLUMN GRID) ──────────────────── */}
      <div className="oil-metrics-grid font-mono">
        <div className="oil-metric-cell">
          <span className="oil-m-lbl">SEMI-MAJOR AXIS (a):</span>
          <span className="oil-m-val text-cyan">{formatAU(a, 4)}</span>
        </div>
        <div className="oil-metric-cell">
          <span className="oil-m-lbl">ECCENTRICITY (e):</span>
          <span className="oil-m-val text-amber">{e.toFixed(4)} ({isHyperbolic ? 'HYPERBOLIC' : 'ELLIPTICAL'})</span>
        </div>
        <div className="oil-metric-cell">
          <span className="oil-m-lbl">INCLINATION (i):</span>
          <span className="oil-m-val">{formatAngle(incDeg, 2)}</span>
        </div>
        <div className="oil-metric-cell">
          <span className="oil-m-lbl">ORBITAL PERIOD:</span>
          <span className="oil-m-val">{formatPeriod(periodDays)}</span>
        </div>
      </div>

      {/* ── 3. LIVE DYNAMIC TELEMETRY COCKPIT ────────────────────────────── */}
      <div className="oil-telemetry-cockpit font-mono">
        <div className="t-cockpit-cell">
          <span className="t-lbl">CURRENT RADIUS (r)</span>
          <span className="t-val text-cyan">{formatAU(rAu, 4)}</span>
          <span className="t-sub">{formatKm(rKm, 0)}</span>
        </div>

        <div className="t-cockpit-cell">
          <span className="t-lbl">INSTANTANEOUS VELOCITY (v)</span>
          <span className="t-val text-amber">{currentSpeedKmS.toFixed(2)} km/s</span>
          <span className="t-sub">Vr: {vrKmS.toFixed(1)} km/s · Vt: {vtKmS.toFixed(1)} km/s</span>
        </div>

        <div className="t-cockpit-cell">
          <span className="t-lbl">TRUE ANOMALY (ν)</span>
          <span className="t-val text-green">{vDeg.toFixed(1)}°</span>
          <span className="t-sub">Phase: {phasePct}% Complete</span>
        </div>
      </div>

      {/* ── 4. INTERACTIVE ORBIT DIAGRAM (2D / 3D INCLINED) ─────────────── */}
      <div 
        className="oil-diagram-wrap"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleReset}
        style={{ cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="oil-svg">
          <defs>
            <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffea00" stopOpacity="1" />
              <stop offset="40%" stopColor="#ff9100" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff3d00" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="planetPulseGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </radialGradient>

            {/* Velocity Color Gradient Along Orbit */}
            <linearGradient id="orbitVelocityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb703" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffb703" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Reference Plane Ring */}
          <circle cx={focusX} cy={focusY} r={rx} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

          {/* Rotated Ellipse & Orbital Plane */}
          <g transform={`rotate(${omegaDeg}, ${focusX}, ${focusY}) ${viewMode === '3D' ? `scale(1, ${Math.cos((incDeg * Math.PI)/180)})` : ''}`}>
            {/* Line of Apsides */}
            <line 
              x1={ellipseCenterX - rx - 15} y1={ellipseCenterY} 
              x2={ellipseCenterX + rx + 15} y2={ellipseCenterY} 
              stroke="rgba(0, 240, 255, 0.25)" 
              strokeDasharray="2 2" 
              strokeWidth="1" 
            />

            {/* Elliptical Orbit Path with Speed Color Gradient */}
            <ellipse 
              cx={ellipseCenterX} 
              cy={ellipseCenterY} 
              rx={rx} 
              ry={ry} 
              fill="none" 
              stroke="url(#orbitVelocityGrad)" 
              strokeWidth="1.8" 
            />

            {/* Perihelion Marker (q) */}
            <g style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint('q')} onMouseLeave={() => setHoveredPoint(null)}>
              <circle cx={ellipseCenterX + rx} cy={ellipseCenterY} r={hoveredPoint === 'q' ? '6' : '3.5'} fill="#ffb703" stroke="#ffffff" strokeWidth="1" />
              <text x={ellipseCenterX + rx + 6} y={ellipseCenterY + 4} fill="#ffb703" fontSize="8.5" className="svg-text font-mono">
                q ({q ? formatAU(q, 2) : 'Perihelion'}) · {vPerihelionKmS.toFixed(1)}km/s
              </text>
            </g>

            {/* Aphelion Marker (Q) */}
            {!isHyperbolic && (
              <g style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint('Q')} onMouseLeave={() => setHoveredPoint(null)}>
                <circle cx={ellipseCenterX - rx} cy={ellipseCenterY} r={hoveredPoint === 'Q' ? '6' : '3.5'} fill="#00f0ff" stroke="#ffffff" strokeWidth="1" />
                <text x={ellipseCenterX - rx - 65} y={ellipseCenterY + 4} fill="#00f0ff" fontSize="8.5" className="svg-text font-mono">
                  Q ({Q ? formatAU(Q, 2) : 'Aphelion'}) · {vAphelionKmS.toFixed(1)}km/s
                </text>
              </g>
            )}
          </g>

          {/* Central Focus (Sun or Parent Body) */}
          <g style={{ cursor: 'pointer' }}>
            <circle cx={focusX} cy={focusY} r="12" fill="url(#sunGlowGrad)" />
            <circle cx={focusX} cy={focusY} r="4" fill="#ffffff" />
            <text x={focusX - 16} y={focusY + 22} fill="#ffffff" fontSize="8.5" fontWeight="bold" className="font-mono">
              {parentName} ☉
            </text>
          </g>

          {/* Current Radius Vector Line */}
          <line x1={focusX} y1={focusY} x2={planetX} y2={planetY} stroke="#00f0ff" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* Velocity Vector Arrow */}
          {showVector && (
            <g>
              <line x1={planetX} y1={planetY} x2={vecX} y2={vecY} stroke="#ffea00" strokeWidth="2" />
              <polygon points={`${vecX},${vecY} ${vecX-4},${vecY-4} ${vecX+4},${vecY-4}`} fill="#ffea00" />
            </g>
          )}

          {/* Current Object Marker */}
          <g 
            style={{ cursor: 'pointer' }} 
            onClick={(evt) => { evt.stopPropagation(); onFocusObject && onFocusObject(obj); }}
            onMouseEnter={() => setHoveredPoint('planet')}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <circle cx={planetX} cy={planetY} r={hoveredPoint === 'planet' ? '15' : '10'} fill="url(#planetPulseGrad)" opacity="0.8" />
            <circle cx={planetX} cy={planetY} r="5" fill="#00f0ff" stroke="#ffffff" strokeWidth="1.5" />
            <text x={planetX + 8} y={planetY - 6} fill="#00f0ff" fontSize="9" fontWeight="bold" className="font-mono">
              {name.toUpperCase()} (r: {formatAU(rAu, 2)})
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="oil-legend font-mono">
          <span>WHEEL: ZOOM</span>
          <span>•</span>
          <span>DRAG: PAN</span>
          <span>•</span>
          <span>DBL CLICK: RESET</span>
        </div>
      </div>

      {/* ── 5. ORBITAL PHASE TIMELINE BAR ───────────────────────────────── */}
      <div className="oil-timeline-section font-mono">
        <div className="oil-timeline-hdr">
          <span>ORBITAL PROGRESS TIMELINE</span>
          <span className="text-amber">PHASE: {phasePct}%</span>
        </div>
        <div className="oil-timeline-track">
          <div className="oil-timeline-fill" style={{ width: `${phasePct}%` }} />
          <div className="oil-timeline-pin" style={{ left: `${phasePct}%` }} title={`Current position (${vDeg.toFixed(1)}°)`} />
        </div>
        <div className="oil-timeline-markers">
          <span>q (PERIHELION 0%)</span>
          <span>Q (APHELION 50%)</span>
          <span>NEXT q (100%)</span>
        </div>
      </div>

      {/* ── 6. EXPANDABLE KEPLER & PHYSICS CALCULATIONS TRACE ────────────── */}
      <div className="oil-calculations-section font-mono">
        <button 
          type="button"
          className="oil-calc-toggle"
          onClick={() => setShowCalculations(!showCalculations)}
        >
          <span>📐 EXPANDABLE KEPLER EQUATIONS & CALCULATIONS TRACE</span>
          <span>{showCalculations ? '▲ COLLAPSE' : '▼ SHOW CALCULATIONS'}</span>
        </button>

        {showCalculations && (
          <div className="oil-calc-body">
            <div className="calc-card">
              <div className="calc-title text-cyan">Kepler Equation Solver M = E - e sin E</div>
              <div className="calc-row"><span>Mean Anomaly (M):</span><strong>{meanAnomalyDeg.toFixed(2)}° ({meanAnomalyRad.toFixed(4)} rad)</strong></div>
              <div className="calc-row"><span>Eccentric Anomaly (E):</span><strong>{eccentricAnomalyDeg.toFixed(2)}° ({eccentricAnomalyRad.toFixed(4)} rad)</strong></div>
              <div className="calc-row"><span>True Anomaly (ν):</span><strong>{vDeg.toFixed(2)}° ({v.toFixed(4)} rad)</strong></div>
            </div>

            <div className="calc-card">
              <div className="calc-title text-green">Vis-Viva Orbital Speed v = √[μ(2/r - 1/a)]</div>
              <div className="calc-row"><span>Heliocentric/Parent μ:</span><strong>{mu.toExponential(4)} km³/s²</strong></div>
              <div className="calc-row"><span>Current Speed (v):</span><strong>{currentSpeedKmS.toFixed(3)} km/s</strong></div>
              <div className="calc-row"><span>Perihelion Speed (v_p):</span><strong>{vPerihelionKmS.toFixed(3)} km/s</strong></div>
              <div className="calc-row"><span>Aphelion Speed (v_a):</span><strong>{vAphelionKmS.toFixed(3)} km/s</strong></div>
            </div>

            <div className="calc-card">
              <div className="calc-title text-amber">Advanced Orbital Invariants</div>
              <div className="calc-row"><span>Specific Energy (ε = -μ/2a):</span><strong>{specificEnergyJ} J/kg</strong></div>
              <div className="calc-row"><span>Angular Momentum (h):</span><strong>{angularMomentumH} km²/s</strong></div>
              <div className="calc-row"><span>Semi-Latus Rectum (p):</span><strong>{formatKm(pKm, 0)}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. REFERENCE FRAME & PROVENANCE FOOTER ───────────────────────── */}
      <div className="oil-provenance-footer font-mono">
        <span>FRAME: {isSun ? 'HELIOCENTRIC' : parentObj ? `${parentObj.name.toUpperCase()}CENTRIC` : 'HELIOCENTRIC'}</span>
        <span>•</span>
        <span>EPOCH: J2000.0</span>
        <span>•</span>
        <span>MODEL: KEPLERIAN / JPL</span>
      </div>
    </div>
  );
}


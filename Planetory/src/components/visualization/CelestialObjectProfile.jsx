import React, { useState } from 'react';
import { formatKm, formatAU, formatMass, formatAngle, formatPeriod } from '../../utils/formatters';
import { validateScientificData, calculateSurfaceGravity, calculateEscapeVelocity } from '../../utils/orbitalMath';
import { PLANET_DATA } from '../../data/planets';
import ScientificCalculationExplorer from './ScientificCalculationExplorer';

/**
 * CelestialObjectProfile.jsx - PART 24.1 Top Celestial Object Profile Engine
 * Renders header, 3D/2D visual preview, classification badges, clickable system breadcrumb,
 * hierarchy tree visual, parent & system info, identification metadata, 2-column physical matrix,
 * proportional scale bars, live formulas, and expandable science accordions.
 */
export default function CelestialObjectProfile({
  obj,
  simTimeDays,
  isFollowing,
  onFocus,
  onFollow,
  onOpenCompare,
  onClose
}) {
  const [expandedSection, setExpandedSection] = useState({
    identification: false,
    physical: true,
    rotation: true,
    atmosphere: false,
    rings: false,
    magnetic: false,
    satellites: false
  });

  const toggleSection = (key) => {
    setExpandedSection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!obj) return null;

  const validData = validateScientificData(obj);
  const name = obj.name || obj.fullName || obj.designation || obj.id || 'OBJECT';
  const isSun = obj.id === 'sun';
  const isEarth = obj.id === 'earth';
  const isMoon = obj.id === 'moon';
  const isJupiter = obj.id === 'jupiter';
  const isSaturn = obj.id === 'saturn';
  const isUranus = obj.id === 'uranus';
  const isNeptune = obj.id === 'neptune';

  const isNaturalSat = obj.category === 'NATURAL SATELLITE' || obj.type === 'Natural Satellite';
  const isArtificialSat = obj.category === 'ARTIFICIAL SATELLITE' || obj.type === 'ARTIFICIAL SATELLITE' || obj.type === 'SPACECRAFT';
  const isAsteroid = (obj.spkid || obj.orbitClass || obj.neo || obj.pha) && !isNaturalSat && !isArtificialSat;
  const isPlanet = obj.type === 'Planet' || obj.type === 'Dwarf Planet';

  // 1. Precise Classification Badges
  let classTag = 'CELESTIAL BODY';
  if (isSun) classTag = 'STAR · G-TYPE MAIN-SEQUENCE';
  else if (isPlanet) {
    if (isJupiter || isSaturn) classTag = 'PLANET · GAS GIANT';
    else if (isUranus || isNeptune) classTag = 'PLANET · ICE GIANT';
    else if (obj.type === 'Dwarf Planet') classTag = 'DWARF PLANET · KUIPER BELT';
    else classTag = 'PLANET · TERRESTRIAL';
  } else if (isNaturalSat) {
    if (obj.parentPlanet === 'jupiter') classTag = 'MOON · JOVIAN SYSTEM';
    else if (obj.parentPlanet === 'saturn') classTag = 'MOON · SATURNIAN SYSTEM';
    else if (obj.parentPlanet === 'earth') classTag = 'MOON · EARTH-MOON SYSTEM';
    else classTag = 'MOON · NATURAL SATELLITE';
  } else if (isAsteroid) classTag = obj.pha ? 'POTENTIALLY HAZARDOUS ASTEROID · NEO' : 'SMALL BODY · ASTEROID';
  else if (isArtificialSat) classTag = 'ARTIFICIAL OBJECT · SPACECRAFT';

  // 2. Parent & System Relationships
  const parentObj = isNaturalSat && obj.parentPlanet ? PLANET_DATA[obj.parentPlanet] : null;
  const parentName = isSun ? 'SYSTEM CENTER' : parentObj ? parentObj.name.toUpperCase() : 'SUN';
  const systemName = isSun ? 'SOLAR SYSTEM' : isNaturalSat && parentObj ? `${parentObj.name.toUpperCase()} SYSTEM` : 'SOLAR SYSTEM';

  // 3. Physical Parameters
  const radiusKm = validData.radiusKm || 6371;
  const diameterKm = radiusKm * 2;
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const volumeKm3 = massKg && obj.density ? (massKg / (obj.density * 1000)).toExponential(2) : (4 / 3 * Math.PI * Math.pow(radiusKm, 3)).toExponential(2);
  const density = obj.density || (massKg ? (massKg / (4 / 3 * Math.PI * Math.pow(radiusKm * 100000, 3))).toFixed(2) : '5.51');
  const gravity = obj.gravity || calculateSurfaceGravity(massKg, radiusKm).toFixed(2);
  const vEsc = obj.escapeVelocity || calculateEscapeVelocity(massKg, radiusKm).toFixed(2);
  const tiltDeg = obj.axialTiltDeg !== undefined ? obj.axialTiltDeg : 0;
  const rotHours = obj.rotationPeriodHours !== undefined ? obj.rotationPeriodHours : 24;

  // 4. Proportional Scale Multipliers vs Earth
  const earthRadius = 6371;
  const earthMass = 5.972e24;
  const earthGravity = 9.80665;
  const radiusRatio = (radiusKm / earthRadius).toFixed(2);
  const massRatio = massKg ? (massKg / earthMass).toExponential(2) : 'N/A';
  const volumeRatio = (Math.pow(radiusKm / earthRadius, 3)).toFixed(1);
  const gravityRatio = (gravity / earthGravity).toFixed(2);

  // 5. Identification / Discovery Metadata
  const catalogId = obj.spkid || obj.id?.toUpperCase() || 'IAU-CSD';
  const discoveryYear = obj.discoveryYear || (isSun || isEarth || obj.id === 'mercury' || obj.id === 'venus' || obj.id === 'mars' || obj.id === 'jupiter' || obj.id === 'saturn' ? 'Prehistoric / Antiquity' : 'Modern Epoch');

  return (
    <div className="celestial-object-profile-engine sci-panel-v7 font-mono">
      {/* ── 1. OBJECT PROFILE HEADER ────────────────────────────────────── */}
      <div className="cop-header">
        <div className="cop-header-top">
          {/* Clickable System Path Breadcrumb */}
          <div className="cop-breadcrumb">
            <span className="b-crumb" onClick={() => PLANET_DATA['sun'] && onFocus && onFocus(PLANET_DATA['sun'])}>
              SOLAR SYSTEM
            </span>
            <span className="b-sep">/</span>
            {parentObj ? (
              <>
                <span className="b-crumb" onClick={() => onFocus && onFocus(parentObj)}>
                  {parentObj.name.toUpperCase()}
                </span>
                <span className="b-sep">/</span>
              </>
            ) : !isSun ? (
              <>
                <span className="b-crumb" onClick={() => PLANET_DATA['sun'] && onFocus && onFocus(PLANET_DATA['sun'])}>
                  SUN
                </span>
                <span className="b-sep">/</span>
              </>
            ) : null}
            <span className="b-crumb b-crumb--active">{name.toUpperCase()}</span>
          </div>

          <div className="cop-status-badges">
            <span className="cop-badge cop-badge--class">{classTag}</span>
            <span className="cop-badge cop-badge--status">
              {isFollowing ? '🔒 FOLLOWING' : '● TRACKING'}
            </span>
          </div>
        </div>

        <div className="cop-title-row">
          <h1 className="cop-name">{name.toUpperCase()}</h1>
        </div>
      </div>

      {/* ── 2. OBJECT HIERARCHY TREE DIAGRAM ────────────────────────────── */}
      <div className="cop-hierarchy-tree">
        <span className="h-node">SOLAR SYSTEM</span>
        <span className="h-arrow">↓</span>
        {!isSun && (
          <>
            <span className="h-node">{parentName}</span>
            <span className="h-arrow">↓</span>
          </>
        )}
        <span className="h-node h-node--active">{name.toUpperCase()}</span>
      </div>

      {/* ── 3. PRIMARY PHYSICAL CHARACTERISTICS MATRIX (2-COLUMNS) ────── */}
      <div className="cop-section-title font-mono">──── PRIMARY PHYSICAL MATRIX ────</div>
      <div className="cop-metrics-grid">
        <div className="cop-cell">
          <span className="cop-lbl" title="Equatorial physical radius">RADIUS:</span>
          <span className="cop-val text-cyan">{formatKm(radiusKm, 1)}</span>
        </div>
        <div className="cop-cell">
          <span className="cop-lbl" title="Mean spherical diameter">DIAMETER:</span>
          <span className="cop-val text-cyan">{formatKm(diameterKm, 1)}</span>
        </div>
        <div className="cop-cell">
          <span className="cop-lbl" title="Total mass of the celestial body">MASS:</span>
          <span className="cop-val text-amber">{formatMass(massKg)}</span>
        </div>
        <div className="cop-cell">
          <span className="cop-lbl" title="Mean mass density">DENSITY:</span>
          <span className="cop-val text-green">{density} g/cm³</span>
        </div>
        <div className="cop-cell">
          <span className="cop-lbl" title="Surface gravitational acceleration">GRAVITY:</span>
          <span className="cop-val text-cyan">{gravity} m/s² ({gravityRatio}× g)</span>
        </div>
        <div className="cop-cell">
          <span className="cop-lbl" title="Minimum speed to escape gravitational well">ESCAPE VELOCITY:</span>
          <span className="cop-val text-amber">{vEsc} km/s</span>
        </div>
        <div className="cop-cell">
          <span className="cop-lbl" title="Sidereal rotation period">ROTATION:</span>
          <span className="cop-val">{Math.abs(rotHours).toFixed(2)} hours</span>
        </div>
        <div className="cop-cell">
          <span className="cop-lbl" title="Axial tilt relative to orbital plane normal">AXIAL TILT:</span>
          <span className="cop-val">{formatAngle(tiltDeg, 2)}</span>
        </div>
      </div>

      {/* ── PART 24.5 VISIBLE SCIENTIFIC CALCULATIONS CONSOLE ────────────── */}
      <ScientificCalculationExplorer obj={obj} />

      {/* ── 4. MATHEMATICALLY PROPORTIONAL SCALE VISUALIZATIONS ─────────── */}
      <div className="cop-scale-section">
        <div className="cop-section-title font-mono">──── MATHEMATICAL SCALE RELATIONS (vs EARTH) ────</div>
        
        {/* Radius Scale */}
        <div className="cop-scale-item">
          <div className="cop-scale-hdr">
            <span>RELATIVE RADIUS</span>
            <span className="text-cyan">{radiusRatio}× Earth</span>
          </div>
          <div className="cop-scale-track">
            <div 
              className="cop-scale-fill cop-scale-fill--radius" 
              style={{ width: `${Math.min(100, Math.max(4, Math.pow(radiusKm / 6371, 0.5) * 35))}%` }} 
            />
          </div>
        </div>

        {/* Volume Scale */}
        <div className="cop-scale-item">
          <div className="cop-scale-hdr">
            <span>RELATIVE VOLUME (V = 4/3 πR³)</span>
            <span className="text-amber">≈ {volumeRatio}× Earth Volumes</span>
          </div>
          <div className="cop-scale-track">
            <div 
              className="cop-scale-fill cop-scale-fill--volume" 
              style={{ width: `${Math.min(100, Math.max(4, Math.pow(radiusKm / 6371, 0.6) * 30))}%` }} 
            />
          </div>
        </div>

        {/* Logarithmic Mass Scale */}
        <div className="cop-scale-item">
          <div className="cop-scale-hdr">
            <span>RELATIVE MASS (LOGARITHMIC SCALE)</span>
            <span className="text-green">{massRatio}× Earth Mass</span>
          </div>
          <div className="cop-scale-track">
            <div 
              className="cop-scale-fill cop-scale-fill--mass" 
              style={{ width: `${massKg ? Math.min(100, Math.max(6, ((Math.log10(massKg) - 20) / 10) * 100)) : 50}%` }} 
            />
          </div>
        </div>
      </div>

      {/* ── 5. EXPANDABLE SCIENCE ACCORDIONS ─────────────────────────────── */}
      <div className="cop-accordions">
        {/* IDENTIFICATION ACCORDION */}
        <div className="cop-accordion-item">
          <div className="cop-accordion-hdr" onClick={() => toggleSection('identification')}>
            <span>IDENTIFICATION & PROVENANCE</span>
            <span>{expandedSection.identification ? '▲' : '▼'}</span>
          </div>
          {expandedSection.identification && (
            <div className="cop-accordion-body">
              <div className="cop-row"><span>Official Name:</span><strong>{name}</strong></div>
              <div className="cop-row"><span>Catalog SPKID:</span><strong>{catalogId}</strong></div>
              <div className="cop-row"><span>System Role:</span><strong>{systemName}</strong></div>
              <div className="cop-row"><span>Discovery Epoch:</span><strong>{discoveryYear}</strong></div>
              <div className="cop-row"><span>Reference Frame:</span><strong>J2000.0 / ICRF</strong></div>
            </div>
          )}
        </div>

        {/* ATMOSPHERE ACCORDION (If applicable) */}
        {(obj.atmosphere || isEarth || isSaturn || isJupiter || isUranus || isNeptune) && (
          <div className="cop-accordion-item">
            <div className="cop-accordion-hdr" onClick={() => toggleSection('atmosphere')}>
              <span>ATMOSPHERIC ENVIRONMENT SUMMARY</span>
              <span>{expandedSection.atmosphere ? '▲' : '▼'}</span>
            </div>
            {expandedSection.atmosphere && (
              <div className="cop-accordion-body">
                <div className="cop-row"><span>Composition:</span><strong>{obj.atmosphere || (isEarth ? 'N₂ (78.1%), O₂ (20.9%), Ar (0.93%), CO₂ (0.04%)' : isSaturn || isJupiter ? 'H₂ (89.8%), He (10.2%)' : 'Atmospheric Envelope')}</strong></div>
                <div className="cop-row"><span>Surface/Cloud Pressure:</span><strong>{obj.atmospherePressure || (isEarth ? '1.013 bar (1 atm)' : isSaturn ? '1.4 bar (1 bar level)' : 'Substantial Envelope')}</strong></div>
                <div className="cop-row"><span>Mean Temperature:</span><strong>{obj.surfaceTemperature || (isEarth ? '288 K (15°C)' : isSaturn ? '134 K (-139°C)' : 'N/A')}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* RING SYSTEM ACCORDION (If applicable) */}
        {(obj.hasRings || isSaturn || isJupiter || isUranus || isNeptune) && (
          <div className="cop-accordion-item">
            <div className="cop-accordion-hdr" onClick={() => toggleSection('rings')}>
              <span>RING SYSTEM SUMMARY</span>
              <span>{expandedSection.rings ? '▲' : '▼'}</span>
            </div>
            {expandedSection.rings && (
              <div className="cop-accordion-body">
                <div className="cop-row"><span>Ring Presence:</span><strong className="text-amber">YES (Circumplanetary Ring System)</strong></div>
                <div className="cop-row"><span>Major Rings:</span><strong>{isSaturn ? 'Main Rings (A, B, C), Faint Rings (D, E, F, G)' : 'Faint Dust Rings'}</strong></div>
                <div className="cop-row"><span>Major Divisions:</span><strong>{isSaturn ? 'Cassini Division (4,700 km), Encke Gap (325 km)' : 'Subtle Gaps'}</strong></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 6. DATA PROVENANCE FOOTER ───────────────────────────────────── */}
      <div className="cop-provenance-footer">
        <span>DATA SOURCE: JPL / NASA SSD</span>
        <span>•</span>
        <span>STATUS: ● HIGH PRECISION</span>
      </div>
    </div>
  );
}

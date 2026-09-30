import React, { useState, useEffect, useRef, useMemo } from 'react';
import { J2000_DATE } from '../utils/dateUtils';
import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES } from '../data/satellites';
import EphemerisManager from '../engine/EphemerisManager';

import { 
  formatKm, formatAU, formatMass, formatAngle, formatPeriod, 
  formatUnitDistance, generateDataSnapshotText 
} from '../utils/formatters';

import { 
  calculateOrbitalVelocity, calculateApsides, 
  calculateSurfaceGravity, calculateEscapeVelocity, 
  validateScientificData 
} from '../utils/orbitalMath';

import { calculateHillSphereRadius } from '../data/planetaryDetails';

// NASA / JPL Scientific Visualization & Analytics Components
import OrbitDiagram from './visualization/OrbitDiagram';
import OrbitalPhase from './visualization/OrbitalPhase';
import DistanceVisualization from './visualization/DistanceVisualization';
import VelocityVisualization from './visualization/VelocityVisualization';
import SizeComparison from './visualization/SizeComparison';
import MassComparison from './visualization/MassComparison';
import GravityVisualization from './visualization/GravityVisualization';
import RotationVisualization from './visualization/RotationVisualization';
import SatelliteSystemMap from './visualization/SatelliteSystemMap';
import CloseApproachAnalytics from './visualization/CloseApproachAnalytics';

import PlanetPreviewCanvas from './visualization/PlanetPreviewCanvas';
import RadialGauge from './visualization/RadialGauge';
import InteriorStructureView from './visualization/InteriorStructureView';
import AtmosphericProfileView from './visualization/AtmosphericProfileView';
import SaturnRingAnalysis from './visualization/SaturnRingAnalysis';
import JupiterStormAnalysis from './visualization/JupiterStormAnalysis';
import ScientificLiveCharts from './visualization/ScientificLiveCharts';
import SpaceMissionsTimeline from './visualization/SpaceMissionsTimeline';
import PlanetFactSheet from './visualization/PlanetFactSheet';
import MagneticFieldVisualization from './visualization/MagneticFieldVisualization';
import ScientificImageGallery from './visualization/ScientificImageGallery';
import ScientificCalculationExplorer from './visualization/ScientificCalculationExplorer';
import PlanetaryPhysicsLab from './visualization/PlanetaryPhysicsLab';

// Astronomical Event Engines
import { calculateMoonPhase } from '../utils/moonPhaseEngine';
import { detectEclipseState } from '../utils/eclipseEngine';
import { calculateSeasonalState } from '../utils/seasonalEngine';

import { 
  calculateObserverCoordinates, 
  calculateRiseTransitSet 
} from '../utils/astronomicalCoordinates';
import { 
  calculateHeliocentricPosition, 
  calculateMeanAnomaly 
} from '../utils/orbitalMath';
import { DEFAULT_OBSERVER } from '../utils/observerModel';

const ephemerisManager = new EphemerisManager();

/**
 * Computes telemetry state dynamically with robust fallbacks
 */
function computeTelemetryState(obj, simTimeDays) {
  if (!obj) {
    return {
      currentDistanceAu: null,
      currentDistanceKm: null,
      currentVelocityKmS: null,
      trueAnomalyRad: 0,
      surfaceGravity: null,
      escapeVelocity: null
    };
  }

  const validData = validateScientificData(obj);
  if (obj.id === 'sun') {
    return {
      currentDistanceAu: 0,
      currentDistanceKm: 0,
      currentVelocityKmS: null,
      trueAnomalyRad: 0,
      surfaceGravity: calculateSurfaceGravity(validData.massKg, validData.radiusKm),
      escapeVelocity: calculateEscapeVelocity(validData.massKg, validData.radiusKm)
    };
  }

  let a = validData.a;
  if (!a || a <= 0) {
    a = obj.semiMajorAxisKm ? obj.semiMajorAxisKm / 149597870.7 : (obj.distanceFromSunKm ? obj.distanceFromSunKm / 149597870.7 : 1.0);
  }

  const e = validData.e !== undefined && validData.e !== null ? validData.e : (obj.eccentricity !== undefined ? obj.eccentricity : 0.0167);
  const period = obj.orbitalPeriodDays || 365.25;

  const vRad = ((simTimeDays / period) * Math.PI * 2) % (Math.PI * 2);
  const rAu = (a * (1 - e * e)) / (1 + e * Math.cos(vRad));
  const rKm = rAu * 149597870.7;

  const vKmS = calculateOrbitalVelocity(a, rAu, undefined, true);
  const g = calculateSurfaceGravity(validData.massKg, validData.radiusKm);
  const vEsc = calculateEscapeVelocity(validData.massKg, validData.radiusKm);

  return {
    currentDistanceAu: rAu,
    currentDistanceKm: rKm,
    currentVelocityKmS: vKmS,
    trueAnomalyRad: vRad,
    surfaceGravity: g,
    escapeVelocity: vEsc
  };
}

const MetricCard = ({ label, value, unit, secondary, icon }) => (
  <div className="sci-metric-card">
    <div className="metric-card-top">
      <span className="metric-label">{label}</span>
      {icon && <span className="metric-icon">{icon}</span>}
    </div>
    <div className="metric-card-body">
      <span className="metric-val font-mono">{value ?? 'N/A'}</span>
      {unit && <span className="metric-unit">{unit}</span>}
    </div>
    {secondary && <div className="metric-secondary">{secondary}</div>}
  </div>
);

const DataRow = ({ label, value, highlight }) => (
  <div className={`detail-row ${highlight ? 'detail-row--highlight' : ''}`}>
    <span className="detail-label">{label}</span>
    <span className="detail-value font-mono">{value ?? 'N/A'}</span>
  </div>
);

/**
 * ObjectIntelligencePanel.jsx - Canonical Object Intelligence & Analytics Console (Part 24.6)
 * Unifies all astronomical data, physical science, scientific calculations, live telemetry,
 * 2D orbit visuals, rotation profiles, atmosphere/composition, satellites, and data sources
 * into one scrollable, fully collapsible, responsive HUD panel.
 */
export default function ObjectIntelligencePanel({
  selectedObject,
  simTimeDays,
  appMode = 'SOLAR_SYSTEM',
  observer = DEFAULT_OBSERVER,
  onModeChange,
  onClose,
  onFocus,
  onFollow,
  isFollowing,
  onOpenCompare,
  onToggleVectors,
  showVectors,
  onToggleTrails,
  showTrails
}) {
  // Collapsible section drawer states
  const [sectionsOpen, setSectionsOpen] = useState({
    overview: true,
    calculations: true,
    orbit: true,
    telemetry: true,
    physical: true,
    rotation: false,
    atmosphere: false,
    composition: false,
    satellites: true,
    hierarchy: false,
    sources: false
  });

  const [unitSystem, setUnitSystem] = useState('astronomical');
  const [ephemeris, setEphemeris] = useState(null);
  const [loadingEphemeris, setLoadingEphemeris] = useState(false);
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  const toggleSection = (sectionKey) => {
    setSectionsOpen(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Click-outside listener for MORE dropdown menu
  useEffect(() => {
    if (!showMoreMenu) return;
    const handlePointerDownOutside = (evt) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(evt.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [showMoreMenu]);

  const obj = selectedObject;
  const targetId = obj?.spkid || obj?.id || obj?.designation;
  const validData = validateScientificData(obj);

  // Synchronous telemetry computation
  const [telemetryState, setTelemetryState] = useState(() => computeTelemetryState(obj, simTimeDays));

  useEffect(() => {
    if (!obj) return;
    setTelemetryState(computeTelemetryState(obj, simTimeDays));
  }, [targetId, simTimeDays]);

  // Fetch live ephemeris
  useEffect(() => {
    if (!obj) return;
    setEphemeris(null);

    if (obj.category === 'ARTIFICIAL SATELLITE' || obj.spkid) {
      setLoadingEphemeris(true);
      ephemerisManager.getSelectedEphemeris(targetId)
        .then(res => setEphemeris(res))
        .catch(() => {})
        .finally(() => setLoadingEphemeris(false));
    }
  }, [targetId]);

  if (!obj) return null;

  const name = obj.name || obj.fullName || obj.designation || targetId;
  const isSun = obj.id === 'sun';
  const isNaturalSat = obj.category === 'NATURAL SATELLITE' || obj.type === 'Natural Satellite';
  const isArtificialSat = obj.category === 'ARTIFICIAL SATELLITE' || obj.type === 'ARTIFICIAL SATELLITE' || obj.type === 'SPACECRAFT';
  const isAsteroid = (obj.spkid || obj.orbitClass || obj.neo || obj.pha) && !isNaturalSat && !isArtificialSat;
  const isPlanet = obj.type === 'Planet' || obj.type === 'Dwarf Planet';

  const categoryBadge = isSun ? 'STAR' : isPlanet ? (obj.category ? obj.category.toUpperCase() : 'PLANET') : isNaturalSat ? 'MOON' : isAsteroid ? 'ASTEROID' : isArtificialSat ? 'SPACECRAFT' : (obj.category || 'CELESTIAL BODY');
  const categoryIcon = isSun ? '☀️' : isPlanet ? (obj.id === 'earth' ? '🌍' : '🪐') : isNaturalSat ? '🌙' : isAsteroid ? '☄️' : '🛰️';

  const simDate = new Date(J2000_DATE.getTime() + simTimeDays * 86400000);

  const childMoons = isPlanet 
    ? NATURAL_SATELLITES.filter(m => m.parentPlanet === obj.id)
    : [];

  const parentObj = isNaturalSat && obj.parentPlanet ? PLANET_DATA[obj.parentPlanet] : null;

  const diameter = validData.radiusKm ? validData.radiusKm * 2 : null;
  const semiMajorAu = validData.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / 149597870.7 : null);
  const eccentricity = validData.e !== undefined && validData.e !== null ? validData.e : (obj?.eccentricity !== undefined ? obj.eccentricity : 0);
  const { q, Q } = calculateApsides(semiMajorAu, eccentricity, true);
  const { rHillKm } = calculateHillSphereRadius(semiMajorAu, validData.massKg);

  const handleCopySnapshot = () => {
    const text = generateDataSnapshotText(obj, {
      ...telemetryState,
      simDate
    });
    navigator.clipboard.writeText(text);
    setCopiedSnapshot(true);
    setTimeout(() => setCopiedSnapshot(false), 2500);
  };

  const distanceLabel = isSun
    ? 'System Barycenter'
    : isNaturalSat && parentObj
    ? `Distance to ${parentObj.name}`
    : 'Distance from Sun';

  const velocityDisplay = isSun
    ? 'Primary Star'
    : telemetryState.currentVelocityKmS
    ? `${telemetryState.currentVelocityKmS.toFixed(2)} km/s`
    : 'N/A';

  // Calculate Observer Astronomical Coordinates cleanly
  const observerCoords = useMemo(() => {
    if (!obj) return null;
    try {
      const earthObj = PLANET_DATA['earth'];
      const objHelioPos = calculateHeliocentricPosition(obj, simTimeDays);
      const earthHelioPos = calculateHeliocentricPosition(earthObj, simTimeDays);
      return calculateObserverCoordinates(objHelioPos, earthHelioPos, simTimeDays, observer, { epoch: 'J2000' });
    } catch { return null; }
  }, [targetId, simTimeDays, observer]);

  const riseTransitSet = useMemo(() => {
    if (!observerCoords) return null;
    try {
      return calculateRiseTransitSet(observerCoords.raHours, observerCoords.decDeg, simTimeDays, observer);
    } catch { return null; }
  }, [observerCoords, simTimeDays, observer]);

  const distanceDisplay = isSun
    ? '0.000 AU (Primary Star)'
    : telemetryState.currentDistanceAu
    ? formatUnitDistance(telemetryState.currentDistanceKm, unitSystem)
    : 'N/A';

  const periodDisplay = isSun
    ? 'Solar Barycenter'
    : formatPeriod(obj.orbitalPeriodDays);

  return (
    <div 
      className="asteroid-detail-panel object-intelligence-panel sci-panel-v7"
      onPointerDown={(e) => e.stopPropagation()} // Prevent panel drag on click
      onWheel={(e) => e.stopPropagation()}       // Prevent 3D canvas zoom when scrolling panel
      onTouchMove={(e) => e.stopPropagation()}   // Prevent 3D canvas rotation when scrolling panel
    >
      {/* ── 1. OBJECT HEADER & ACTION CONTROLS ───────────────────────────── */}
      <div className="adp-header">
        <div className="adp-header-top">
          {/* Object Breadcrumb */}
          <div className="adp-breadcrumb font-mono">
            <span className="b-crumb b-crumb--root" onClick={() => PLANET_DATA['sun'] && onFocus && onFocus(PLANET_DATA['sun'])}>SOLAR SYSTEM</span>
            {parentObj ? (
              <>
                <span className="b-sep">/</span>
                <span 
                  className="b-crumb b-crumb--link" 
                  onClick={() => onFocus && onFocus(parentObj)}
                  title={`Focus parent body: ${parentObj.name}`}
                >
                  {parentObj.name.toUpperCase()}
                </span>
              </>
            ) : !isSun ? (
              <>
                <span className="b-sep">/</span>
                <span 
                  className="b-crumb b-crumb--link" 
                  onClick={() => PLANET_DATA['sun'] && onFocus && onFocus(PLANET_DATA['sun'])}
                  title="Focus central star: SUN"
                >
                  SUN
                </span>
              </>
            ) : null}
            <span className="b-sep">/</span>
            <span className="b-crumb b-crumb--active">{name.toUpperCase()}</span>
          </div>
        </div>

        <div className="adp-header-main">
          <div className="adp-title-row">
            <div className="adp-title-left">
              <span className="adp-category-icon">{categoryIcon}</span>
              <h2 className="adp-name">{name.toUpperCase()}</h2>
            </div>
            <div className="adp-badges">
              <span className={`badge ${isSun ? 'badge--star' : isPlanet ? 'badge--planet' : isNaturalSat ? 'badge--moon' : 'badge--neo'}`}>
                {categoryBadge}
              </span>
              <span className="badge badge--status">
                {isFollowing ? '🔒 FOLLOWING' : '● TRACKING'}
              </span>
              {obj.pha && <span className="badge badge--pha">⚠ PHA</span>}
            </div>
          </div>

          {/* Action Controls Header Row */}
          <div className="adp-header-actions">
            {onFocus && (
              <button className="adp-btn adp-btn--focus" onClick={() => onFocus(obj)} title="Focus object in 3D scene (F)">
                ◎ FOCUS
              </button>
            )}
            {onFollow && (
              <button className={`adp-btn ${isFollowing ? 'adp-btn--active' : ''}`} onClick={() => onFollow(!isFollowing)} title="Follow camera (G)">
                {isFollowing ? '🔒 FOLLOWING' : '🔓 FOLLOW'}
              </button>
            )}
            {onOpenCompare && (
              <button className="adp-btn adp-btn--compare desktop-only-btn" onClick={() => onOpenCompare(obj)} title="Compare metrics with another body (C)">
                ⚖ COMPARE
              </button>
            )}

            {/* MORE ▾ Dropdown Menu */}
            <div ref={moreMenuRef} className="adp-more-menu-wrapper" style={{ position: 'relative' }}>
              <button 
                className="adp-btn adp-btn--more" 
                onClick={() => setShowMoreMenu(prev => !prev)}
                title="More options & tools"
              >
                ⋯ MORE ▾
              </button>
              {showMoreMenu && (
                <div className="adp-more-dropdown" onPointerDown={e => e.stopPropagation()}>
                  {onOpenCompare && (
                    <button className="mobile-only-btn" onClick={() => { onOpenCompare(obj); setShowMoreMenu(false); }}>
                      ⚖ COMPARE METRICS
                    </button>
                  )}
                  <button onClick={() => { handleCopySnapshot(); setShowMoreMenu(false); }}>
                    📸 {copiedSnapshot ? '✓ COPIED' : 'SNAPSHOT TO CLIPBOARD'}
                  </button>

                  {onToggleVectors && (
                    <button onClick={() => { onToggleVectors(!showVectors); setShowMoreMenu(false); }}>
                      ↗ VECTORS: {showVectors ? 'ON' : 'OFF'}
                    </button>
                  )}

                  {onToggleTrails && (
                    <button onClick={() => { 
                      onToggleTrails(showTrails === 'off' ? 'short' : showTrails === 'short' ? 'medium' : showTrails === 'medium' ? 'long' : 'off'); 
                      setShowMoreMenu(false); 
                    }}>
                      🌀 TRAIL: {showTrails.toUpperCase()}
                    </button>
                  )}

                  {parentObj && onFocus && (
                    <button onClick={() => { onFocus(parentObj); setShowMoreMenu(false); }}>
                      🔗 PARENT PLANET: {parentObj.name.toUpperCase()}
                    </button>
                  )}

                  {childMoons.length > 0 && (
                    <button onClick={() => { toggleSection('satellites'); setShowMoreMenu(false); }}>
                      🌙 SATELLITES ({childMoons.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. OBJECT PREVIEW CANVAS ────────────────────────────────────── */}
      <div className="adp-preview-section">
        <PlanetPreviewCanvas obj={obj} isFollowing={isFollowing} />
      </div>

      {/* ── 3. COLLAPSIBLE SECTIONS MAIN CONTAINER ──────────────────────── */}
      <div className="adp-body font-mono">
        
        {/* ▼ OVERVIEW */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('overview')}>
            <span>{sectionsOpen.overview ? '▼' : '►'} OVERVIEW & CHARACTERISTICS</span>
            <span className="drawer-subtag">PRIMARY MATRIX</span>
          </div>
          {sectionsOpen.overview && (
            <div className="adp-drawer-content">
              <div className="cop-metrics-grid">
                <div className="cop-cell">
                  <span className="cop-lbl">RADIUS:</span>
                  <span className="cop-val text-cyan">{formatKm(validData.radiusKm || 6371, 1)}</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">DIAMETER:</span>
                  <span className="cop-val text-cyan">{formatKm((validData.radiusKm || 6371) * 2, 1)}</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">MASS:</span>
                  <span className="cop-val text-amber">{formatMass(validData.massKg)}</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">DENSITY:</span>
                  <span className="cop-val text-green">{obj.density || '5.51'} g/cm³</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">GRAVITY:</span>
                  <span className="cop-val text-cyan">{telemetryState.surfaceGravity ? telemetryState.surfaceGravity.toFixed(2) : '9.81'} m/s²</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">ESCAPE VELOCITY:</span>
                  <span className="cop-val text-amber">{telemetryState.escapeVelocity ? telemetryState.escapeVelocity.toFixed(2) : '11.18'} km/s</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">ROTATION:</span>
                  <span className="cop-val">{obj.rotationPeriodHours ? `${Math.abs(obj.rotationPeriodHours).toFixed(2)}h` : '24.00h'}</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">AXIAL TILT:</span>
                  <span className="cop-val">{formatAngle(obj.axialTiltDeg || 0, 2)}</span>
                </div>
                <div className="cop-cell">
                  <span className="cop-lbl">ORBITAL PERIOD:</span>
                  <span className="cop-val">{periodDisplay}</span>
                </div>
              </div>

              {/* Hierarchy Tree Visual */}
              <div className="cop-hierarchy-tree" style={{ marginTop: '10px' }}>
                <span className="h-node" onClick={() => PLANET_DATA['sun'] && onFocus && onFocus(PLANET_DATA['sun'])}>SOLAR SYSTEM</span>
                <span className="h-arrow">↓</span>
                {!isSun && (
                  <>
                    <span className="h-node" onClick={() => (parentObj || PLANET_DATA['sun']) && onFocus && onFocus(parentObj || PLANET_DATA['sun'])}>
                      {parentObj ? parentObj.name.toUpperCase() : 'SUN'}
                    </span>
                    <span className="h-arrow">↓</span>
                  </>
                )}
                <span className="h-node h-node--active">{name.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

        {/* ▼ ASTRONOMICAL SKY OBSERVATION & SKY ANALYTICS (PART 29) */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('observatorySky')}>
            <span>{sectionsOpen.observatorySky !== false ? '▼' : '►'} 🔭 ASTRONOMICAL SKY OBSERVATION</span>
            <span className="drawer-subtag text-cyan">RA/DEC • ALT/AZ • RISE/SET</span>
          </div>
          {sectionsOpen.observatorySky !== false && observerCoords && (
            <div className="adp-drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="sci-widget font-mono" style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0,240,255,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#00f0ff' }}>EQUATORIAL & HORIZONTAL COORDINATES</span>
                  <span className="badge badge--planet" style={{ fontSize: '0.6rem' }}>EPOCH: {observerCoords.epochLabel}</span>
                </div>

                <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <DataRow label="RIGHT ASCENSION (RA)" value={observerCoords.raFormatted} highlight />
                  <DataRow label="DECLINATION (DEC)" value={observerCoords.decFormatted} highlight />
                  <DataRow label="ALTITUDE (ALT)" value={`${observerCoords.altDeg}° (${observerCoords.isAboveHorizon ? 'ABOVE HORIZON' : 'BELOW HORIZON'})`} highlight />
                  <DataRow label="AZIMUTH (AZ)" value={`${observerCoords.azDeg}°`} highlight />
                  <DataRow label="ECLIPTIC LONGITUDE (λ)" value={`${observerCoords.eclipticLonDeg}°`} />
                  <DataRow label="ECLIPTIC LATITUDE (β)" value={`${observerCoords.eclipticLatDeg}°`} />
                  <DataRow label="GEOCENTRIC DISTANCE" value={`${observerCoords.geocentricDistanceAu.toFixed(3)} AU (${formatKm(observerCoords.geocentricDistanceKm)})`} />
                  <DataRow label="ANGULAR DIAMETER" value={`${observerCoords.angularDiameterArcsec.toFixed(1)}″ (${(observerCoords.angularDiameterArcsec / 60).toFixed(2)}′)`} />
                  {riseTransitSet && (
                    <>
                      <DataRow label="RISE TIME (UTC)" value={riseTransitSet.riseTime} />
                      <DataRow label="TRANSIT CULMINATION" value={riseTransitSet.transitTime} />
                      <DataRow label="SET TIME (UTC)" value={riseTransitSet.setTime} />
                    </>
                  )}
                </div>
              </div>

              {/* Formula Expansion Trace Cards */}
              <div className="sci-widget font-mono" style={{ background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.65rem', color: '#ffb703', fontWeight: 'bold', marginBottom: '6px' }}>[ƒx] OBSERVATIONAL FORMULA EXPANSIONS</div>
                <div style={{ fontSize: '0.62rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><code>[ƒx] ALT/AZ: sin(Alt) = sin(Lat)·sin(Dec) + cos(Lat)·cos(Dec)·cos(HA)</code></div>
                  <div><code>[ƒx] ANGULAR DIAMETER: θ = 2·arctan(R / d) = {observerCoords.angularDiameterArcsec.toFixed(1)}″</code></div>
                  <div><code>[ƒx] LOCAL SIDEREAL TIME: LST = GMST + (λ_obs / 15) = {observerCoords.lstHours.toFixed(2)}h</code></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ▼ SCIENTIFIC CALCULATIONS (CRITICAL - OPEN BY DEFAULT) */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('calculations')}>
            <span>{sectionsOpen.calculations ? '▼' : '►'} SCIENTIFIC CALCULATIONS [ƒx]</span>
            <span className="drawer-subtag text-cyan">STEP-BY-STEP TRACE</span>
          </div>
          {sectionsOpen.calculations && (
            <div className="adp-drawer-content" style={{ padding: 0 }}>
              <ScientificCalculationExplorer obj={obj} />
            </div>
          )}
        </div>

        {/* ▼ ORBITAL INTELLIGENCE */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('orbit')}>
            <span>{sectionsOpen.orbit ? '▼' : '►'} ORBITAL INTELLIGENCE & KEPLERIAN ELEMENTS</span>
            <span className="drawer-subtag">2D DIAGRAM & PARAMETERS</span>
          </div>
          {sectionsOpen.orbit && (
            <div className="adp-drawer-content">
              {/* Trajectory & Visual Vector Controls Bar (Part 25) */}
              <div className="sci-widget trajectory-controls-bar font-mono" style={{ marginBottom: '12px', background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,240,255,0.2)' }}>
                <div className="widget-title" style={{ fontSize: '0.65rem', marginBottom: '6px', color: '#00f0ff' }}>
                  🎯 TRAJECTORY & VISUAL VECTOR CONTROLS
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>TRAIL:</span>
                    {['off', 'short', 'medium', 'long'].map((tr) => (
                      <button
                        key={tr}
                        type="button"
                        className={`oil-btn ${showTrails === tr ? 'oil-btn--active' : ''}`}
                        onClick={() => onToggleTrails && onToggleTrails(tr)}
                        title={`Set trajectory trail to ${tr.toUpperCase()}`}
                      >
                        {tr.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>VECTORS:</span>
                    <button
                      type="button"
                      className={`oil-btn ${!showVectors ? 'oil-btn--active' : ''}`}
                      onClick={() => onToggleVectors && onToggleVectors(false)}
                      title="Hide velocity vectors"
                    >
                      OFF
                    </button>
                    <button
                      type="button"
                      className={`oil-btn ${showVectors ? 'oil-btn--active' : ''}`}
                      onClick={() => onToggleVectors && onToggleVectors(true)}
                      title="Show velocity vectors"
                    >
                      VELOCITY ↗
                    </button>
                  </div>
                </div>
              </div>

              {!isSun && (
                <OrbitDiagram 
                  obj={obj}
                  simTimeDays={simTimeDays}
                  currentDistanceAu={telemetryState.currentDistanceAu}
                  trueAnomalyRad={telemetryState.trueAnomalyRad}
                  onFocusObject={onFocus}
                />
              )}

              {!isSun && (
                <OrbitalPhase 
                  obj={obj}
                  simTimeDays={simTimeDays}
                  currentTrueAnomalyRad={telemetryState.trueAnomalyRad}
                />
              )}

              <div className="adp-section-title font-mono" style={{ marginTop: '12px' }}>KEPLERIAN ORBITAL ELEMENTS</div>
              {isSun ? (
                <DataRow label="System Role" value="Primary Star (Solar System Barycenter)" />
              ) : (
                <>
                  {semiMajorAu && <DataRow label="Semi-Major Axis (a)" value={formatAU(semiMajorAu, 5)} />}
                  {obj.semiMajorAxisKm && <DataRow label="Semi-Major Axis (km)" value={formatKm(obj.semiMajorAxisKm, 0)} />}
                  <DataRow label="Eccentricity (e)" value={eccentricity} />
                  {obj.inclinationDeg !== undefined && <DataRow label="Inclination (i)" value={formatAngle(obj.inclinationDeg, 4)} />}
                  {obj.orbitalPeriodDays && <DataRow label="Orbital Period" value={formatPeriod(obj.orbitalPeriodDays)} />}
                  <DataRow label="Perihelion / Periapsis (q)" value={formatAU(q, 4)} />
                  <DataRow label="Aphelion / Apoapsis (Q)" value={Q ? formatAU(Q, 4) : 'N/A (Hyperbolic)'} />
                  {rHillKm && <DataRow label="Hill Sphere Radius (R_Hill)" value={formatKm(rHillKm, 0)} />}
                  <DataRow label="Instantaneous Velocity" value={velocityDisplay} />
                  <DataRow label="Reference Epoch" value="J2000.0 (JD 2451545.0)" />
                </>
              )}
            </div>
          )}
        </div>

        {/* ▼ LIVE TELEMETRY */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('telemetry')}>
            <span>{sectionsOpen.telemetry ? '▼' : '►'} LIVE TELEMETRY & SIMULATION CLOCK</span>
            <span className="drawer-subtag text-green">● LIVE FEED</span>
          </div>
          {sectionsOpen.telemetry && (
            <div className="adp-drawer-content">
              {/* Telemetry Matrix */}
              <div className="telemetry-hero-matrix font-mono">
                <div className="t-matrix-cell">
                  <div className="t-matrix-label">
                    <span>{distanceLabel.toUpperCase()}</span>
                    <span className="t-live-dot">● LIVE</span>
                  </div>
                  <div className="t-matrix-val">{distanceDisplay}</div>
                  <div className="t-matrix-sub">{isSun ? 'Ref: Heliocentric Barycenter' : `Semi-Major Axis: ${formatAU(semiMajorAu, 3)}`}</div>
                </div>

                <div className="t-matrix-cell">
                  <div className="t-matrix-label">
                    <span>ORBITAL VELOCITY</span>
                  </div>
                  <div className="t-matrix-val">{velocityDisplay}</div>
                  <div className="t-matrix-sub">{isSun ? 'Solar Barycenter' : 'Vis-Viva Instantaneous'}</div>
                </div>

                <div className="t-matrix-cell">
                  <div className="t-matrix-label">
                    <span>PHYSICAL RADIUS</span>
                  </div>
                  <div className="t-matrix-val">{formatKm(validData.radiusKm, 1)}</div>
                  <div className="t-matrix-sub">{diameter ? `Diameter: ${formatKm(diameter, 0)}` : 'Spherical Equivalent'}</div>
                </div>

                <div className="t-matrix-cell">
                  <div className="t-matrix-label">
                    <span>ORBITAL PERIOD</span>
                  </div>
                  <div className="t-matrix-val">{periodDisplay}</div>
                  <div className="t-matrix-sub">{obj.rotationPeriodHours ? `Rotation: ${obj.rotationPeriodHours}h` : 'Axial Rotation'}</div>
                </div>
              </div>

              {/* Radial Gauges */}
              <div className="radial-gauges-grid" style={{ marginTop: '10px' }}>
                <RadialGauge 
                  label="Surface Gravity" 
                  value={telemetryState.surfaceGravity} 
                  min={0} max={30} unit="m/s²" 
                  color="#00f0ff"
                  secondaryText="Earth g: 9.81 m/s²"
                />
                <RadialGauge 
                  label="Escape Velocity" 
                  value={telemetryState.escapeVelocity} 
                  min={0} max={65} unit="km/s" 
                  color="#ffb703"
                  secondaryText="v_esc = √(2GM/R)"
                />
                <RadialGauge 
                  label="Mean Density" 
                  value={obj.density} 
                  min={0} max={8} unit="g/cm³" 
                  color="#00ffaa"
                  secondaryText="Earth ρ: 5.51 g/cm³"
                />
                <RadialGauge 
                  label="Axial Tilt" 
                  value={obj.axialTiltDeg} 
                  min={0} max={180} unit="°" 
                  color="#ff0055"
                  secondaryText="Spin Axis Angle"
                />
              </div>

              {/* Live telemetry charts */}
              {!isSun && (
                <ScientificLiveCharts 
                  obj={obj}
                  simTimeDays={simTimeDays}
                />
              )}
            </div>
          )}
        </div>

        {/* ▼ PHYSICAL SCIENCE */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('physical')}>
            <span>{sectionsOpen.physical ? '▼' : '►'} PHYSICAL SCIENCE & PLANETARY ANALYTICS</span>
            <span className="drawer-subtag">PROPORTIONAL INSTRUMENTS</span>
          </div>
          {sectionsOpen.physical && (
            <div className="adp-drawer-content">
              {/* Full Planetary Physics Lab Component */}
              <PlanetaryPhysicsLab obj={obj} />
            </div>
          )}
        </div>

        {/* ▼ ROTATION & AXIS */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('rotation')}>
            <span>{sectionsOpen.rotation ? '▼' : '►'} ROTATION DYNAMICS & AXIAL ORIENTATION</span>
            <span className="drawer-subtag">SPIN AXIS & SPEED</span>
          </div>
          {sectionsOpen.rotation && (
            <div className="adp-drawer-content">
              <RotationVisualization selectedObj={obj} />
            </div>
          )}
        </div>

        {/* ▼ ATMOSPHERE */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('atmosphere')}>
            <span>{sectionsOpen.atmosphere ? '▼' : '►'} ATMOSPHERIC PROFILE & ENVIRONMENT</span>
            <span className="drawer-subtag">CLOUD & PRESSURE</span>
          </div>
          {sectionsOpen.atmosphere && (
            <div className="adp-drawer-content">
              <AtmosphericProfileView obj={obj} />
            </div>
          )}
        </div>

        {/* ▼ COMPOSITION & INTERIOR */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('composition')}>
            <span>{sectionsOpen.composition ? '▼' : '►'} INTERIOR GEOLOGY & COMPOSITION</span>
            <span className="drawer-subtag">CUTAWAY LAYERS</span>
          </div>
          {sectionsOpen.composition && (
            <div className="adp-drawer-content">
              <InteriorStructureView obj={obj} />
            </div>
          )}
        </div>

        {/* ▼ SATELLITE SYSTEM (if applicable) */}
        {childMoons.length > 0 && (
          <div className="adp-drawer-section">
            <div className="adp-drawer-header" onClick={() => toggleSection('satellites')}>
              <span>{sectionsOpen.satellites ? '▼' : '►'} SATELLITE SYSTEM ({childMoons.length} MOONS)</span>
              <span className="drawer-subtag">CIRCUMPLANETARY ORBITS</span>
            </div>
            {sectionsOpen.satellites && (
              <div className="adp-drawer-content">
                <SatelliteSystemMap 
                  parentObj={obj}
                  childMoons={childMoons}
                  onFocusMoon={(moon) => onFocus && onFocus(moon)}
                />
              </div>
            )}
          </div>
        )}

        {/* ▼ DATA SOURCES & PROVENANCE */}
        <div className="adp-drawer-section">
          <div className="adp-drawer-header" onClick={() => toggleSection('sources')}>
            <span>{sectionsOpen.sources ? '▼' : '►'} DATA SOURCES & PROVENANCE</span>
            <span className="drawer-subtag">JPL / NASA AUTHORITATIVE</span>
          </div>
          {sectionsOpen.sources && (
            <div className="adp-drawer-content">
              <DataRow label="Physical Parameters Source" value={obj.dataSource || 'NASA / JPL Solar System Dynamics'} />
              <DataRow label="Ephemeris Engine" value={obj.ephemerisSource || 'JPL Horizons / Keplerian Engine'} />
              <DataRow label="Texture Model" value={obj.textureSource || 'NASA / USGS Planetary Imagery'} />
              <DataRow label="Data Confidence Level" value={validData.isRadiusValid && validData.isOrbitValid ? 'High (Observed & Authoritative)' : 'Modeled / Derived Estimate'} />
              <div className="adp-note font-mono" style={{ marginTop: '8px' }}>
                <strong>Scientific Transparency:</strong> Planetory is an authoritative space visualization platform.
                Numerical values represent actual physical parameters. Scaled render radius is used solely for visual clarity while maintaining true physical scale ratios in scientific panel widgets.
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── 4. TECHNICAL DATA FOOTER ───────────────────────────────────── */}
      <div className="adp-footer-provenance font-mono">
        <span>SOURCE: JPL / NASA</span>
        <span>•</span>
        <span>FRAME: HELIOCENTRIC J2000</span>
        <span>•</span>
        <span>STATUS: ● LIVE</span>
      </div>
    </div>
  );
}

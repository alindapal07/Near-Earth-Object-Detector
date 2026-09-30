import React, { useState, useMemo } from 'react';
import { 
  calculateSurfaceGravity, 
  calculateEscapeVelocity, 
  validateScientificData, 
  G_SI, 
  AU_IN_KM 
} from '../../utils/orbitalMath';

import { 
  formatKm, 
  formatAU, 
  formatMass, 
  formatAngle, 
  formatPeriod 
} from '../../utils/formatters';

import { PLANETARY_DETAILS, calculateHillSphereRadius } from '../../data/planetaryDetails';
import { PLANET_DATA } from '../../data/planets';

// Centralized Scientific Calculation Engine & Components (Part 24.4)
import { 
  getAllCalculationsForObject, 
  filterCalculations, 
  CALCULATION_CATEGORIES 
} from '../../science/calculations/calculationRegistry';
import CalculationTraceDrawer from './CalculationTraceDrawer';

// Atmospheric compositions for key objects (volume / mole fraction)
const ATMOSPHERE_COMPOSITIONS = {
  earth: [
    { gas: 'N₂', name: 'Nitrogen', pct: 78.08, color: '#3b82f6' },
    { gas: 'O₂', name: 'Oxygen', pct: 20.95, color: '#10b981' },
    { gas: 'Ar', name: 'Argon', pct: 0.93, color: '#8b5cf6' },
    { gas: 'CO₂', name: 'Carbon Dioxide', pct: 0.04, color: '#ef4444' }
  ],
  venus: [
    { gas: 'CO₂', name: 'Carbon Dioxide', pct: 96.5, color: '#ef4444' },
    { gas: 'N₂', name: 'Nitrogen', pct: 3.5, color: '#3b82f6' },
    { gas: 'SO₂', name: 'Sulfur Dioxide', pct: 0.015, color: '#f59e0b' }
  ],
  mars: [
    { gas: 'CO₂', name: 'Carbon Dioxide', pct: 95.32, color: '#ef4444' },
    { gas: 'N₂', name: 'Nitrogen', pct: 2.6, color: '#3b82f6' },
    { gas: 'Ar', name: 'Argon', pct: 1.9, color: '#8b5cf6' },
    { gas: 'O₂', name: 'Oxygen', pct: 0.13, color: '#10b981' }
  ],
  jupiter: [
    { gas: 'H₂', name: 'Hydrogen', pct: 89.8, color: '#00f0ff' },
    { gas: 'He', name: 'Helium', pct: 10.2, color: '#ffb703' }
  ],
  saturn: [
    { gas: 'H₂', name: 'Hydrogen', pct: 96.3, color: '#00f0ff' },
    { gas: 'He', name: 'Helium', pct: 3.25, color: '#ffb703' },
    { gas: 'CH₄', name: 'Methane', pct: 0.45, color: '#10b981' }
  ],
  uranus: [
    { gas: 'H₂', name: 'Hydrogen', pct: 82.5, color: '#00f0ff' },
    { gas: 'He', name: 'Helium', pct: 15.2, color: '#ffb703' },
    { gas: 'CH₄', name: 'Methane', pct: 2.3, color: '#10b981' }
  ],
  neptune: [
    { gas: 'H₂', name: 'Hydrogen', pct: 80.0, color: '#00f0ff' },
    { gas: 'He', name: 'Helium', pct: 19.0, color: '#ffb703' },
    { gas: 'CH₄', name: 'Methane', pct: 1.5, color: '#10b981' }
  ],
  sun: [
    { gas: 'H', name: 'Hydrogen', pct: 73.46, color: '#ffea00' },
    { gas: 'He', name: 'Helium', pct: 24.85, color: '#ff9100' },
    { gas: 'O', name: 'Oxygen', pct: 0.77, color: '#10b981' },
    { gas: 'C', name: 'Carbon', pct: 0.29, color: '#ef4444' }
  ],
  titan: [
    { gas: 'N₂', name: 'Nitrogen', pct: 98.4, color: '#3b82f6' },
    { gas: 'CH₄', name: 'Methane', pct: 1.4, color: '#10b981' },
    { gas: 'H₂', name: 'Hydrogen', pct: 0.2, color: '#00f0ff' }
  ],
  pluto: [
    { gas: 'N₂', name: 'Nitrogen', pct: 99.0, color: '#3b82f6' },
    { gas: 'CH₄', name: 'Methane', pct: 0.5, color: '#10b981' },
    { gas: 'CO', name: 'Carbon Monoxide', pct: 0.5, color: '#ef4444' }
  ]
};

// Bulk compositions for key planetary categories
const BULK_COMPOSITIONS = {
  earth: [
    { name: 'Iron-Nickel Core', pct: 32.1, color: '#ef4444' },
    { name: 'Silicate Mantle (Oxygen & Silicon)', pct: 45.0, color: '#f59e0b' },
    { name: 'Magnesium', pct: 13.9, color: '#10b981' },
    { name: 'Other Elements', pct: 9.0, color: '#3b82f6' }
  ],
  mars: [
    { name: 'Iron-Sulfur Core', pct: 22.0, color: '#ef4444' },
    { name: 'Silicate Mantle', pct: 54.0, color: '#f59e0b' },
    { name: 'Basaltic Crust', pct: 24.0, color: '#8b5cf6' }
  ],
  jupiter: [
    { name: 'Hydrogen Fluid', pct: 75.0, color: '#00f0ff' },
    { name: 'Helium Fluid', pct: 20.0, color: '#ffb703' },
    { name: 'Heavy Elements & Ice/Rock Core', pct: 5.0, color: '#ec4899' }
  ],
  saturn: [
    { name: 'Hydrogen Fluid', pct: 80.0, color: '#00f0ff' },
    { name: 'Helium Fluid', pct: 15.0, color: '#ffb703' },
    { name: 'Rocky Ice Core', pct: 5.0, color: '#ec4899' }
  ],
  uranus: [
    { name: 'Water, Ammonia & Methane Ices', pct: 60.0, color: '#06b6d4' },
    { name: 'Hydrogen & Helium Gas', pct: 20.0, color: '#00f0ff' },
    { name: 'Silicate & Iron-Nickel Core', pct: 20.0, color: '#ef4444' }
  ],
  neptune: [
    { name: 'Water, Ammonia & Methane Ices', pct: 60.0, color: '#06b6d4' },
    { name: 'Hydrogen & Helium Gas', pct: 20.0, color: '#00f0ff' },
    { name: 'Silicate & Iron-Nickel Core', pct: 20.0, color: '#ef4444' }
  ],
  moon: [
    { name: 'Silicate Crust & Mantle', pct: 95.0, color: '#94a3b8' },
    { name: 'Iron-Rich Metallic Core', pct: 5.0, color: '#ef4444' }
  ]
};

// Comparative reference baselines
const REFERENCE_BASELINES = {
  earth: { name: 'Earth', radiusKm: 6371.0, massKg: 5.972e24, density: 5.514, gravity: 9.807, escapeVelocity: 11.186, volumeKm3: 1.08321e12 },
  moon: { name: 'Moon', radiusKm: 1737.4, massKg: 7.342e22, density: 3.344, gravity: 1.62, escapeVelocity: 2.38, volumeKm3: 2.1958e10 },
  jupiter: { name: 'Jupiter', radiusKm: 69911.0, massKg: 1.898e27, density: 1.326, gravity: 24.79, escapeVelocity: 59.5, volumeKm3: 1.43128e15 },
  sun: { name: 'Sun', radiusKm: 696340.0, massKg: 1.989e30, density: 1.408, gravity: 274.0, escapeVelocity: 617.7, volumeKm3: 1.412e18 }
};

/**
 * PLANETARY PHYSICS & ANALYTICS LAB (PART 24.3 + 24.4)
 * Comprehensive, scientific, interactive physical analysis module with central calculation engine.
 */
export default function PlanetaryPhysicsLab({ obj }) {
  // State toggles & controls
  const [useEarthBaseline, setUseEarthBaseline] = useState(true);
  const [comparisonBaselineKey, setComparisonBaselineKey] = useState('earth');
  const [humanWeightKg, setHumanWeightKg] = useState(70);
  const [tempUnit, setTempUnit] = useState('C'); // 'K' | 'C' | 'F'
  const [selectedInteriorLayer, setSelectedInteriorLayer] = useState(0);

  // Part 24.4 Calculation Console State
  const [activeCalcId, setActiveCalcId] = useState('surface-gravity');
  const [calcCategory, setCalcCategory] = useState('ALL');
  const [calcSearch, setCalcSearch] = useState('');
  const [calcViewMode, setCalcViewMode] = useState('BASIC'); // 'BASIC' | 'ADVANCED'

  // Centralized calculations evaluation
  const allCalculations = useMemo(() => {
    return getAllCalculationsForObject(obj, { humanMassKg: humanWeightKg });
  }, [obj, humanWeightKg]);

  const filteredCalculations = useMemo(() => {
    return filterCalculations(allCalculations, { category: calcCategory, search: calcSearch });
  }, [allCalculations, calcCategory, calcSearch]);

  const currentActiveCalcObj = useMemo(() => {
    if (!activeCalcId) return null;
    return allCalculations.find(c => c.id === activeCalcId) || null;
  }, [allCalculations, activeCalcId]);

  // Validate core scientific values
  const validData = useMemo(() => validateScientificData(obj), [obj]);
  const radiusKm = validData.radiusKm || 1000;
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const diameterKm = radiusKm * 2;

  // Derive volume V = 4/3 * pi * R^3 in km^3
  const volumeKm3 = useMemo(() => {
    return (4 / 3) * Math.PI * Math.pow(radiusKm, 3);
  }, [radiusKm]);

  // Derive density rho = M / V in g/cm^3
  const derivedDensityGcm3 = useMemo(() => {
    if (!massKg || !volumeKm3 || volumeKm3 <= 0) return null;
    const volumeM3 = volumeKm3 * 1e9;
    const densityKgM3 = massKg / volumeM3;
    return densityKgM3 / 1000;
  }, [massKg, volumeKm3]);

  const densityGcm3 = obj?.density !== undefined ? Number(obj.density) : derivedDensityGcm3;

  // Derive surface gravity g = G * M / R^2 in m/s^2
  const derivedG = useMemo(() => calculateSurfaceGravity(massKg, radiusKm), [massKg, radiusKm]);
  const gMetersSec2 = obj?.gravity !== undefined ? Number(obj.gravity) : derivedG;

  // Derive escape velocity v_esc = sqrt(2 * G * M / R) in km/s
  const derivedVEsc = useMemo(() => calculateEscapeVelocity(massKg, radiusKm), [massKg, radiusKm]);
  const escapeVelocityKmS = obj?.escapeVelocity !== undefined ? Number(obj.escapeVelocity) : derivedVEsc;

  // Derived geometric parameters
  const surfaceAreaKm2 = useMemo(() => 4 * Math.PI * Math.pow(radiusKm, 2), [radiusKm]);
  const circumferenceKm = useMemo(() => 2 * Math.PI * radiusKm, [radiusKm]);

  // Derived rotation parameters
  const rotationHours = obj?.rotationPeriodHours !== undefined ? Number(obj.rotationPeriodHours) : null;
  const isRetrograde = rotationHours !== null && rotationHours < 0;
  const absRotationHours = rotationHours !== null ? Math.abs(rotationHours) : null;

  const equatorialSpinSpeedKmS = useMemo(() => {
    if (!absRotationHours || absRotationHours <= 0) return null;
    const circumferenceM = circumferenceKm * 1000;
    const periodSec = absRotationHours * 3600;
    const vMetersSec = circumferenceM / periodSec;
    return vMetersSec / 1000;
  }, [circumferenceKm, absRotationHours]);

  // Hill Sphere & Sphere of Influence
  const aAu = validData.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / AU_IN_KM : null);
  const eVal = validData.e || 0;
  const parentMassKg = obj?.parentPlanet ? (PLANET_DATA[obj.parentPlanet]?.massKg || 5.972e24) : 1.989e30;

  const hillSphereRadiusKm = useMemo(() => {
    if (!aAu || !massKg || !parentMassKg || aAu <= 0) return null;
    return calculateHillSphereRadius(aAu, eVal, massKg, parentMassKg);
  }, [aAu, eVal, massKg, parentMassKg]);

  const sphereOfInfluenceKm = useMemo(() => {
    if (!aAu || !massKg || !parentMassKg || aAu <= 0) return null;
    const aKm = aAu * AU_IN_KM;
    return aKm * Math.pow(massKg / parentMassKg, 0.4);
  }, [aAu, massKg, parentMassKg]);

  // Reference comparison object
  const refBaseline = REFERENCE_BASELINES[comparisonBaselineKey] || REFERENCE_BASELINES.earth;

  // Apparent human weight calculation: W = m * (g / 9.80665)
  const apparentWeightKg = gMetersSec2 != null ? (humanWeightKg * (gMetersSec2 / 9.80665)) : null;

  // Details catalog lookup
  const details = PLANETARY_DETAILS[obj?.id] || {};
  const interiorLayers = details.interior || [
    { name: 'Bulk Interior', depthKm: `0 - ${formatKm(radiusKm, 0)}`, tempK: 'Unknown', desc: 'Internal layer model pending observational soundings.', color: '#495057' }
  ];

  const atmosphericGasList = ATMOSPHERE_COMPOSITIONS[obj?.id] || (obj?.atmosphere ? [{ gas: 'Mixed', name: obj.atmosphere, pct: 100, color: '#3b82f6' }] : null);
  const bulkCompositionList = BULK_COMPOSITIONS[obj?.id] || null;

  // Temperature conversions
  const formatTemp = (tempK) => {
    if (tempK == null || isNaN(tempK)) return 'N/A';
    if (tempUnit === 'K') return `${Math.round(tempK)} K`;
    if (tempUnit === 'F') return `${Math.round((tempK - 273.15) * 9/5 + 32)} °F`;
    return `${Math.round(tempK - 273.15)} °C`;
  };

  const currentTempK = obj?.temperatureMinK != null ? (obj.temperatureMinK + (obj.temperatureMaxK || obj.temperatureMinK)) / 2 : (details.atmosphere?.layers?.[0]?.tempK || null);

  // Status badges per metric
  const getMetricBadge = (key) => {
    if (key === 'radius' || key === 'mass') return { label: 'OBSERVED / REFERENCE', class: 'badge-observed' };
    if (key === 'diameter' || key === 'volume' || key === 'density' || key === 'gravity' || key === 'escape' || key === 'spinSpeed') return { label: 'DERIVED', class: 'badge-derived' };
    return { label: 'REFERENCE MODEL', class: 'badge-model' };
  };

  return (
    <div className="planetary-physics-lab font-mono">
      {/* ── 1. HEADER & CONTROL BAR ───────────────────────────────────────── */}
      <div className="ppl-header">
        <div className="ppl-header-titles">
          <div className="ppl-title">
            <span>PHYSICAL SCIENCE & PLANETARY ANALYTICS LAB</span>
            <span className={`ppl-badge ${validData.isRadiusValid && validData.isMassValid ? 'badge-verified' : 'badge-derived'}`}>
              {validData.isRadiusValid && validData.isMassValid ? '● VERIFIED PHYSICAL DATA' : '● DERIVED / MODELED'}
            </span>
          </div>
          <div className="ppl-subtitle">Measured + Derived Physical Parameters & Theoretical Calculations</div>
        </div>

        <div className="ppl-controls">
          <div className="ppl-baseline-toggle">
            <span className="ctrl-label">BASELINE COMPARISON:</span>
            <select 
              className="ppl-select"
              value={comparisonBaselineKey}
              onChange={(e) => setComparisonBaselineKey(e.target.value)}
            >
              <option value="earth">Earth (1.0×)</option>
              <option value="moon">Moon (0.27×)</option>
              <option value="jupiter">Jupiter (10.97×)</option>
              <option value="sun">Sun (109.3×)</option>
            </select>
          </div>
          <button 
            className={`ppl-btn ${useEarthBaseline ? 'ppl-btn--active' : ''}`}
            onClick={() => setUseEarthBaseline(!useEarthBaseline)}
          >
            {useEarthBaseline ? 'RELATIVE RATIOS ON' : 'ABSOLUTE UNITS'}
          </button>
        </div>
      </div>

      {/* ── 2. PRIMARY PHYSICAL METRICS MATRIX ─────────────────────────────── */}
      <div className="ppl-section-title">
        <span>1. PRIMARY PHYSICAL MATRIX</span>
        <span className="ppl-subtag">CLICK [ƒx] TO INSPECT FORMULA & STEP-BY-STEP TRACE</span>
      </div>

      <div className="ppl-matrix-grid">
        {/* RADIUS */}
        <div 
          className={`ppl-metric-card ${activeCalcId === 'relative-radius' ? 'ppl-metric-card--active' : ''}`}
          onClick={() => setActiveCalcId('relative-radius')}
        >
          <div className="pmc-header">
            <span className="pmc-label">MEAN RADIUS (R)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{formatKm(radiusKm, 1)}</span>
            {useEarthBaseline && (
              <span className="pmc-ratio">({(radiusKm / refBaseline.radiusKm).toFixed(3)}× {refBaseline.name})</span>
            )}
          </div>
        </div>

        {/* DIAMETER */}
        <div 
          className={`ppl-metric-card ${activeCalcId === 'circumference' ? 'ppl-metric-card--active' : ''}`}
          onClick={() => setActiveCalcId('circumference')}
        >
          <div className="pmc-header">
            <span className="pmc-label">EQUATORIAL DIAMETER (2R)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{formatKm(diameterKm, 1)}</span>
            {useEarthBaseline && (
              <span className="pmc-ratio">({(diameterKm / (refBaseline.radiusKm * 2)).toFixed(3)}× {refBaseline.name})</span>
            )}
          </div>
        </div>

        {/* MASS */}
        <div 
          className={`ppl-metric-card ${activeCalcId === 'relative-mass' ? 'ppl-metric-card--active' : ''}`}
          onClick={() => setActiveCalcId('relative-mass')}
        >
          <div className="pmc-header">
            <span className="pmc-label">PHYSICAL MASS (M)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{massKg ? formatMass(massKg) : 'Not Measured'}</span>
            {massKg && useEarthBaseline && (
              <span className="pmc-ratio">({(massKg / refBaseline.massKg).toFixed(4)}× {refBaseline.name})</span>
            )}
          </div>
        </div>

        {/* VOLUME */}
        <div 
          className={`ppl-metric-card ${activeCalcId === 'volume' ? 'ppl-metric-card--active' : ''}`}
          onClick={() => setActiveCalcId('volume')}
        >
          <div className="pmc-header">
            <span className="pmc-label">TOTAL VOLUME (V)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{volumeKm3 ? `${volumeKm3.toExponential(3)} km³` : 'N/A'}</span>
            {volumeKm3 && useEarthBaseline && (
              <span className="pmc-ratio">({(volumeKm3 / refBaseline.volumeKm3).toFixed(2)}× {refBaseline.name})</span>
            )}
          </div>
        </div>

        {/* DENSITY */}
        <div 
          className={`ppl-metric-card ${activeCalcId === 'density' ? 'ppl-metric-card--active' : ''}`}
          onClick={() => setActiveCalcId('density')}
        >
          <div className="pmc-header">
            <span className="pmc-label">MEAN DENSITY (ρ)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{densityGcm3 != null ? `${densityGcm3.toFixed(3)} g/cm³` : 'N/A'}</span>
            {densityGcm3 != null && (
              <span className="pmc-ratio">({(densityGcm3 / 1.000).toFixed(2)}× Water • {(densityGcm3 / 5.514).toFixed(2)}× Earth)</span>
            )}
          </div>
        </div>

        {/* SURFACE GRAVITY */}
        <div 
          className={`ppl-metric-card ${activeCalcId === 'surface-gravity' ? 'ppl-metric-card--active' : ''}`}
          onClick={() => setActiveCalcId('surface-gravity')}
        >
          <div className="pmc-header">
            <span className="pmc-label">SURFACE GRAVITY (g)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{gMetersSec2 != null ? `${gMetersSec2.toFixed(2)} m/s²` : 'N/A'}</span>
            {gMetersSec2 != null && (
              <span className="pmc-ratio">({(gMetersSec2 / 9.80665).toFixed(2)}× Earth g)</span>
            )}
          </div>
        </div>

        {/* ESCAPE VELOCITY */}
        <div 
          className={`ppl-metric-card ${activeCalcId === 'escape-velocity' ? 'ppl-metric-card--active' : ''}`}
          onClick={() => setActiveCalcId('escape-velocity')}
        >
          <div className="pmc-header">
            <span className="pmc-label">ESCAPE VELOCITY (vₑ)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{escapeVelocityKmS != null ? `${escapeVelocityKmS.toFixed(2)} km/s` : 'N/A'}</span>
            {escapeVelocityKmS != null && (
              <span className="pmc-ratio">({(escapeVelocityKmS * 3600).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h)</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. PART 24.4: VISIBLE SCIENTIFIC CALCULATIONS INTERFACE CONSOLE ───── */}
      <div className="ppl-section-title">
        <span>2. SCIENTIFIC CALCULATIONS ENGINE [{allCalculations.length} AVAILABLE]</span>
        <span className="ppl-calc-count-tag">● {filteredCalculations.length} MATCHES</span>
      </div>

      <div className="ppl-calc-console">
        {/* CATEGORY & SEARCH TOOLBAR */}
        <div className="pcc-toolbar">
          <div className="pcc-categories">
            {CALCULATION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`pcc-cat-btn ${calcCategory === cat.id ? 'pcc-cat-btn--active' : ''}`}
                onClick={() => setCalcCategory(cat.id)}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="pcc-search-row">
            <input
              type="text"
              className="pcc-search-input font-mono"
              placeholder="🔍 Search formulas (e.g. gravity, velocity, density)..."
              value={calcSearch}
              onChange={(e) => setCalcSearch(e.target.value)}
            />
            {calcSearch && (
              <button className="pcc-clear-btn" onClick={() => setCalcSearch('')}>×</button>
            )}
          </div>
        </div>

        {/* CALCULATION ITEM BUTTONS GRID */}
        <div className="pcc-items-grid">
          {filteredCalculations.map(calc => {
            const isActive = activeCalcId === calc.id;
            return (
              <button
                key={calc.id}
                className={`pcc-item-btn ${isActive ? 'pcc-item-btn--active' : ''}`}
                onClick={() => setActiveCalcId(isActive ? null : calc.id)}
              >
                <div className="pib-top">
                  <span className="pib-name">{calc.name} ({calc.symbol})</span>
                  <span className="pib-fx">[ƒx]</span>
                </div>
                <div className="pib-bottom">
                  <span className="pib-form">{calc.formula}</span>
                  <span className="pib-res">{calc.displayResult} {calc.unit}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ACTIVE CALCULATION STEP-BY-STEP TRACE DRAWER */}
        {currentActiveCalcObj && (
          <CalculationTraceDrawer
            calc={currentActiveCalcObj}
            objName={obj.name}
            viewMode={calcViewMode}
            onToggleViewMode={setCalcViewMode}
          />
        )}
      </div>

      {/* ── 4. PROPORTIONAL SCALE COMPARISON INSTRUMENTS ───────────────────── */}
      <div className="ppl-section-title">3. PROPORTIONAL SCALE & COMPARATIVE INSTRUMENTS</div>

      <div className="ppl-widget-box">
        {/* RADIUS SCALE BARS */}
        <div className="ppl-subwidget">
          <div className="sw-title">RADIUS SCALE (EARTH = 1.00× BASELINE)</div>
          <div className="sw-bars">
            {[
              { name: 'Moon', r: 1737.4, val: '0.273×' },
              { name: 'Mars', r: 3389.5, val: '0.532×' },
              { name: 'Earth', r: 6371.0, val: '1.000×' },
              { name: 'Neptune', r: 24622.0, val: '3.864×' },
              { name: 'Saturn', r: 58232.0, val: '9.140×' },
              { name: 'Jupiter', r: 69911.0, val: '10.973×' },
              { name: obj.name.toUpperCase(), r: radiusKm, val: `${(radiusKm / 6371.0).toFixed(3)}×`, isTarget: true }
            ].map(item => {
              const maxR = 69911.0;
              const widthPct = Math.max(2, Math.min(100, (item.r / maxR) * 100));
              return (
                <div key={item.name} className={`sw-bar-row ${item.isTarget ? 'sw-bar-row--target' : ''}`}>
                  <span className="sw-label">{item.name}</span>
                  <div className="sw-bar-track">
                    <div className="sw-bar-fill" style={{ width: `${widthPct}%` }} />
                  </div>
                  <span className="sw-val">{item.val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RELATIVE MASS (LOG SCALE) */}
        <div className="ppl-subwidget">
          <div className="sw-title">RELATIVE MASS (LOG SCALE — LOG10 EARTH MASSES)</div>
          <div className="sw-bars">
            {[
              { name: 'Moon', m: 7.342e22, text: '0.0123 Earth Mass' },
              { name: 'Mars', m: 6.417e23, text: '0.107 Earth Mass' },
              { name: 'Earth', m: 5.972e24, text: '1.000 Earth Mass' },
              { name: 'Saturn', m: 5.683e26, text: '95.2 Earth Mass' },
              { name: 'Jupiter', m: 1.898e27, text: '317.8 Earth Mass' },
              { name: obj.name.toUpperCase(), m: massKg || 5.972e24, text: `${massKg ? (massKg / 5.972e24).toFixed(3) : 'N/A'} Earth Mass`, isTarget: true }
            ].map(item => {
              const logVal = Math.log10(item.m / 7.342e22) + 0.5;
              const maxLog = Math.log10(1.989e30 / 7.342e22) + 0.5;
              const widthPct = Math.max(3, Math.min(100, (logVal / maxLog) * 100));
              return (
                <div key={item.name} className={`sw-bar-row ${item.isTarget ? 'sw-bar-row--target' : ''}`}>
                  <span className="sw-label">{item.name}</span>
                  <div className="sw-bar-track">
                    <div className="sw-bar-fill sw-bar-fill--cyan" style={{ width: `${widthPct}%` }} />
                  </div>
                  <span className="sw-val">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DENSITY & GRAVITY INSTRUMENTS */}
      <div className="ppl-widget-box">
        {/* MEAN DENSITY GAUGE */}
        <div className="ppl-subwidget">
          <div className="sw-title">MEAN DENSITY COMPARISON (g/cm³)</div>
          <div className="sw-density-gauge">
            <div className="density-markers font-mono">
              <span style={{ left: '12%' }}>Saturn (0.69)</span>
              <span style={{ left: '18%' }}>Water (1.00)</span>
              <span style={{ left: '24%' }}>Jupiter (1.33)</span>
              <span style={{ left: '98%' }}>Earth (5.51)</span>
            </div>
            <div className="density-track">
              <div 
                className="density-indicator" 
                style={{ left: `${Math.min(98, Math.max(2, ((densityGcm3 || 1.0) / 5.514) * 100))}%` }} 
              >
                <div className="density-pin" />
                <span className="density-tag">{obj.name}: {densityGcm3 != null ? densityGcm3.toFixed(3) : 'N/A'} g/cm³</span>
              </div>
            </div>
            {obj.id === 'saturn' && (
              <div className="density-note">
                💡 <strong>PHYSICAL FACT:</strong> Saturn's mean density (0.687 g/cm³) is less than liquid water (1.000 g/cm³). If a ocean large enough existed, Saturn would float!
              </div>
            )}
          </div>
        </div>

        {/* HUMAN WEIGHT SIMULATOR / GRAVITY EXPERIENCE */}
        <div className="ppl-subwidget">
          <div className="sw-title">GRAVITY EXPERIENCE — HUMAN WEIGHT SIMULATOR (W = m · g)</div>
          <div className="hws-controls">
            <span className="hws-label">REFERENCE BODY MASS:</span>
            <input 
              type="range" 
              min="1" 
              max="200" 
              value={humanWeightKg}
              onChange={(e) => setHumanWeightKg(Number(e.target.value))}
              className="hws-slider"
            />
            <span className="hws-mass-display">{humanWeightKg} kg</span>
          </div>

          <div className="hws-results-grid">
            <div className="hws-card hws-card--highlight" onClick={() => setActiveCalcId('human-weight')}>
              <span className="hws-card-title">{obj.name.toUpperCase()} (APPARENT WEIGHT) [ƒx]</span>
              <span className="hws-card-val text-amber">{apparentWeightKg != null ? `${apparentWeightKg.toFixed(1)} kg` : 'N/A'}</span>
              <span className="hws-card-sub">
                {gMetersSec2 != null ? `${(apparentWeightKg * 9.80665).toFixed(0)} Newtons` : ''}
              </span>
            </div>

            <div className="hws-card">
              <span className="hws-card-title">EARTH (1.00 g)</span>
              <span className="hws-card-val">{humanWeightKg.toFixed(1)} kg</span>
              <span className="hws-card-sub">9.81 m/s²</span>
            </div>

            <div className="hws-card">
              <span className="hws-card-title">MOON (0.16 g)</span>
              <span className="hws-card-val">{(humanWeightKg * (1.62 / 9.80665)).toFixed(1)} kg</span>
              <span className="hws-card-sub">1.62 m/s²</span>
            </div>

            <div className="hws-card">
              <span className="hws-card-title">MARS (0.38 g)</span>
              <span className="hws-card-val">{(humanWeightKg * (3.721 / 9.80665)).toFixed(1)} kg</span>
              <span className="hws-card-sub">3.72 m/s²</span>
            </div>

            <div className="hws-card">
              <span className="hws-card-title">JUPITER (2.53 g)</span>
              <span className="hws-card-val">{(humanWeightKg * (24.79 / 9.80665)).toFixed(1)} kg</span>
              <span className="hws-card-sub">24.79 m/s²</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. DERIVED GEOMETRY & GRAVITATIONAL BOUNDARIES ────────────────── */}
      <div className="ppl-section-title">4. DERIVED GEOMETRY & GRAVITATIONAL SPHERES</div>

      <div className="ppl-matrix-grid">
        <div className="ppl-metric-card" onClick={() => setActiveCalcId('surface-area')}>
          <div className="pmc-header">
            <span className="pmc-label">SURFACE AREA (A = 4πR²)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{surfaceAreaKm2.toExponential(3)} km²</span>
            <span className="pmc-ratio">({(surfaceAreaKm2 / 5.10072e8).toFixed(2)}× Earth Surface)</span>
          </div>
        </div>

        <div className="ppl-metric-card" onClick={() => setActiveCalcId('circumference')}>
          <div className="pmc-header">
            <span className="pmc-label">EQUATORIAL CIRCUMFERENCE (2πR)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{formatKm(circumferenceKm, 0)}</span>
            <span className="pmc-ratio">({(circumferenceKm / 40075.0).toFixed(2)}× Earth Equator)</span>
          </div>
        </div>

        <div className="ppl-metric-card" onClick={() => setActiveCalcId('hill-sphere')}>
          <div className="pmc-header">
            <span className="pmc-label">HILL SPHERE RADIUS (r_H)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{hillSphereRadiusKm ? formatKm(hillSphereRadiusKm, 0) : 'N/A (Primary Star)'}</span>
            <span className="pmc-ratio">Gravitational Satellite Stability Boundary</span>
          </div>
        </div>

        <div className="ppl-metric-card" onClick={() => setActiveCalcId('sphere-of-influence')}>
          <div className="pmc-header">
            <span className="pmc-label">SPHERE OF INFLUENCE (r_SOI)</span>
            <span className="pmc-fx-btn">[ƒx]</span>
          </div>
          <div className="pmc-body">
            <span className="pmc-val">{sphereOfInfluenceKm ? formatKm(sphereOfInfluenceKm, 0) : 'N/A (Primary Star)'}</span>
            <span className="pmc-ratio">Laplace Orbital Perturbation Boundary</span>
          </div>
        </div>
      </div>

      {/* ── 6. ROTATION & AXIAL ORIENTATION LAB ───────────────────────────── */}
      <div className="ppl-section-title">5. ROTATION DYNAMICS & AXIAL ORIENTATION</div>

      <div className="ppl-widget-box">
        <div className="ppl-subwidget rot-lab-grid">
          {/* SVG SPHERICAL AXIS INSTRUMENT */}
          <div className="rot-diagram-stage">
            <svg viewBox="0 0 140 140" className="rot-diagram-svg">
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Orbital Ecliptic Reference Plane */}
              <line x1="10" y1="70" x2="130" y2="70" stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
              <text x="95" y="65" fill="rgba(255,255,255,0.4)" fontSize="6">ORBIT PLANE</text>

              {/* Normal to orbit plane */}
              <line x1="70" y1="10" x2="70" y2="130" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />

              {/* Rotated Axis */}
              {(() => {
                const tilt = obj?.axialTiltDeg || 0;
                const rad = (tilt * Math.PI) / 180;
                const len = 55;
                const nx = 70 - len * Math.sin(rad);
                const ny = 70 - len * Math.cos(rad);
                const sx = 70 + len * Math.sin(rad);
                const sy = 70 + len * Math.cos(rad);

                return (
                  <>
                    <line x1={nx} y1={ny} x2={sx} y2={sy} stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" />
                    <path d={`M 70 25 A 45 45 0 0 1 ${70 + 20 * Math.sin(rad)} ${70 - 45 * Math.cos(rad)}`} fill="none" stroke="#ffb703" strokeWidth="1" />
                    <text x="75" y="32" fill="#ffb703" fontSize="8" fontWeight="bold">{tilt.toFixed(1)}° TILT</text>
                    <circle cx={nx} cy={ny} r="3" fill="#ffea00" />
                    <circle cx={sx} cy={sy} r="3" fill="#00f0ff" />
                    <text x={nx + 4} y={ny + 2} fill="#ffea00" fontSize="7">N POLE</text>
                    <text x={sx + 4} y={sy + 2} fill="#00f0ff" fontSize="7">S POLE</text>
                  </>
                );
              })()}

              <circle cx="70" cy="70" r="40" fill="url(#bodyGrad)" stroke="rgba(0,240,255,0.5)" strokeWidth="1.5" />
              <path 
                d={isRetrograde ? "M 90 55 A 25 10 0 0 1 50 55" : "M 50 55 A 25 10 0 0 1 90 55"} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2" 
                strokeDasharray="3 2"
              />
              <polygon 
                points={isRetrograde ? "50,52 45,55 50,58" : "90,52 95,55 90,58"} 
                fill="#10b981" 
              />
              <text x="52" y="85" fill="#10b981" fontSize="7" fontWeight="bold">
                {isRetrograde ? "↺ RETROGRADE" : "↻ PROGRADE"}
              </text>
            </svg>
          </div>

          {/* ROTATION NUMERICAL PROFILE */}
          <div className="rot-profile-data">
            <div className="rpd-row">
              <span className="rpd-label">SIDEREAL ROTATION PERIOD:</span>
              <span className="rpd-val text-cyan">
                {absRotationHours ? (
                  absRotationHours < 24 ? `${absRotationHours.toFixed(2)} hours` : `${(absRotationHours / 24).toFixed(2)} days (${absRotationHours.toFixed(1)}h)`
                ) : 'N/A'}
              </span>
            </div>

            <div className="rpd-row">
              <span className="rpd-label">SOLAR DAY LENGTH:</span>
              <span className="rpd-val">
                {obj.id === 'earth' ? '24.000 hours' : (obj.id === 'mars' ? '24.659 hours (1 Sol)' : (absRotationHours ? `${absRotationHours.toFixed(2)} hours (approx)` : 'N/A'))}
              </span>
            </div>

            <div className="rpd-row">
              <span className="rpd-label">AXIAL TILT (OBLIQUITY):</span>
              <span className="rpd-val text-amber">{formatAngle(obj?.axialTiltDeg || 0, 2)}</span>
            </div>

            <div className="rpd-row">
              <span className="rpd-label">ROTATION DIRECTION:</span>
              <span className={`rpd-val ${isRetrograde ? 'text-red' : 'text-green'}`}>
                {isRetrograde ? 'RETROGRADE (East to West)' : 'PROGRADE (West to East)'}
              </span>
            </div>

            <div 
              className="rpd-row cursor-pointer" 
              onClick={() => setActiveCalcId('rotation-speed')}
              title="Click to view rotation speed calculation trace"
            >
              <span className="rpd-label">EQUATORIAL ROTATION SPEED [ƒx]:</span>
              <span className="rpd-val font-mono text-cyan">
                {equatorialSpinSpeedKmS != null ? (
                  `${equatorialSpinSpeedKmS.toFixed(3)} km/s (${(equatorialSpinSpeedKmS * 3600).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h)`
                ) : 'N/A'}
              </span>
            </div>

            {obj.id === 'sun' && (
              <div className="rpd-note">
                ☀️ <strong>DIFFERENTIAL ROTATION:</strong> The Sun does not rotate as a solid body. Its equator rotates in ~25.05 days, while polar regions take up to ~34.4 days!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 7. THERMAL PROFILE & ATMOSPHERE LAB ──────────────────────────── */}
      <div className="ppl-section-title">
        <span>6. THERMAL PROFILE & ATMOSPHERIC ENVIRONMENT</span>
        <div className="ppl-temp-unit-toggle">
          <button className={`unit-btn ${tempUnit === 'C' ? 'unit-btn--active' : ''}`} onClick={() => setTempUnit('C')}>°C</button>
          <button className={`unit-btn ${tempUnit === 'K' ? 'unit-btn--active' : ''}`} onClick={() => setTempUnit('K')}>K</button>
          <button className={`unit-btn ${tempUnit === 'F' ? 'unit-btn--active' : ''}`} onClick={() => setTempUnit('F')}>°F</button>
        </div>
      </div>

      <div className="ppl-widget-box">
        {/* THERMAL SCALE */}
        <div className="ppl-subwidget">
          <div className="sw-title">SURFACE / ATMOSPHERIC THERMAL RANGE</div>
          <div className="thermal-scale-grid">
            <div className="thermal-card">
              <span className="tc-lbl">MINIMUM TEMP</span>
              <span className="tc-val text-cyan">{formatTemp(obj?.temperatureMinK)}</span>
            </div>
            <div className="thermal-card thermal-card--highlight">
              <span className="tc-lbl">MEAN / SURFACE TEMP</span>
              <span className="tc-val text-amber">{formatTemp(currentTempK)}</span>
            </div>
            <div className="thermal-card">
              <span className="tc-lbl">MAXIMUM TEMP</span>
              <span className="tc-val text-red">{formatTemp(obj?.temperatureMaxK)}</span>
            </div>
          </div>
        </div>

        {/* ATMOSPHERIC COMPOSITION STACKED BAR */}
        {atmosphericGasList && (
          <div className="ppl-subwidget">
            <div className="sw-title">ATMOSPHERIC COMPOSITION BY VOLUME</div>
            <div className="comp-stacked-bar">
              {atmosphericGasList.map(gas => (
                <div 
                  key={gas.gas} 
                  className="csb-segment" 
                  style={{ width: `${gas.pct}%`, backgroundColor: gas.color }}
                  title={`${gas.name} (${gas.gas}): ${gas.pct}%`}
                />
              ))}
            </div>
            <div className="comp-legend">
              {atmosphericGasList.map(gas => (
                <div key={gas.gas} className="comp-legend-item">
                  <span className="cli-dot" style={{ backgroundColor: gas.color }} />
                  <span className="cli-label">{gas.name} ({gas.gas})</span>
                  <span className="cli-pct">{gas.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 8. COMPOSITION, INTERIOR & MAGNETOSPHERE ──────────────────────── */}
      <div className="ppl-section-title">7. BULK COMPOSITION, INTERIOR MODEL & MAGNETOSPHERE</div>

      <div className="ppl-widget-box">
        {/* BULK COMPOSITION STACKED BAR */}
        {bulkCompositionList && (
          <div className="ppl-subwidget">
            <div className="sw-title">BULK PLANETARY COMPOSITION MODEL</div>
            <div className="comp-stacked-bar">
              {bulkCompositionList.map(item => (
                <div 
                  key={item.name} 
                  className="csb-segment" 
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  title={`${item.name}: ${item.pct}%`}
                />
              ))}
            </div>
            <div className="comp-legend">
              {bulkCompositionList.map(item => (
                <div key={item.name} className="comp-legend-item">
                  <span className="cli-dot" style={{ backgroundColor: item.color }} />
                  <span className="cli-label">{item.name}</span>
                  <span className="cli-pct">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERIOR LAYER CUTAWAY SELECTION */}
        <div className="ppl-subwidget">
          <div className="sw-title">INTERIOR STRUCTURE CUTAWAY MODEL (CLICK LAYER TO INSPECT)</div>
          <div className="interior-layer-buttons">
            {interiorLayers.map((layer, idx) => (
              <button 
                key={layer.name}
                className={`il-btn ${selectedInteriorLayer === idx ? 'il-btn--active' : ''}`}
                style={{ borderColor: layer.color || '#00f0ff' }}
                onClick={() => setSelectedInteriorLayer(idx)}
              >
                {layer.name}
              </button>
            ))}
          </div>

          {interiorLayers[selectedInteriorLayer] && (
            <div className="interior-layer-card">
              <div className="ilc-header" style={{ color: interiorLayers[selectedInteriorLayer].color || '#00f0ff' }}>
                {interiorLayers[selectedInteriorLayer].name.toUpperCase()}
              </div>
              <div className="ilc-details">
                <div><strong>Depth Range:</strong> {interiorLayers[selectedInteriorLayer].depthKm}</div>
                <div><strong>Est. Temperature:</strong> {interiorLayers[selectedInteriorLayer].tempK}</div>
                <div><strong>Description:</strong> {interiorLayers[selectedInteriorLayer].desc}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 9. DATA PROVENANCE FOOTER ────────────────────────────────────── */}
      <div className="ppl-provenance-footer">
        <div className="pf-row">
          <span>DATA PROVENANCE: NASA / JPL SOLAR SYSTEM DYNAMICS (J2000.0 EPOCH)</span>
          <span>● STATUS: AUTHORITATIVE SCIENTIFIC METRICS</span>
        </div>
        <div className="pf-sub">
          All physical parameters derived using standard astronomical constants (G = 6.67430 × 10⁻¹¹ m³/kg·s², 1 AU = 149,597,870.7 km).
        </div>
      </div>
    </div>
  );
}

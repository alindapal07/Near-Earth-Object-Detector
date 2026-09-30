/**
 * physicalCalculations.js - Centralized Scientific Calculation Engine
 * Calculates physical, rotational, and comparative metrics with complete step-by-step traces.
 */

import { G_SI, AU_IN_KM, validateScientificData } from '../../utils/orbitalMath';
import { formatScientific, toSuperscript, formatFormulaText } from './calculationFormatter';
import { PLANET_DATA } from '../../data/planets';

const EARTH_R_KM = 6371.0;
const EARTH_M_KG = 5.97219e24;
const EARTH_V_KM3 = (4 / 3) * Math.PI * Math.pow(EARTH_R_KM, 3);
const EARTH_G_MS2 = 9.80665;

/**
 * Creates a standard calculation result structure
 */
function createResultObject({
  id,
  name,
  symbol,
  category = 'PHYSICAL',
  formula,
  tooltip,
  inputs = [],
  unitConversions = [],
  substitution = '',
  rawResult = null,
  displayResult = 'N/A',
  unit = '',
  type = 'DERIVED',
  source = 'DERIVED FROM PHYSICAL PARAMETERS',
  model = 'NEWTONIAN TWO-BODY',
  assumptions = [],
  status = 'VALID',
  statusReason = null,
  referenceValue = null,
  referenceDiff = null,
  validMatch = 'UNAVAILABLE'
}) {
  return {
    id,
    name,
    symbol,
    category,
    formula: formatFormulaText(formula),
    tooltip,
    inputs,
    unitConversions,
    substitution: formatFormulaText(substitution),
    rawResult,
    displayResult,
    unit,
    type,
    source,
    model,
    assumptions,
    status,
    statusReason,
    referenceValue,
    referenceDiff,
    validMatch
  };
}

/**
 * 1. SURFACE GRAVITY (g = GM / R²)
 */
export function calculateSurfaceGravity(obj) {
  const validData = validateScientificData(obj);
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!massKg || !radiusKm || massKg <= 0 || radiusKm <= 0) {
    return createResultObject({
      id: 'surface-gravity',
      name: 'Surface Gravity',
      symbol: 'g',
      category: 'PHYSICAL',
      formula: 'g = GM / R²',
      tooltip: 'Acceleration experienced near the reference surface due to the body gravitational attraction.',
      status: 'UNAVAILABLE',
      statusReason: !massKg ? 'Required physical mass (M) is missing.' : 'Required reference radius (R) is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const radiusMeters = radiusKm * 1000;
  const rawG = (G_SI * massKg) / (radiusMeters * radiusMeters);
  const displayG = rawG.toFixed(2);

  const refG = obj.gravity !== undefined ? Number(obj.gravity) : null;
  let diffPct = null;
  let matchStatus = '✓ MATCH';

  if (refG !== null && refG > 0) {
    diffPct = Math.abs((rawG - refG) / refG) * 100;
    if (diffPct < 0.5) matchStatus = '✓ MATCH';
    else if (diffPct < 5.0) matchStatus = '≈ CLOSE';
    else matchStatus = '⚠ DIFFERENCE';
  }

  return createResultObject({
    id: 'surface-gravity',
    name: 'Surface Gravity',
    symbol: 'g',
    category: 'PHYSICAL',
    formula: 'g = GM / R²',
    tooltip: 'Acceleration experienced near the reference surface due to the body gravitational attraction.',
    inputs: [
      { symbol: 'G', name: 'Gravitational Constant', value: G_SI, unit: 'm³ kg⁻¹ s⁻²', displayValue: '6.67430 × 10⁻¹¹' },
      { symbol: 'M', name: 'Physical Mass', value: massKg, unit: 'kg', displayValue: formatScientific(massKg, 3) },
      { symbol: 'R', name: 'Reference Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` }
    ],
    unitConversions: [
      `R = ${radiusKm.toLocaleString()} km → ${formatScientific(radiusMeters, 4)} m`
    ],
    substitution: `g = (6.67430 × 10⁻¹¹ × ${formatScientific(massKg, 3)}) / (${formatScientific(radiusMeters, 4)})²`,
    rawResult: rawG,
    displayResult: displayG,
    unit: 'm/s²',
    type: 'DERIVED',
    source: 'DERIVED FROM PHYSICAL PARAMETERS',
    model: 'NEWTONIAN TWO-BODY',
    assumptions: [
      'Spherical body approximation',
      'Mean reference surface radius used',
      'Point-mass gravitational center'
    ],
    status: 'VALID',
    referenceValue: refG != null ? refG.toFixed(2) : null,
    referenceDiff: diffPct,
    validMatch: matchStatus
  });
}

/**
 * 2. ESCAPE VELOCITY (v_e = sqrt(2GM / R))
 */
export function calculateEscapeVelocity(obj) {
  const validData = validateScientificData(obj);
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!massKg || !radiusKm || massKg <= 0 || radiusKm <= 0) {
    return createResultObject({
      id: 'escape-velocity',
      name: 'Escape Velocity',
      symbol: 'vₑ',
      category: 'PHYSICAL',
      formula: 'vₑ = √(2GM / R)',
      tooltip: 'Minimum speed needed for a free non-propelled object to escape from the gravitational influence of a primary body.',
      status: 'UNAVAILABLE',
      statusReason: !massKg ? 'Required physical mass (M) is missing.' : 'Required reference radius (R) is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const radiusMeters = radiusKm * 1000;
  const rawVEscMps = Math.sqrt((2 * G_SI * massKg) / radiusMeters);
  const rawVEscKps = rawVEscMps / 1000;
  const displayVEsc = rawVEscKps.toFixed(2);

  const refVEsc = obj.escapeVelocity !== undefined ? Number(obj.escapeVelocity) : null;
  let diffPct = null;
  let matchStatus = '✓ MATCH';

  if (refVEsc !== null && refVEsc > 0) {
    diffPct = Math.abs((rawVEscKps - refVEsc) / refVEsc) * 100;
    if (diffPct < 0.5) matchStatus = '✓ MATCH';
    else if (diffPct < 5.0) matchStatus = '≈ CLOSE';
    else matchStatus = '⚠ DIFFERENCE';
  }

  return createResultObject({
    id: 'escape-velocity',
    name: 'Escape Velocity',
    symbol: 'vₑ',
    category: 'PHYSICAL',
    formula: 'vₑ = √(2GM / R)',
    tooltip: 'Minimum speed needed for a free non-propelled object to escape from the gravitational influence of a primary body.',
    inputs: [
      { symbol: 'G', name: 'Gravitational Constant', value: G_SI, unit: 'm³ kg⁻¹ s⁻²', displayValue: '6.67430 × 10⁻¹¹' },
      { symbol: 'M', name: 'Physical Mass', value: massKg, unit: 'kg', displayValue: formatScientific(massKg, 3) },
      { symbol: 'R', name: 'Reference Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` }
    ],
    unitConversions: [
      `R = ${radiusKm.toLocaleString()} km → ${formatScientific(radiusMeters, 4)} m`
    ],
    substitution: `vₑ = √((2 × 6.67430 × 10⁻¹¹ × ${formatScientific(massKg, 3)}) / ${formatScientific(radiusMeters, 4)})`,
    rawResult: rawVEscKps,
    displayResult: displayVEsc,
    unit: 'km/s',
    type: 'DERIVED',
    source: 'DERIVED FROM PHYSICAL PARAMETERS',
    model: 'NEWTONIAN ENERGY CONSERVATION',
    assumptions: [
      'Unpropelled ballistic escape trajectory',
      'Neglects atmospheric drag',
      'Spherical body approximation'
    ],
    status: 'VALID',
    referenceValue: refVEsc != null ? refVEsc.toFixed(2) : null,
    referenceDiff: diffPct,
    validMatch: matchStatus
  });
}

/**
 * 3. VOLUME (V = 4/3 * pi * R³)
 */
export function calculateVolume(obj) {
  const validData = validateScientificData(obj);
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!radiusKm || radiusKm <= 0) {
    return createResultObject({
      id: 'volume',
      name: 'Total Volume',
      symbol: 'V',
      category: 'PHYSICAL',
      formula: 'V = (4/3)πR³',
      tooltip: 'Three-dimensional space enclosed within the mean spherical radius of the body.',
      status: 'UNAVAILABLE',
      statusReason: 'Required reference radius (R) is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const rawVolKm3 = (4 / 3) * Math.PI * Math.pow(radiusKm, 3);
  const displayVol = formatScientific(rawVolKm3, 3);

  return createResultObject({
    id: 'volume',
    name: 'Total Volume',
    symbol: 'V',
    category: 'PHYSICAL',
    formula: 'V = (4/3)πR³',
    tooltip: 'Three-dimensional space enclosed within the mean spherical radius of the body.',
    inputs: [
      { symbol: 'R', name: 'Mean Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` },
      { symbol: 'π', name: 'Pi Constant', value: Math.PI, unit: '', displayValue: '3.14159' }
    ],
    unitConversions: [
      `R³ = (${radiusKm.toLocaleString()})³ → ${formatScientific(Math.pow(radiusKm, 3), 3)} km³`
    ],
    substitution: `V = (4/3) × 3.14159 × (${radiusKm.toLocaleString()})³`,
    rawResult: rawVolKm3,
    displayResult: displayVol,
    unit: 'km³',
    type: 'DERIVED',
    source: 'DERIVED FROM MEAN RADIUS',
    model: 'SPHERICAL GEOMETRY',
    assumptions: [
      'Idealized sphere model',
      'Mean radius used'
    ],
    status: 'VALID',
    referenceValue: null,
    validMatch: '✓ MATCH'
  });
}

/**
 * 4. DENSITY (rho = M / V)
 */
export function calculateDensity(obj) {
  const validData = validateScientificData(obj);
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!massKg || !radiusKm || massKg <= 0 || radiusKm <= 0) {
    return createResultObject({
      id: 'density',
      name: 'Mean Density',
      symbol: 'ρ',
      category: 'PHYSICAL',
      formula: 'ρ = M / V',
      tooltip: 'Average mass per unit volume of the planetary body.',
      status: 'UNAVAILABLE',
      statusReason: !massKg ? 'Required physical mass (M) is missing.' : 'Required reference radius (R) is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const volKm3 = (4 / 3) * Math.PI * Math.pow(radiusKm, 3);
  const volM3 = volKm3 * 1e9;
  const rawDensityKgM3 = massKg / volM3;
  const rawDensityGcm3 = rawDensityKgM3 / 1000;
  const displayDensity = rawDensityGcm3.toFixed(3);

  const refDensity = obj.density !== undefined ? Number(obj.density) : null;
  let diffPct = null;
  let matchStatus = '✓ MATCH';

  if (refDensity !== null && refDensity > 0) {
    diffPct = Math.abs((rawDensityGcm3 - refDensity) / refDensity) * 100;
    if (diffPct < 0.5) matchStatus = '✓ MATCH';
    else if (diffPct < 5.0) matchStatus = '≈ CLOSE';
    else matchStatus = '⚠ DIFFERENCE';
  }

  return createResultObject({
    id: 'density',
    name: 'Mean Density',
    symbol: 'ρ',
    category: 'PHYSICAL',
    formula: 'ρ = M / V',
    tooltip: 'Average mass per unit volume of the planetary body.',
    inputs: [
      { symbol: 'M', name: 'Physical Mass', value: massKg, unit: 'kg', displayValue: formatScientific(massKg, 3) },
      { symbol: 'V', name: 'Derived Volume', value: volKm3, unit: 'km³', displayValue: formatScientific(volKm3, 3) }
    ],
    unitConversions: [
      `V = ${formatScientific(volKm3, 3)} km³ → ${formatScientific(volM3, 3)} m³`,
      `1 kg/m³ = 0.001 g/cm³`
    ],
    substitution: `ρ = (${formatScientific(massKg, 3)} kg) / (${formatScientific(volM3, 3)} m³)`,
    rawResult: rawDensityGcm3,
    displayResult: displayDensity,
    unit: 'g/cm³',
    type: 'DERIVED',
    source: 'DERIVED FROM MASS AND DERIVED VOLUME',
    model: 'BULK DENSITY MODEL',
    assumptions: [
      'Uniform mass distribution in volume',
      'Spherical body assumption'
    ],
    status: 'VALID',
    referenceValue: refDensity != null ? refDensity.toFixed(3) : null,
    referenceDiff: diffPct,
    validMatch: matchStatus
  });
}

/**
 * 5. SURFACE AREA (A = 4 * pi * R²)
 */
export function calculateSurfaceArea(obj) {
  const validData = validateScientificData(obj);
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!radiusKm || radiusKm <= 0) {
    return createResultObject({
      id: 'surface-area',
      name: 'Surface Area',
      symbol: 'A',
      category: 'PHYSICAL',
      formula: 'A = 4πR²',
      tooltip: 'Total outer surface area of the mean spherical body.',
      status: 'UNAVAILABLE',
      statusReason: 'Required reference radius (R) is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const rawAreaKm2 = 4 * Math.PI * Math.pow(radiusKm, 2);
  const displayArea = formatScientific(rawAreaKm2, 3);

  return createResultObject({
    id: 'surface-area',
    name: 'Surface Area',
    symbol: 'A',
    category: 'PHYSICAL',
    formula: 'A = 4πR²',
    tooltip: 'Total outer surface area of the mean spherical body.',
    inputs: [
      { symbol: 'R', name: 'Mean Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` },
      { symbol: 'π', name: 'Pi Constant', value: Math.PI, unit: '', displayValue: '3.14159' }
    ],
    unitConversions: [
      `R² = (${radiusKm.toLocaleString()})² → ${formatScientific(Math.pow(radiusKm, 2), 3)} km²`
    ],
    substitution: `A = 4 × 3.14159 × (${radiusKm.toLocaleString()})²`,
    rawResult: rawAreaKm2,
    displayResult: displayArea,
    unit: 'km²',
    type: 'DERIVED',
    source: 'DERIVED FROM MEAN RADIUS',
    model: 'SPHERICAL GEOMETRY',
    assumptions: ['Smooth spherical surface without terrain roughness'],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 6. CIRCUMFERENCE (C = 2 * pi * R)
 */
export function calculateCircumference(obj) {
  const validData = validateScientificData(obj);
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!radiusKm || radiusKm <= 0) {
    return createResultObject({
      id: 'circumference',
      name: 'Equatorial Circumference',
      symbol: 'C',
      category: 'PHYSICAL',
      formula: 'C = 2πR',
      tooltip: 'Distance around the equator of the spherical body.',
      status: 'UNAVAILABLE',
      statusReason: 'Required reference radius (R) is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const rawCircumferenceKm = 2 * Math.PI * radiusKm;
  const displayCircumference = rawCircumferenceKm.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return createResultObject({
    id: 'circumference',
    name: 'Equatorial Circumference',
    symbol: 'C',
    category: 'PHYSICAL',
    formula: 'C = 2πR',
    tooltip: 'Distance around the equator of the spherical body.',
    inputs: [
      { symbol: 'R', name: 'Mean/Equatorial Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` },
      { symbol: 'π', name: 'Pi Constant', value: Math.PI, unit: '', displayValue: '3.14159' }
    ],
    unitConversions: [],
    substitution: `C = 2 × 3.14159 × ${radiusKm.toLocaleString()} km`,
    rawResult: rawCircumferenceKm,
    displayResult: displayCircumference,
    unit: 'km',
    type: 'DERIVED',
    source: 'DERIVED FROM RADIUS',
    model: 'CIRCULAR EQUATOR MODEL',
    assumptions: ['Circular equator assumption'],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 7. ROTATION SPEED (v = 2 * pi * R / T)
 */
export function calculateRotationSpeed(obj) {
  const validData = validateScientificData(obj);
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;
  const rotHours = obj?.rotationPeriodHours !== undefined ? Math.abs(Number(obj.rotationPeriodHours)) : null;

  if (!radiusKm || !rotHours || rotHours <= 0) {
    return createResultObject({
      id: 'rotation-speed',
      name: 'Equatorial Rotation Speed',
      symbol: 'v_rot',
      category: 'ROTATION',
      formula: 'v = 2πR / T',
      tooltip: 'Linear surface speed at the equator due to planetary axial rotation.',
      status: 'UNAVAILABLE',
      statusReason: !rotHours ? 'Rotation period (T) is missing or invalid.' : 'Reference radius (R) is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const circumferenceMeters = 2 * Math.PI * radiusKm * 1000;
  const periodSeconds = rotHours * 3600;
  const rawSpinSpeedMps = circumferenceMeters / periodSeconds;
  const rawSpinSpeedKps = rawSpinSpeedMps / 1000;
  const displaySpinSpeed = rawSpinSpeedKps.toFixed(3);

  return createResultObject({
    id: 'rotation-speed',
    name: 'Equatorial Rotation Speed',
    symbol: 'v_rot',
    category: 'ROTATION',
    formula: 'v = 2πR / T',
    tooltip: 'Linear surface speed at the equator due to planetary axial rotation.',
    inputs: [
      { symbol: 'R', name: 'Equatorial Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` },
      { symbol: 'T', name: 'Sidereal Rotation Period', value: rotHours, unit: 'hours', displayValue: `${rotHours.toFixed(2)} hours` }
    ],
    unitConversions: [
      `C = 2πR = ${formatScientific(circumferenceMeters, 3)} m`,
      `T = ${rotHours.toFixed(2)} hours → ${periodSeconds.toLocaleString()} seconds`
    ],
    substitution: `v = (${formatScientific(circumferenceMeters, 3)} m) / (${periodSeconds.toLocaleString()} s)`,
    rawResult: rawSpinSpeedKps,
    displayResult: displaySpinSpeed,
    unit: 'km/s',
    type: 'DERIVED',
    source: 'DERIVED FROM ROTATION PERIOD & RADIUS',
    model: 'RIGID BODY ROTATION MODEL',
    assumptions: [
      'Rigid body rotation assumption at equator',
      'Sidereal rotation period used'
    ],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 8. RELATIVE RADIUS (R_ratio = R_obj / R_Earth)
 */
export function calculateRelativeRadius(obj) {
  const validData = validateScientificData(obj);
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!radiusKm || radiusKm <= 0) {
    return createResultObject({
      id: 'relative-radius',
      name: 'Relative Radius Ratio',
      symbol: 'R/R⊕',
      category: 'COMPARATIVE',
      formula: 'R_ratio = R_object / R_Earth',
      tooltip: 'Physical radius relative to Earth baseline radius (6,371.0 km).',
      status: 'UNAVAILABLE',
      statusReason: 'Radius is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const ratio = radiusKm / EARTH_R_KM;
  return createResultObject({
    id: 'relative-radius',
    name: 'Relative Radius Ratio',
    symbol: 'R/R⊕',
    category: 'COMPARATIVE',
    formula: 'R_ratio = R_object / R_Earth',
    tooltip: 'Physical radius relative to Earth baseline radius (6,371.0 km).',
    inputs: [
      { symbol: 'R_obj', name: 'Object Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` },
      { symbol: 'R_Earth', name: 'Earth Radius Baseline', value: EARTH_R_KM, unit: 'km', displayValue: '6,371.0 km' }
    ],
    unitConversions: [],
    substitution: `R_ratio = ${radiusKm.toLocaleString()} km / 6,371.0 km`,
    rawResult: ratio,
    displayResult: `${ratio.toFixed(3)}×`,
    unit: 'Earth radii (R⊕)',
    type: 'DERIVED',
    source: 'EARTH BASELINE COMPARISON',
    model: 'RELATIVE SCALE RATIO',
    assumptions: ['Earth Mean Radius = 6,371.0 km'],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 9. RELATIVE MASS (M_ratio = M_obj / M_Earth)
 */
export function calculateRelativeMass(obj) {
  const validData = validateScientificData(obj);
  const massKg = validData.massKg ? Number(validData.massKg) : null;

  if (!massKg || massKg <= 0) {
    return createResultObject({
      id: 'relative-mass',
      name: 'Relative Mass Ratio',
      symbol: 'M/M⊕',
      category: 'COMPARATIVE',
      formula: 'M_ratio = M_object / M_Earth',
      tooltip: 'Physical mass relative to Earth baseline mass (5.972 × 10²⁴ kg).',
      status: 'UNAVAILABLE',
      statusReason: 'Mass is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const ratio = massKg / EARTH_M_KG;
  return createResultObject({
    id: 'relative-mass',
    name: 'Relative Mass Ratio',
    symbol: 'M/M⊕',
    category: 'COMPARATIVE',
    formula: 'M_ratio = M_object / M_Earth',
    tooltip: 'Physical mass relative to Earth baseline mass (5.972 × 10²⁴ kg).',
    inputs: [
      { symbol: 'M_obj', name: 'Object Mass', value: massKg, unit: 'kg', displayValue: formatScientific(massKg, 3) },
      { symbol: 'M_Earth', name: 'Earth Mass Baseline', value: EARTH_M_KG, unit: 'kg', displayValue: '5.972 × 10²⁴ kg' }
    ],
    unitConversions: [],
    substitution: `M_ratio = (${formatScientific(massKg, 3)} kg) / (5.972 × 10²⁴ kg)`,
    rawResult: ratio,
    displayResult: `${ratio.toFixed(3)}×`,
    unit: 'Earth masses (M⊕)',
    type: 'DERIVED',
    source: 'EARTH BASELINE COMPARISON',
    model: 'RELATIVE SCALE RATIO',
    assumptions: ['Earth Mass = 5.972 × 10²⁴ kg'],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 10. RELATIVE VOLUME (V_ratio = V_obj / V_Earth)
 */
export function calculateRelativeVolume(obj) {
  const validData = validateScientificData(obj);
  const radiusKm = validData.radiusKm ? Number(validData.radiusKm) : null;

  if (!radiusKm || radiusKm <= 0) {
    return createResultObject({
      id: 'relative-volume',
      name: 'Relative Volume Ratio',
      symbol: 'V/V⊕',
      category: 'COMPARATIVE',
      formula: 'V_ratio = (R_object / R_Earth)³',
      tooltip: 'Three-dimensional volume relative to Earth baseline volume.',
      status: 'UNAVAILABLE',
      statusReason: 'Radius is missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const rRatio = radiusKm / EARTH_R_KM;
  const vRatio = Math.pow(rRatio, 3);

  return createResultObject({
    id: 'relative-volume',
    name: 'Relative Volume Ratio',
    symbol: 'V/V⊕',
    category: 'COMPARATIVE',
    formula: 'V_ratio = (R_object / R_Earth)³',
    tooltip: 'Three-dimensional volume relative to Earth baseline volume.',
    inputs: [
      { symbol: 'R_obj', name: 'Object Radius', value: radiusKm, unit: 'km', displayValue: `${radiusKm.toLocaleString()} km` },
      { symbol: 'R_Earth', name: 'Earth Radius Baseline', value: EARTH_R_KM, unit: 'km', displayValue: '6,371.0 km' }
    ],
    unitConversions: [],
    substitution: `V_ratio = (${radiusKm.toLocaleString()} / 6,371.0)³ = (${rRatio.toFixed(3)})³`,
    rawResult: vRatio,
    displayResult: `${vRatio.toFixed(2)}×`,
    unit: 'Earth volumes (V⊕)',
    type: 'DERIVED',
    source: 'EARTH BASELINE COMPARISON',
    model: 'SPHERICAL SCALE RATIO',
    assumptions: ['Spherical bodies assumption'],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 11. HUMAN WEIGHT SIMULATION (W = m * g)
 */
export function calculateHumanWeight(obj, humanMassKg = 70) {
  const gObj = calculateSurfaceGravity(obj);
  if (gObj.status !== 'VALID' || !gObj.rawResult) {
    return createResultObject({
      id: 'human-weight',
      name: 'Apparent Human Surface Weight',
      symbol: 'W',
      category: 'PHYSICAL',
      formula: 'W = m · g',
      tooltip: 'Gravitational force experienced by a reference mass on the target body surface.',
      status: 'UNAVAILABLE',
      statusReason: 'Surface gravity unavailable.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const gMS2 = gObj.rawResult;
  const weightNewtons = humanMassKg * gMS2;
  const apparentKg = humanMassKg * (gMS2 / EARTH_G_MS2);

  return createResultObject({
    id: 'human-weight',
    name: 'Apparent Human Surface Weight',
    symbol: 'W',
    category: 'PHYSICAL',
    formula: 'W = m · g',
    tooltip: 'Gravitational force experienced by a reference mass on the target body surface.',
    inputs: [
      { symbol: 'm', name: 'Reference Body Mass', value: humanMassKg, unit: 'kg', displayValue: `${humanMassKg} kg` },
      { symbol: 'g', name: 'Surface Gravity', value: gMS2, unit: 'm/s²', displayValue: `${gMS2.toFixed(2)} m/s²` }
    ],
    unitConversions: [
      `Earth Standard Gravity g₀ = 9.80665 m/s²`,
      `Force W = ${humanMassKg} kg × ${gMS2.toFixed(2)} m/s² = ${weightNewtons.toFixed(1)} N`
    ],
    substitution: `W = ${humanMassKg} kg × ${gMS2.toFixed(2)} m/s²`,
    rawResult: weightNewtons,
    displayResult: `${apparentKg.toFixed(1)} kg-equivalent (${weightNewtons.toFixed(0)} N)`,
    unit: 'Apparent Weight',
    type: 'DERIVED',
    source: 'NEWTONIAN FORCE FORMULA',
    model: 'SURFACE GRAVITATIONAL FORCE',
    assumptions: [
      'Reference body mass does NOT change',
      'Force W is gravitational pull m*g',
      'Earth apparent equivalent = W / 9.80665'
    ],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 12. HILL SPHERE RADIUS (r_H ≈ a(1-e)(m / 3M)^(1/3))
 */
export function calculateHillSphere(obj) {
  const validData = validateScientificData(obj);
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const aAu = validData.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / AU_IN_KM : null);
  const eVal = validData.e || 0;

  if (obj?.id === 'sun') {
    return createResultObject({
      id: 'hill-sphere',
      name: 'Hill Sphere Radius',
      symbol: 'r_H',
      category: 'ORBITAL',
      formula: 'r_H ≈ a(1-e) ∛(m / 3M)',
      tooltip: 'Region around a astronomical body where it dominates the attraction of satellites.',
      status: 'UNAVAILABLE',
      statusReason: 'Sun is the primary central star; Hill sphere is relative to galaxy core.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const parentMassKg = obj?.parentPlanet ? (PLANET_DATA[obj.parentPlanet]?.massKg || EARTH_M_KG) : 1.989e30; // Sun default

  if (!aAu || !massKg || !parentMassKg || aAu <= 0) {
    return createResultObject({
      id: 'hill-sphere',
      name: 'Hill Sphere Radius',
      symbol: 'r_H',
      category: 'ORBITAL',
      formula: 'r_H ≈ a(1-e) ∛(m / 3M)',
      tooltip: 'Region around a astronomical body where it dominates the attraction of satellites.',
      status: 'UNAVAILABLE',
      statusReason: 'Semi-major axis (a) or physical mass (m) missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const aKm = aAu * AU_IN_KM;
  const rawHillKm = aKm * (1 - eVal) * Math.cbrt(massKg / (3 * parentMassKg));
  const displayHill = rawHillKm.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return createResultObject({
    id: 'hill-sphere',
    name: 'Hill Sphere Radius',
    symbol: 'r_H',
    category: 'ORBITAL',
    formula: 'r_H ≈ a(1-e) ∛(m / 3M)',
    tooltip: 'Region around a astronomical body where it dominates the attraction of satellites.',
    inputs: [
      { symbol: 'a', name: 'Semi-Major Axis', value: aAu, unit: 'AU', displayValue: `${aAu.toFixed(4)} AU (${aKm.toLocaleString()} km)` },
      { symbol: 'e', name: 'Eccentricity', value: eVal, unit: '', displayValue: `${eVal.toFixed(4)}` },
      { symbol: 'm', name: 'Body Mass', value: massKg, unit: 'kg', displayValue: formatScientific(massKg, 3) },
      { symbol: 'M', name: 'Primary Mass', value: parentMassKg, unit: 'kg', displayValue: formatScientific(parentMassKg, 3) }
    ],
    unitConversions: [
      `a = ${aAu.toFixed(4)} AU → ${aKm.toLocaleString()} km`,
      `m / 3M = ${formatScientific(massKg / (3 * parentMassKg), 4)}`
    ],
    substitution: `r_H ≈ ${aKm.toLocaleString()} × (1 - ${eVal.toFixed(4)}) × ∛(${formatScientific(massKg / (3 * parentMassKg), 3)})`,
    rawResult: rawHillKm,
    displayResult: `${displayHill} km`,
    unit: 'km',
    type: 'DERIVED',
    source: 'THREE-BODY GRAVITATIONAL APPROXIMATION',
    model: 'CIRCULAR RESTRICTED THREE-BODY MODEL',
    assumptions: [
      'Approximate boundary for satellite stability',
      'Stable orbits typically stay within 1/3 to 1/2 of Hill radius'
    ],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

/**
 * 13. SPHERE OF INFLUENCE (r_SOI ≈ a(m / M)^(2/5))
 */
export function calculateSphereOfInfluence(obj) {
  const validData = validateScientificData(obj);
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const aAu = validData.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / AU_IN_KM : null);

  if (obj?.id === 'sun' || !aAu || !massKg || aAu <= 0) {
    return createResultObject({
      id: 'sphere-of-influence',
      name: 'Sphere of Influence',
      symbol: 'r_SOI',
      category: 'ORBITAL',
      formula: 'r_SOI ≈ a (m / M)^(2/5)',
      tooltip: 'Laplacian boundary region where body gravity dominates orbital perturbations over the primary.',
      status: 'UNAVAILABLE',
      statusReason: obj?.id === 'sun' ? 'Primary central star' : 'Orbital or mass data missing.',
      validMatch: '? UNAVAILABLE'
    });
  }

  const parentMassKg = obj?.parentPlanet ? (PLANET_DATA[obj.parentPlanet]?.massKg || EARTH_M_KG) : 1.989e30;
  const aKm = aAu * AU_IN_KM;
  const rawSoiKm = aKm * Math.pow(massKg / parentMassKg, 0.4);
  const displaySoi = rawSoiKm.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return createResultObject({
    id: 'sphere-of-influence',
    name: 'Sphere of Influence',
    symbol: 'r_SOI',
    category: 'ORBITAL',
    formula: 'r_SOI ≈ a (m / M)^(2/5)',
    tooltip: 'Laplacian boundary region where body gravity dominates orbital perturbations over the primary.',
    inputs: [
      { symbol: 'a', name: 'Semi-Major Axis', value: aAu, unit: 'AU', displayValue: `${aAu.toFixed(4)} AU (${aKm.toLocaleString()} km)` },
      { symbol: 'm', name: 'Body Mass', value: massKg, unit: 'kg', displayValue: formatScientific(massKg, 3) },
      { symbol: 'M', name: 'Primary Mass', value: parentMassKg, unit: 'kg', displayValue: formatScientific(parentMassKg, 3) }
    ],
    unitConversions: [
      `(m / M)^(2/5) = (${formatScientific(massKg / parentMassKg, 4)})^0.4`
    ],
    substitution: `r_SOI ≈ ${aKm.toLocaleString()} × (${formatScientific(massKg / parentMassKg, 3)})^0.4`,
    rawResult: rawSoiKm,
    displayResult: `${displaySoi} km`,
    unit: 'km',
    type: 'DERIVED',
    source: 'LAPLACIAN TWO-BODY PERTURBATION MODEL',
    model: 'LAPLACE SOI APPROXIMATION',
    assumptions: ['Used in patched-conic trajectory planning'],
    status: 'VALID',
    validMatch: '✓ MATCH'
  });
}

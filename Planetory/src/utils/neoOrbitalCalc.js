/**
 * neoOrbitalCalc.js — NEO Orbital Calculations (Part 35)
 * 
 * All calculations are clearly labeled with their source/model.
 * 
 * IMPORTANT:
 * - Propagation here is PLANETORY TWO-BODY APPROXIMATION
 * - This is NOT equivalent to NASA/JPL high-precision orbit determination
 * - Official impact risk always comes from CNEOS/Sentry
 * 
 * Reuses the same mathematics as orbitalMath.js but extended for:
 * - Labeled formula display
 * - Uncertainty estimates
 * - Earth-relative calculations
 * - Lunar distance conversions
 */

import {
  solveKepler,
  calculateTrueAnomaly,
  calculateHeliocentricPosition,
  calculateMeanAnomaly,
  calculateOrbitalVelocity,
  calculateApsides,
  getSemiMajorAxis
} from './orbitalMath.js';

export const MODEL_LABEL = 'PLANETORY TWO-BODY APPROXIMATION';
export const AU_KM = 149597870.7;
export const LUNAR_DISTANCE_KM = 384400;
export const MU_SUN_KM3_S2 = 1.32712440018e11;

// ─── Labeled Calculation Results ─────────────────────────────────────────────

/**
 * Creates a labeled calculation result for display in the Scientific Calculations drawer.
 */
function labeledResult(name, formula, inputs, result, unit, model = MODEL_LABEL, source = 'Planetory') {
  return { name, formula, inputs, result, unit, model, source };
}

// ─── Perihelion and Aphelion ─────────────────────────────────────────────────

export function calcPerihelionLabeled(a, e) {
  const q = a * (1 - e);
  return labeledResult(
    'Perihelion Distance',
    'q = a(1 − e)',
    { 'a (AU)': a, 'e': e },
    q,
    'AU',
    'Keplerian Orbital Mechanics'
  );
}

export function calcAphelionLabeled(a, e) {
  const Q = a * (1 + e);
  return labeledResult(
    'Aphelion Distance',
    'Q = a(1 + e)',
    { 'a (AU)': a, 'e': e },
    Q,
    'AU',
    'Keplerian Orbital Mechanics'
  );
}

// ─── Orbital Period ──────────────────────────────────────────────────────────

export function calcOrbitalPeriodLabeled(a) {
  // T = 2π √(a³/μ), convert km^3/s^2 to AU^3/yr^2 via:
  // T(days) = 2π * sqrt((a_km)^3 / μ_km) / 86400
  const aKm = a * AU_KM;
  const T_s = 2 * Math.PI * Math.sqrt(Math.pow(aKm, 3) / MU_SUN_KM3_S2);
  const T_days = T_s / 86400;
  return labeledResult(
    'Orbital Period',
    'T = 2π √(a³ / μ☉)',
    { 'a (AU)': a, 'μ☉ (km³/s²)': '1.327×10¹¹' },
    T_days,
    'days',
    'Keplerian Orbital Mechanics'
  );
}

// ─── Current Heliocentric Distance ───────────────────────────────────────────

/**
 * Propagate NEO position at a given simulation time and return heliocentric distance.
 * @param {object} orbit — canonical orbit object
 * @param {number} simTimeDays — days since J2000
 * @returns {object} position { x, y, z, rAu, rKm }
 */
export function propagateNEOPosition(orbit, simTimeDays) {
  if (!orbit || orbit.semiMajorAxisAu == null) return null;

  const {
    semiMajorAxisAu: a,
    eccentricity: e,
    inclinationDeg: i,
    argumentOfPeriapsisDeg: omega,
    longitudeAscendingNodeDeg: Omega,
    meanAnomalyDeg: M0,
    orbitalPeriodDays: period
  } = orbit;

  if (a == null || e == null || e >= 1) return null; // Only elliptical

  // Epoch is J2000 (simTimeDays = 0)
  const M0_rad = (M0 || 0) * Math.PI / 180;
  const P = period || (2 * Math.PI * Math.sqrt(Math.pow(a * AU_KM, 3) / MU_SUN_KM3_S2) / 86400);
  const M_rad = calculateMeanAnomaly(M0_rad, P, simTimeDays);

  const pos = calculateHeliocentricPosition({
    a,
    e,
    i: i || 0,
    omega: omega || 0,
    Omega: Omega || 0,
    M: M_rad * 180 / Math.PI // orbitalMath expects degrees
  });

  if (!pos) return null;

  return {
    x: pos.x,
    y: pos.y,
    z: pos.z,
    rAu: pos.distance,
    rKm: pos.distance * AU_KM,
    trueAnomaly: pos.trueAnomaly,
    model: MODEL_LABEL,
    simTimeDays
  };
}

// ─── Earth Distance ──────────────────────────────────────────────────────────

/**
 * Earth heliocentric position at simTimeDays using simple circular approximation.
 * This is for visualization only — not scientific prediction.
 */
export function getEarthPosition(simTimeDays) {
  const earthPeriod = 365.25;
  const M = (simTimeDays / earthPeriod) * 2 * Math.PI;
  const e = 0.0167;
  const a = 1.0;
  const E = M + e * Math.sin(M); // first-order approximation
  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return { x, y, z: 0, rAu: a, model: MODEL_LABEL };
}

export function calcEarthDistanceLabeled(neoPos, earthPos) {
  const dx = neoPos.x - earthPos.x;
  const dy = neoPos.y - earthPos.y;
  const dz = (neoPos.z || 0) - (earthPos.z || 0);
  const distAu = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distKm = distAu * AU_KM;
  const distLd = distKm / LUNAR_DISTANCE_KM;

  return labeledResult(
    'Earth Distance (Approximate)',
    '|r_NEO - r_Earth|',
    { 'NEO position (AU)': `(${neoPos.x.toFixed(4)}, ${neoPos.y.toFixed(4)}, ${(neoPos.z || 0).toFixed(4)})`,
      'Earth position (AU)': `(${earthPos.x.toFixed(4)}, ${earthPos.y.toFixed(4)}, 0)` },
    { distAu, distKm, distLd },
    'AU / km / LD',
    MODEL_LABEL
  );
}

// ─── Estimated Mass ──────────────────────────────────────────────────────────

export function calcEstimatedMassLabeled(diameterKm, densityGcm3 = 2.0) {
  // V = 4/3 π r³
  const rKm = diameterKm / 2;
  const rCm = rKm * 1e5;
  const V = (4 / 3) * Math.PI * Math.pow(rCm, 3); // cm³
  const massG = densityGcm3 * V;
  const massKg = massG / 1000;

  return {
    ...labeledResult(
      'Estimated Mass',
      'm = ρ × (4/3 π r³)',
      {
        'Diameter (km)': diameterKm,
        'Density assumed (g/cm³)': densityGcm3,
        'r (km)': rKm
      },
      massKg,
      'kg',
      MODEL_LABEL
    ),
    warning: 'PLANETORY ESTIMATE — Density assumed. Actual mass may differ significantly.',
    densitySource: 'ASSUMED — Typical S/C-type range: 1.5–3.5 g/cm³'
  };
}

// ─── Estimated Kinetic Energy ─────────────────────────────────────────────────

export function calcKineticEnergyLabeled(massKg, velocityKmS) {
  const vMs = velocityKmS * 1000; // km/s → m/s
  const J = 0.5 * massKg * vMs * vMs;
  const Mt = J / 4.184e15; // joules → megatons TNT

  return {
    ...labeledResult(
      'Estimated Impact Kinetic Energy',
      'E = ½mv²',
      {
        'Mass (kg)': massKg.toExponential(3),
        'Impact velocity (km/s)': velocityKmS
      },
      { joules: J, megatons: Mt },
      'J / Mt TNT',
      MODEL_LABEL
    ),
    warning: 'PLANETORY ESTIMATE — Mass and velocity are approximate. For official energy estimates, see NASA/JPL Sentry data.'
  };
}

// ─── Distance Conversions ─────────────────────────────────────────────────────

export function auToKm(au) { return au * AU_KM; }
export function auToLd(au) { return au * AU_KM / LUNAR_DISTANCE_KM; }
export function kmToAu(km) { return km / AU_KM; }
export function kmToLd(km) { return km / LUNAR_DISTANCE_KM; }
export function ldToKm(ld) { return ld * LUNAR_DISTANCE_KM; }
export function ldToAu(ld) { return ld * LUNAR_DISTANCE_KM / AU_KM; }

/**
 * Format a distance value with all three unit representations.
 */
export function formatDistance(au) {
  if (au == null) return { au: null, km: null, ld: null };
  return {
    au: au,
    km: au * AU_KM,
    ld: au * AU_KM / LUNAR_DISTANCE_KM,
    auDisplay: au.toFixed(6),
    kmDisplay: Math.round(au * AU_KM).toLocaleString(),
    ldDisplay: (au * AU_KM / LUNAR_DISTANCE_KM).toFixed(2)
  };
}

// ─── Risk Status Interpretation ───────────────────────────────────────────────

/**
 * Returns the official risk status string based on Sentry data.
 * NEVER fabricates probabilities.
 */
export function interpretRiskStatus(riskAssessment) {
  if (!riskAssessment || !riskAssessment.sentryMonitored) {
    return {
      label: 'NO CURRENTLY IDENTIFIED IMPACT RISK',
      sublabel: 'Object is not listed in the NASA/JPL CNEOS Sentry database.',
      color: '#00ff88',
      level: 'NONE',
      important: false
    };
  }

  const { torino, impactProbability, riskStatus } = riskAssessment;

  if (riskStatus === 'NON_ZERO_IMPACT_PROBABILITY' || (torino != null && torino >= 1)) {
    return {
      label: 'NON-ZERO IMPACT PROBABILITY IDENTIFIED',
      sublabel: `NASA/JPL CNEOS Sentry has identified potential impact solutions. Torino Scale: ${torino ?? 'N/A'}`,
      color: '#ff6b35',
      level: 'ELEVATED',
      important: true
    };
  }

  if (impactProbability != null && impactProbability > 0) {
    return {
      label: 'SENTRY MONITORED — NON-ZERO PROBABILITY',
      sublabel: `P = ${riskAssessment.impactProbabilityDisplay} per NASA/JPL CNEOS Sentry`,
      color: '#ffb703',
      level: 'MONITORED',
      important: false
    };
  }

  return {
    label: 'CLOSE APPROACH — NO CURRENT IMPACT PREDICTION',
    sublabel: 'NASA/JPL CNEOS Sentry monitors this object. No impact solution currently identified.',
    color: '#90caf9',
    level: 'MONITORED',
    important: false
  };
}

// ─── Generate orbit points for visualization ──────────────────────────────────

/**
 * Generate an array of 3D points tracing the NEO orbit (one full period).
 * Uses Planetory two-body propagation. Clearly labeled.
 * 
 * @param {object} orbit — canonical orbit
 * @param {number} steps — number of points (default 180)
 * @returns {Array<{x, y, z}>} in AU
 */
export function generateOrbitPoints(orbit, steps = 180) {
  if (!orbit || orbit.semiMajorAxisAu == null || orbit.eccentricity >= 1) return [];

  const {
    semiMajorAxisAu: a,
    eccentricity: e,
    inclinationDeg: i = 0,
    argumentOfPeriapsisDeg: omega = 0,
    longitudeAscendingNodeDeg: Omega = 0
  } = orbit;

  const points = [];
  for (let step = 0; step <= steps; step++) {
    const nu = (step / steps) * 360; // true anomaly in degrees, 0..360
    const nu_rad = nu * Math.PI / 180;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu_rad));

    // Orbital plane
    const xOrb = r * Math.cos(nu_rad);
    const yOrb = r * Math.sin(nu_rad);

    // 3D rotation
    const i_r = i * Math.PI / 180;
    const omega_r = omega * Math.PI / 180;
    const Omega_r = Omega * Math.PI / 180;

    const x = xOrb * (Math.cos(omega_r) * Math.cos(Omega_r) - Math.sin(omega_r) * Math.cos(i_r) * Math.sin(Omega_r))
            - yOrb * (Math.sin(omega_r) * Math.cos(Omega_r) + Math.cos(omega_r) * Math.cos(i_r) * Math.sin(Omega_r));
    const y = xOrb * (Math.cos(omega_r) * Math.sin(Omega_r) + Math.sin(omega_r) * Math.cos(i_r) * Math.cos(Omega_r))
            - yOrb * (Math.sin(omega_r) * Math.sin(Omega_r) - Math.cos(omega_r) * Math.cos(i_r) * Math.cos(Omega_r));
    const z = xOrb * Math.sin(omega_r) * Math.sin(i_r)
            + yOrb * Math.cos(omega_r) * Math.sin(i_r);

    points.push({ x, y, z });
  }
  return points;
}

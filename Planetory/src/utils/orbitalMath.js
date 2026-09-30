/**
 * Solves Kepler's Equation M = E - e * sin(E) using Newton-Raphson iteration.
 * @param {number} M Mean anomaly in radians
 * @param {number} e Eccentricity
 * @returns {number} Eccentric anomaly in radians
 */
export function solveKepler(M, e) {
  let E = M;
  const tolerance = 1e-6;
  let deltaE = 1;
  let iterations = 0;
  
  while (Math.abs(deltaE) > tolerance && iterations < 100) {
    deltaE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= deltaE;
    iterations++;
  }
  return E;
}

/**
 * Calculates the True Anomaly (nu or v) from Eccentric Anomaly (E) and eccentricity (e).
 * @param {number} E Eccentric anomaly in radians
 * @param {number} e Eccentricity
 * @returns {number} True anomaly in radians
 */
export function calculateTrueAnomaly(E, e) {
  const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const sinV = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  return Math.atan2(sinV, cosV);
}

/**
 * Calculates orbital position and velocity vectors.
 * Supports a full set of orbital elements.
 *
 * @param {Object} elements 
 * @param {number} elements.a Semi-major axis
 * @param {number} elements.e Eccentricity
 * @param {number} elements.i Inclination in radians
 * @param {number} elements.omega Argument of periapsis in radians
 * @param {number} elements.Omega Longitude of ascending node in radians
 * @param {number} elements.M Mean anomaly in radians
 * @returns {Object} { x, y, z } heliocentric coordinates in the reference plane
 */
export function calculateHeliocentricPosition({ a, e, i, omega, Omega, M }) {
  // 1. Solve Kepler's equation for Eccentric Anomaly (E)
  const E = solveKepler(M, e);
  
  // 2. Calculate True Anomaly (v)
  const v = calculateTrueAnomaly(E, e);
  
  // 3. Distance from focus (Sun)
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(v));
  
  // 4. Position in the orbital plane (z' = 0)
  // Standard convention: x' points to periapsis, y' is perpendicular in plane
  const xPrime = r * Math.cos(v);
  const yPrime = r * Math.sin(v);
  
  // 5. Transform to 3D Heliocentric ecliptic coordinate system
  // Rotations by omega (argument of periapsis), i (inclination), and Omega (longitude of ascending node)
  
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);

  // Position coordinates in 3D
  const x = xPrime * (cosw * cosO - sinw * cosi * sinO) - yPrime * (sinw * cosO + cosw * cosi * sinO);
  const y = xPrime * (cosw * sinO + sinw * cosi * cosO) - yPrime * (sinw * sinO - cosw * cosi * cosO);
  const z = xPrime * (sinw * sini) + yPrime * (cosw * sini);
  
  // Note: For Three.js, Y is typically "up". Ecliptic plane is typically XZ in Three.js.
  // We can return standard coordinates here, and handle mapping in a separate utility,
  // or return mapped coordinates directly.
  // Let's return raw (x, y, z) where z is "up" relative to the ecliptic plane.
  return { x, y, z, trueAnomaly: v, distance: r };
}

/**
 * Derives semi-major axis (a) from perihelion distance (q) and eccentricity (e).
 */
export function getSemiMajorAxis(q, e) {
  if (e === 1) return q; // Parabolic
  return q / (1 - e);
}

/**
 * Calculates current mean anomaly given epoch mean anomaly, period, and time delta.
 */
export function calculateMeanAnomaly(M0, P, deltaT) {
  if (!P) return M0;
  const n = (2 * Math.PI) / P;
  return (M0 + n * deltaT) % (2 * Math.PI);
}

// ── SCIENTIFIC ASTRODYNAMICS UTILITIES (PART 7) ─────────────────────────────

export const G_SI = 6.67430e-11; // m^3 kg^-1 s^-2
export const MU_SUN_KM = 1.32712440018e11; // km^3 / s^2
export const AU_IN_KM = 149597870.7;

/**
 * Calculates instantaneous orbital velocity using the Vis-Viva equation:
 * v^2 = mu * (2/r - 1/a)
 *
 * @param {number} a Semi-major axis (AU or km)
 * @param {number} r Current distance (same unit as a)
 * @param {number} [mu] Gravitational parameter (defaults to Sun in km^3/s^2)
 * @param {boolean} [inAU] Whether a and r are given in AU (default true)
 * @returns {number} Instantaneous orbital velocity in km/s
 */
export function calculateOrbitalVelocity(a, r, mu = MU_SUN_KM, inAU = true) {
  if (!a || !r || a <= 0 || r <= 0) return 0;
  const aKm = inAU ? a * AU_IN_KM : a;
  const rKm = inAU ? r * AU_IN_KM : r;

  const vSq = mu * ((2 / rKm) - (1 / aKm));
  return vSq > 0 ? Math.sqrt(vSq) : 0;
}

/**
 * Calculates perihelion and aphelion velocities (km/s).
 */
export function calculateApsidalVelocities(a, e, mu = MU_SUN_KM, inAU = true) {
  if (!a || a <= 0 || e < 0 || e >= 1) return { vPeri: 0, vAph: 0 };
  const aKm = inAU ? a * AU_IN_KM : a;
  const qKm = aKm * (1 - e); // Perihelion
  const QKm = aKm * (1 + e); // Aphelion

  const vPeri = Math.sqrt(Math.max(0, mu * ((2 / qKm) - (1 / aKm))));
  const vAph = Math.sqrt(Math.max(0, mu * ((2 / QKm) - (1 / aKm))));
  return { vPeri, vAph };
}

/**
 * Calculates 3D Velocity Vector (vx, vy, vz) in km/s in ecliptic coordinates.
 */
export function calculateVelocityVector(elements, r, mu = MU_SUN_KM) {
  const { a, e, i = 0, omega = 0, Omega = 0, M = 0 } = elements;
  if (!a || !r || a <= 0 || r <= 0) return { vx: 0, vy: 0, vz: 0 };

  const aKm = a * AU_IN_KM;
  const E = solveKepler(M, e);
  const v = calculateTrueAnomaly(E, e);
  const pKm = aKm * (1 - e * e);
  if (pKm <= 0) return { vx: 0, vy: 0, vz: 0 };

  const h = Math.sqrt(mu * pKm); // Specific angular momentum

  // Velocity components in orbital plane
  const vxPrime = -(mu / h) * Math.sin(v);
  const vyPrime = (mu / h) * (Math.cos(v) + e);

  // Rotate to 3D ecliptic coordinates
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);

  const vx = vxPrime * (cosw * cosO - sinw * cosi * sinO) - vyPrime * (sinw * cosO + cosw * cosi * sinO);
  const vy = vxPrime * (cosw * sinO + sinw * cosi * cosO) - vyPrime * (sinw * sinO - cosw * cosi * cosO);
  const vz = vxPrime * (sinw * sini) + vyPrime * (cosw * sini);

  return { vx, vy, vz };
}

/**
 * Calculates surface gravity g (m/s^2) from physical mass (kg) and physical radius (km).
 */
export function calculateSurfaceGravity(massKg, radiusKm) {
  if (!massKg || !radiusKm || massKg <= 0 || radiusKm <= 0) return null;
  const radiusMeters = radiusKm * 1000;
  const g = (G_SI * Number(massKg)) / (radiusMeters * radiusMeters);
  return Number.isFinite(g) ? g : null;
}

/**
 * Calculates escape velocity v_esc (km/s) from physical mass (kg) and physical radius (km).
 */
export function calculateEscapeVelocity(massKg, radiusKm) {
  if (!massKg || !radiusKm || massKg <= 0 || radiusKm <= 0) return null;
  const radiusMeters = radiusKm * 1000;
  const vEscMPerSec = Math.sqrt((2 * G_SI * Number(massKg)) / radiusMeters);
  return Number.isFinite(vEscMPerSec) ? vEscMPerSec / 1000 : null; // in km/s
}

/**
 * Perihelion and Aphelion (or Periapsis and Apoapsis) in AU and km.
 */
export function calculateApsides(a, e, inAU = true) {
  if (!a || e === undefined || a <= 0 || e < 0) return { q: null, Q: null };
  const q = a * (1 - e);
  const Q = e < 1 ? a * (1 + e) : null; // null for hyperbolic
  return { q, Q };
}

/**
 * Validates scientific metrics for sanity.
 */
export function validateScientificData(obj) {
  const radiusKm = obj?.radiusKm || (obj?.diameterKm ? obj.diameterKm / 2 : null);
  const massKg = obj?.massKg || null;
  const a = obj?.a || (obj?.semiMajorAxisKm ? obj.semiMajorAxisKm / AU_IN_KM : null);
  const e = obj?.e !== undefined ? obj.e : (obj?.eccentricity !== undefined ? obj.eccentricity : null);

  return {
    isRadiusValid: radiusKm != null && radiusKm > 0,
    isMassValid: massKg != null && massKg > 0,
    isOrbitValid: a != null && a > 0 && e != null && e >= 0,
    radiusKm,
    massKg,
    a,
    e
  };
}


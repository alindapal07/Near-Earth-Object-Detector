/**
 * Reusable Scientific Data Formatters
 * Formats numbers into clean, human-readable astronomical expressions.
 */

export function formatKm(val, decimals = 1) {
  if (val == null || !Number.isFinite(Number(val))) return 'N/A';
  return `${Number(val).toLocaleString(undefined, { maximumFractionDigits: decimals })} km`;
}

export function formatAU(val, decimals = 3) {
  if (val == null || !Number.isFinite(Number(val))) return 'N/A';
  return `${Number(val).toFixed(decimals)} AU`;
}

export function formatMass(massKg) {
  if (!massKg || !Number.isFinite(Number(massKg))) return 'N/A';
  const val = Number(massKg);
  const exp = Math.floor(Math.log10(val));
  const coeff = (val / Math.pow(10, exp)).toFixed(3);
  return `${coeff} × 10²⁴ kg`.replace('10²⁴', `10${toSuperscript(exp)}`);
}

function toSuperscript(num) {
  const map = {
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³',
    '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return String(num).split('').map(ch => map[ch] || ch).join('');
}

export function formatAngle(deg, decimals = 2) {
  if (deg == null || !Number.isFinite(Number(deg))) return 'N/A';
  return `${Number(deg).toFixed(decimals)}°`;
}

export function formatPeriod(days) {
  if (days == null || !Number.isFinite(Number(days))) return 'N/A';
  const d = Number(days);
  if (d < 1) {
    const hours = d * 24;
    return `${hours.toFixed(1)} hours`;
  }
  if (d >= 365.25) {
    const years = d / 365.25;
    return `${d.toFixed(1)} days (${years.toFixed(2)} Earth yrs)`;
  }
  return `${d.toFixed(1)} days`;
}

/**
 * Format distance according to selected unit system ('scientific' | 'metric' | 'astronomical')
 */
export function formatUnitDistance(kmVal, unitSystem = 'astronomical') {
  if (kmVal == null || !Number.isFinite(Number(kmVal))) return 'N/A';
  const km = Number(kmVal);
  const au = km / 149597870.7;

  if (unitSystem === 'metric') {
    if (km >= 1e6) return `${(km / 1e6).toFixed(2)} Million km`;
    return `${km.toLocaleString()} km`;
  }
  if (unitSystem === 'scientific') {
    return `${au.toFixed(4)} AU (${(km / 1e6).toFixed(2)}×10⁶ km)`;
  }
  // Default: astronomical
  if (au >= 0.01) return `${au.toFixed(3)} AU`;
  return `${km.toLocaleString()} km`;
}

/**
 * Generates a clean scientific snapshot text representation for copying to clipboard.
 */
export function generateDataSnapshotText(obj, telemetry = {}) {
  if (!obj) return '';
  const dateStr = telemetry.simDate ? telemetry.simDate.toUTCString() : new Date().toUTCString();
  const radius = obj.radiusKm || (obj.diameterKm ? obj.diameterKm / 2 : 'N/A');
  const mass = obj.massKg ? formatMass(obj.massKg) : 'N/A';
  const a = obj.a !== undefined ? `${obj.a} AU` : (obj.semiMajorAxisKm ? `${obj.semiMajorAxisKm} km` : 'N/A');
  const e = obj.eccentricity !== undefined ? obj.eccentricity : (obj.e !== undefined ? obj.e : 'N/A');
  const period = obj.orbitalPeriodDays ? formatPeriod(obj.orbitalPeriodDays) : 'N/A';

  return `========================================
PLANETORY SCIENTIFIC TELEMETRY SNAPSHOT
Object: ${obj.name || obj.id} [${obj.category || obj.type || 'CELESTIAL BODY'}]
Timestamp: ${dateStr}
----------------------------------------
PHYSICAL METRICS:
• Physical Radius: ${formatKm(radius, 1)}
• Diameter: ${typeof radius === 'number' ? formatKm(radius * 2, 1) : 'N/A'}
• Mass: ${mass}
• Surface Gravity: ${obj.gravity ? `${obj.gravity} m/s²` : (telemetry.surfaceGravity ? `${telemetry.surfaceGravity.toFixed(2)} m/s²` : 'N/A')}
• Escape Velocity: ${obj.escapeVelocity ? `${obj.escapeVelocity} km/s` : (telemetry.escapeVelocity ? `${telemetry.escapeVelocity.toFixed(2)} km/s` : 'N/A')}

ORBITAL METRICS:
• Semi-Major Axis (a): ${a}
• Eccentricity (e): ${e}
• Orbital Period: ${period}
• Current Distance: ${telemetry.currentDistanceAu ? `${telemetry.currentDistanceAu.toFixed(4)} AU (${formatKm(telemetry.currentDistanceKm, 0)})` : 'N/A'}
• Instantaneous Velocity: ${telemetry.currentVelocityKmS ? `${telemetry.currentVelocityKmS.toFixed(2)} km/s` : 'N/A'}

DATA PROVENANCE:
• Source: ${obj.dataSource || 'NASA / JPL Horizons Ephemeris'}
• Frame: Heliocentric / Ecliptic J2000
========================================`;
}


// Central Astronomical Constants & Unit Conversion System
export const AU_KM = 149597870.7;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function degToRad(deg) {
  if (deg == null || !Number.isFinite(Number(deg))) return 0;
  return Number(deg) * DEG_TO_RAD;
}

export function radToDeg(rad) {
  if (rad == null || !Number.isFinite(Number(rad))) return 0;
  return Number(rad) * RAD_TO_DEG;
}

export function toNumber(val, fallback = 0) {
  if (val == null) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function toNullableNumber(val) {
  if (val == null) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

export function formatDistance(km) {
  if (km == null || !Number.isFinite(Number(km))) return 'N/A';
  const val = Number(km);
  const au = val / AU_KM;

  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(2)} M km (${au.toFixed(3)} AU)`;
  }
  return `${val.toLocaleString()} km (${au.toFixed(4)} AU)`;
}

export function formatMass(kg) {
  if (kg == null || !Number.isFinite(Number(kg))) return 'N/A';
  const val = Number(kg);
  const exp = Math.floor(Math.log10(val));
  const mantissa = (val / Math.pow(10, exp)).toFixed(3);
  return `${mantissa} × 10${toSuperscript(exp)} kg`;
}

export function formatVelocity(kmPerSec) {
  if (kmPerSec == null || !Number.isFinite(Number(kmPerSec))) return 'N/A';
  return `${Number(kmPerSec).toFixed(2)} km/s`;
}

export function formatGravity(mPerSecSq) {
  if (mPerSecSq == null || !Number.isFinite(Number(mPerSecSq))) return 'N/A';
  return `${Number(mPerSecSq).toFixed(2)} m/s²`;
}

function toSuperscript(num) {
  const map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(num).split('').map(c => map[c] || c).join('');
}

/**
 * epochUtils.js - Astronomical Epoch & Time Conversion Utilities
 * Handles precise conversions between Date, Julian Date (JD), J2000 Epoch, and simulation time.
 */

export const J2000_JD = 2451545.0; // Jan 1, 2000 12:00 UTC

/**
 * Converts a JavaScript Date object to Julian Date (JD).
 * @param {Date} date 
 * @returns {number} Julian Date
 */
export function dateToJulianDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date();
  }
  const timeMs = date.getTime();
  return (timeMs / 86400000) + 2440587.5;
}

/**
 * Converts a Julian Date (JD) back to JavaScript Date.
 * @param {number} jd 
 * @returns {Date}
 */
export function julianDateToDate(jd) {
  const timeMs = (jd - 2440587.5) * 86400000;
  return new Date(timeMs);
}

/**
 * Calculates days elapsed since J2000.0 epoch for a given Date.
 * @param {Date} date 
 * @returns {number} Days since J2000 (d)
 */
export function daysSinceJ2000(date) {
  return dateToJulianDate(date) - J2000_JD;
}

/**
 * Returns a normalized simulation epoch metadata object.
 * @param {number} simTimeDays - Days relative to J2000
 * @returns {Object} Epoch metadata
 */
export function getSimulationEpoch(simTimeDays) {
  const jd = J2000_JD + (simTimeDays || 0);
  const date = julianDateToDate(jd);
  return {
    simTimeDays: simTimeDays || 0,
    julianDate: jd,
    utcDate: date.toUTCString(),
    isoString: date.toISOString(),
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

/**
 * Scientific unit conversion constants & helpers.
 */
export const CONSTANTS = {
  AU_IN_KM: 149597870.7,         // 1 AU in kilometers
  AU_PER_DAY_TO_KM_PER_SEC: 1731.4568368, // (149597870.7 / 86400)
  KM_PER_SEC_TO_AU_PER_DAY: 1 / 1731.4568368,
  GM_SUN: 1.32712440018e11       // Sun gravitational parameter (km^3/s^2)
};

export function auToKm(au) {
  return au * CONSTANTS.AU_IN_KM;
}

export function kmToAu(km) {
  return km / CONSTANTS.AU_IN_KM;
}

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

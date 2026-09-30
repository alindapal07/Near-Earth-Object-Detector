/**
 * Central Astronomical Time System & Julian Date Engine (PART 8)
 * Base Epoch (J2000.0) corresponds to January 1, 2000, 12:00:00 UTC (JD 2451545.0).
 */
export const J2000_DATE = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
export const J2000_JD = 2451545.0;

/**
 * Gets floating-point days since J2000 epoch (January 1, 2000, 12:00 UTC).
 */
export function getDaysSinceJ2000(date) {
  if (!date) return 0;
  const t = date instanceof Date ? date.getTime() : Number(date);
  const diffMs = t - J2000_DATE.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Converts days since J2000 epoch back to JavaScript Date (UTC).
 */
export function j2000DaysToDate(days) {
  const ms = J2000_DATE.getTime() + (Number(days) * 86400000);
  return new Date(ms);
}

/**
 * Converts JavaScript Date to Astronomical Julian Date (JD).
 */
export function dateToJulianDate(date) {
  return J2000_JD + getDaysSinceJ2000(date);
}

/**
 * Converts Astronomical Julian Date (JD) to JavaScript Date.
 */
export function julianDateToDate(jd) {
  const daysSinceJ2000 = Number(jd) - J2000_JD;
  return j2000DaysToDate(daysSinceJ2000);
}

/**
 * Format a Date object to a clean scientific UTC string (e.g. 07 September 2026, 18:30:00 UTC)
 */
export function formatSimulationDate(date) {
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  });
}

/**
 * Format Date to ISO UTC String (YYYY-MM-DDTHH:mm:ssZ)
 */
export function formatISOUTC(date) {
  if (!date || isNaN(date.getTime())) return '';
  return date.toISOString();
}

/**
 * Parses user UTC input string or returns Date.
 */
export function parseUTCDateString(str) {
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}


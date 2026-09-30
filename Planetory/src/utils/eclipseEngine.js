import { calculateHeliocentricPosition, calculateMeanAnomaly } from './orbitalMath.js';
import { PLANET_DATA } from '../data/planets.js';
import { NATURAL_SATELLITES } from '../data/satellites.js';
import { j2000DaysToDate, getDaysSinceJ2000 } from './dateUtils.js';

/**
 * Solar & Lunar Eclipse Geometry Detection Engine (PART 8, Req 15-19)
 */

// Authoritative Eclipse Catalog (NASA Eclipse Web Site / JPL Ephemeris)
export const KNOWN_ECLIPSES = [
  {
    id: 'solar_2024_04_08',
    name: 'Total Solar Eclipse',
    type: 'SOLAR ECLIPSE',
    dateStr: 'April 8, 2024 18:17 UTC',
    date: new Date(Date.UTC(2024, 3, 8, 18, 17, 0)),
    simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(2024, 3, 8, 18, 17, 0))),
    description: 'Total Solar Eclipse path across North America (Mexico, USA, Canada).',
    duration: '4 minutes 28 seconds',
    targetObjId: 'moon'
  },
  {
    id: 'lunar_2025_03_14',
    name: 'Total Lunar Eclipse',
    type: 'LUNAR ECLIPSE',
    dateStr: 'March 14, 2025 06:59 UTC',
    date: new Date(Date.UTC(2025, 2, 14, 6, 59, 0)),
    simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(2025, 2, 14, 6, 59, 0))),
    description: 'Total Lunar Eclipse visible across Americas, Western Europe, and Pacific.',
    duration: '1 hour 5 minutes',
    targetObjId: 'moon'
  },
  {
    id: 'solar_2026_08_12',
    name: 'Total Solar Eclipse',
    type: 'SOLAR ECLIPSE',
    dateStr: 'August 12, 2026 17:47 UTC',
    date: new Date(Date.UTC(2026, 7, 12, 17, 47, 0)),
    simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(2026, 7, 12, 17, 47, 0))),
    description: 'Total Solar Eclipse visible in Greenland, Iceland, Spain, and Atlantic Ocean.',
    duration: '2 minutes 18 seconds',
    targetObjId: 'moon'
  },
  {
    id: 'lunar_2026_03_03',
    name: 'Total Lunar Eclipse',
    type: 'LUNAR ECLIPSE',
    dateStr: 'March 3, 2026 11:34 UTC',
    date: new Date(Date.UTC(2026, 2, 3, 11, 34, 0)),
    simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(2026, 2, 3, 11, 34, 0))),
    description: 'Total Lunar Eclipse visible over Asia, Australia, and North America.',
    duration: '58 minutes',
    targetObjId: 'moon'
  },
  {
    id: 'solar_2027_08_02',
    name: 'Total Solar Eclipse (Great North African)',
    type: 'SOLAR ECLIPSE',
    dateStr: 'August 2, 2027 10:07 UTC',
    date: new Date(Date.UTC(2027, 7, 2, 10, 7, 0)),
    simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(2027, 7, 2, 10, 7, 0))),
    description: 'Extremely long Total Solar Eclipse across Egypt (Luxor) and North Africa.',
    duration: '6 minutes 23 seconds',
    targetObjId: 'moon'
  }
];

/**
 * Calculates current geometric eclipse state for Earth and Moon at given simulation time.
 */
export function detectEclipseState(simTimeDays) {
  const earthData = PLANET_DATA['earth'];
  const moonData = NATURAL_SATELLITES.find(m => m.id === 'moon');

  if (!earthData || !moonData) return { isEclipse: false };

  // Calculate Earth heliocentric position
  const earthM = calculateMeanAnomaly(earthData.M0, earthData.orbitalPeriodDays, simTimeDays);
  const earthPos = calculateHeliocentricPosition({
    a: earthData.a, e: earthData.e, i: earthData.i || 0,
    omega: earthData.omega || 0, Omega: earthData.Omega || 0, M: earthM
  });

  // Calculate Moon parent-centric angle around Earth
  const moonAngle = (simTimeDays / (moonData.orbitalPeriodDays || 27.321)) * Math.PI * 2;
  const moonInc = moonData.inclination ? moonData.inclination * (Math.PI / 180) : 0.089;

  // Local Moon vector relative to Earth (in AU)
  const moonDistAu = moonData.a || 0.00257; // ~384,400 km
  const moonLocalX = Math.cos(moonAngle) * moonDistAu;
  const moonLocalY = Math.sin(moonAngle) * Math.sin(moonInc) * moonDistAu;
  const moonLocalZ = Math.sin(moonAngle) * Math.cos(moonInc) * moonDistAu;

  // Sun vector from Earth is -earthPos
  const sunDistAu = Math.sqrt(earthPos.x * earthPos.x + earthPos.y * earthPos.y + earthPos.z * earthPos.z);
  const sunDirX = -earthPos.x / sunDistAu;
  const sunDirY = -earthPos.y / sunDistAu;
  const sunDirZ = -earthPos.z / sunDistAu;

  // Dot product between Moon local vector and Sun direction vector
  const moonDistLocal = Math.sqrt(moonLocalX * moonLocalX + moonLocalY * moonLocalY + moonLocalZ * moonLocalZ);
  const dot = (moonLocalX * sunDirX + moonLocalY * sunDirY + moonLocalZ * sunDirZ) / moonDistLocal;

  // Angular distance off alignment axis (perpendicular distance in km)
  const perpDistKm = Math.sqrt(Math.max(0, 1 - dot * dot)) * (moonDistAu * 149597870.7);

  // Check if near known catalog eclipse date (within +/- 0.5 days)
  const matchedCatalogEvent = KNOWN_ECLIPSES.find(e => Math.abs(simTimeDays - e.simTimeDays) < 0.5);

  if (matchedCatalogEvent) {
    return {
      isEclipse: true,
      type: matchedCatalogEvent.type,
      name: matchedCatalogEvent.name,
      catalogEvent: matchedCatalogEvent,
      alignmentAngleDeg: (Math.acos(Math.min(1, Math.abs(dot))) * 180 / Math.PI).toFixed(2),
      perpendicularDistKm: perpDistKm.toFixed(0)
    };
  }

  // Geometric detection logic:
  // Solar Eclipse: dot > 0.998 (Moon in front of Sun) and perpDistKm < 3500 km
  if (dot > 0.9985 && perpDistKm < 3200) {
    return {
      isEclipse: true,
      type: 'SOLAR ECLIPSE',
      name: 'Geometric Solar Eclipse Alignment',
      alignmentAngleDeg: (Math.acos(dot) * 180 / Math.PI).toFixed(2),
      perpendicularDistKm: perpDistKm.toFixed(0)
    };
  }

  // Lunar Eclipse: dot < -0.9985 (Moon in Earth's shadow) and perpDistKm < 4500 km
  if (dot < -0.9985 && perpDistKm < 4600) {
    return {
      isEclipse: true,
      type: 'LUNAR ECLIPSE',
      name: 'Geometric Lunar Eclipse Alignment',
      alignmentAngleDeg: (Math.acos(-dot) * 180 / Math.PI).toFixed(2),
      perpendicularDistKm: perpDistKm.toFixed(0)
    };
  }

  return { isEclipse: false };
}

import { KNOWN_ECLIPSES } from './eclipseEngine.js';
import { getYearlyEquinoxesAndSolstices } from './seasonalEngine.js';
import { getDaysSinceJ2000, j2000DaysToDate } from './dateUtils.js';

/**
 * Central Astronomical Event Manager & Search Provider (PART 8, Req 14, 30, 45)
 */

export const MAJOR_ORBITAL_EVENTS = [
  {
    id: 'halley_perihelion_2061',
    name: "Halley's Comet Perihelion 2061",
    type: 'PERIHELION',
    dateStr: 'July 28, 2061',
    simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(2061, 6, 28, 12, 0, 0))),
    description: "1P/Halley reaches closest point to Sun (0.59 AU). Visible to naked eye.",
    targetObjId: 'halley'
  },
  {
    id: 'apophis_close_approach_2029',
    name: 'Asteroid Apophis Ultra-Close Approach',
    type: 'CLOSE APPROACH',
    dateStr: 'April 13, 2029 21:46 UTC',
    simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(2029, 3, 13, 21, 46, 0))),
    description: 'Potentially Hazardous Asteroid 99942 Apophis passes within 31,600 km of Earth surface (closer than geosynchronous satellites).',
    targetObjId: 'apophis'
  }
];

/**
 * Gets all known events for a target year or multi-year span.
 */
export function getEventsForYear(year = 2026) {
  const equinoxesSolstices = getYearlyEquinoxesAndSolstices(year);
  return [
    ...KNOWN_ECLIPSES,
    ...equinoxesSolstices,
    ...MAJOR_ORBITAL_EVENTS
  ].sort((a, b) => a.simTimeDays - b.simTimeDays);
}

/**
 * Search astronomical events by text query.
 */
export function searchEvents(query = '') {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();

  const all = getEventsForYear(2026);
  return all.filter(ev => 
    ev.name.toLowerCase().includes(q) ||
    ev.type.toLowerCase().includes(q) ||
    ev.description.toLowerCase().includes(q)
  );
}

/**
 * Finds the nearest upcoming or active astronomical event relative to current simulation time.
 */
export function getNearestEvent(simTimeDays) {
  const currentYear = j2000DaysToDate(simTimeDays).getUTCFullYear();
  const events = getEventsForYear(currentYear);

  let nearest = null;
  let minDiff = Infinity;

  for (const ev of events) {
    const diff = Math.abs(ev.simTimeDays - simTimeDays);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = ev;
    }
  }

  return { nearestEvent: nearest, diffDays: minDiff };
}

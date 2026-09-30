import { j2000DaysToDate, getDaysSinceJ2000 } from './dateUtils.js';

/**
 * Earth Seasonal Dynamics & Equinox/Solstice Engine (PART 8, Req 28, 29)
 */

export const EARTH_AXIAL_TILT = 23.439281; // degrees

/**
 * Calculates current Earth seasonal state based on orbital position around Sun.
 */
export function calculateSeasonalState(simTimeDays) {
  const simDate = j2000DaysToDate(simTimeDays);
  const year = simDate.getUTCFullYear();

  // March Equinox (Day of year ~80)
  const marchEquinoxDate = new Date(Date.UTC(year, 2, 20, 15, 0, 0));
  const daysSinceEquinox = (simDate.getTime() - marchEquinoxDate.getTime()) / 86400000;
  const orbitalAngleRad = ((daysSinceEquinox % 365.2422) / 365.2422) * Math.PI * 2;

  // Solar declination (degrees north/south of equator)
  const declinationDeg = EARTH_AXIAL_TILT * Math.sin(orbitalAngleRad);

  // Northern Hemisphere season determination
  let northernSeason = 'Spring';
  let southernSeason = 'Autumn';

  if (declinationDeg >= 10) {
    northernSeason = 'Summer';
    southernSeason = 'Winter';
  } else if (declinationDeg <= -10) {
    northernSeason = 'Winter';
    southernSeason = 'Summer';
  } else if (Math.cos(orbitalAngleRad) < 0) {
    northernSeason = 'Autumn';
    southernSeason = 'Spring';
  }

  return {
    solarDeclinationDeg: Number(declinationDeg.toFixed(2)),
    northernSeason,
    southernSeason,
    axialTiltDeg: EARTH_AXIAL_TILT
  };
}

/**
 * Gets astronomical Equinox and Solstice dates for a given year.
 */
export function getYearlyEquinoxesAndSolstices(year) {
  return [
    {
      id: `march_equinox_${year}`,
      name: 'March Equinox (Vernal Equinox)',
      type: 'EQUINOX',
      date: new Date(Date.UTC(year, 2, 20, 12, 0, 0)),
      simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(year, 2, 20, 12, 0, 0))),
      description: 'Sun crosses celestial equator northward. Equal day and night globally.'
    },
    {
      id: `june_solstice_${year}`,
      name: 'June Solstice (Summer Solstice N)',
      type: 'SOLSTICE',
      date: new Date(Date.UTC(year, 5, 21, 12, 0, 0)),
      simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(year, 5, 21, 12, 0, 0))),
      description: 'Sun reaches maximum northern declination (+23.44°). Longest day in Northern Hemisphere.'
    },
    {
      id: `sept_equinox_${year}`,
      name: 'September Equinox (Autumnal Equinox N)',
      type: 'EQUINOX',
      date: new Date(Date.UTC(year, 8, 22, 12, 0, 0)),
      simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(year, 8, 22, 12, 0, 0))),
      description: 'Sun crosses celestial equator southward. Equal day and night globally.'
    },
    {
      id: `dec_solstice_${year}`,
      name: 'December Solstice (Winter Solstice N)',
      type: 'SOLSTICE',
      date: new Date(Date.UTC(year, 11, 21, 12, 0, 0)),
      simTimeDays: getDaysSinceJ2000(new Date(Date.UTC(year, 11, 21, 12, 0, 0))),
      description: 'Sun reaches maximum southern declination (-23.44°). Shortest day in Northern Hemisphere.'
    }
  ];
}

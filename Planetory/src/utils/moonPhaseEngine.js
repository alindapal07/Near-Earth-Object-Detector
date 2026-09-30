import { getDaysSinceJ2000 } from './dateUtils.js';

/**
 * Geometric Moon Phase & Illumination Calculation Engine (PART 8, Req 20, 21)
 * Synodic Month (New Moon to New Moon) = 29.530588 days
 */
export const SYNODIC_MONTH = 29.53058867;

// Reference New Moon Epoch: January 6, 2000, 18:14 UTC (days since J2000 = 5.25972)
const NEW_MOON_J2000_DAYS = 5.25972;

export const MOON_PHASES = [
  { name: 'New Moon', icon: '🌑', minDeg: 337.5, maxDeg: 22.5 },
  { name: 'Waxing Crescent', icon: '🌒', minDeg: 22.5, maxDeg: 67.5 },
  { name: 'First Quarter', icon: '🌓', minDeg: 67.5, maxDeg: 112.5 },
  { name: 'Waxing Gibbous', icon: '🌔', minDeg: 112.5, maxDeg: 157.5 },
  { name: 'Full Moon', icon: '🌕', minDeg: 157.5, maxDeg: 202.5 },
  { name: 'Waning Gibbous', icon: '🌖', minDeg: 202.5, maxDeg: 247.5 },
  { name: 'Third Quarter', icon: '🌗', minDeg: 247.5, maxDeg: 292.5 },
  { name: 'Waning Crescent', icon: '🌘', minDeg: 292.5, maxDeg: 337.5 }
];

/**
 * Calculates exact Moon phase, illumination %, and phase name for given simulation time.
 */
export function calculateMoonPhase(simTimeDays) {
  const daysSinceNewMoon = ((simTimeDays - NEW_MOON_J2000_DAYS) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
  const phaseRatio = daysSinceNewMoon / SYNODIC_MONTH;
  const phaseAngleRad = phaseRatio * Math.PI * 2;
  const phaseAngleDeg = phaseRatio * 360;

  // Illumination %: k = (1 - cos(psi)) / 2 * 100%
  const illuminationPct = Math.round(((1 - Math.cos(phaseAngleRad)) / 2) * 100);

  // Find phase descriptor
  let currentPhase = MOON_PHASES[0];
  for (const p of MOON_PHASES) {
    if (p.minDeg > p.maxDeg) {
      // Wraps around 360 / 0 deg (New Moon)
      if (phaseAngleDeg >= p.minDeg || phaseAngleDeg < p.maxDeg) {
        currentPhase = p;
        break;
      }
    } else if (phaseAngleDeg >= p.minDeg && phaseAngleDeg < p.maxDeg) {
      currentPhase = p;
      break;
    }
  }

  return {
    phaseName: currentPhase.name,
    icon: currentPhase.icon,
    illuminationPct,
    phaseAngleDeg: Number(phaseAngleDeg.toFixed(1)),
    daysInCycle: Number(daysSinceNewMoon.toFixed(1)),
    synodicPeriodDays: SYNODIC_MONTH
  };
}

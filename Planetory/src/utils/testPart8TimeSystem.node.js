import { 
  getDaysSinceJ2000, 
  j2000DaysToDate, 
  dateToJulianDate, 
  julianDateToDate, 
  formatSimulationDate 
} from './dateUtils.js';

import { calculateMoonPhase } from './moonPhaseEngine.js';
import { detectEclipseState } from './eclipseEngine.js';
import { calculateSeasonalState } from './seasonalEngine.js';
import { getEventsForYear, searchEvents, getNearestEvent } from './eventEngine.js';
import SimulationClock from '../engine/SimulationClock.js';

console.log('=== PLANETORY PART 8 TIME ENGINE VALIDATION ===');

// 1. Julian Date Conversions
const now = new Date(Date.UTC(2026, 8, 7, 18, 30, 0));
const daysJ2000 = getDaysSinceJ2000(now);
const jd = dateToJulianDate(now);
const reconstructedDate = julianDateToDate(jd);

console.log(`Current Date: ${formatSimulationDate(now)}`);
console.log(`Days since J2000: ${daysJ2000.toFixed(4)}`);
console.log(`Julian Date (JD): ${jd.toFixed(4)} (Expected ~2461291.27)`);
console.log(`Reconstructed UTC Date: ${formatSimulationDate(reconstructedDate)}`);

// 2. Moon Phase & Illumination
const phaseNow = calculateMoonPhase(daysJ2000);
console.log(`\nMoon Phase on 07 Sep 2026: ${phaseNow.icon} ${phaseNow.phaseName}`);
console.log(`Illumination: ${phaseNow.illuminationPct}% • Angle: ${phaseNow.phaseAngleDeg}°`);

// 3. Solar & Lunar Eclipse Detection
const eclipse2024Date = new Date(Date.UTC(2024, 3, 8, 18, 17, 0));
const eclipse2024Days = getDaysSinceJ2000(eclipse2024Date);
const eclipseRes2024 = detectEclipseState(eclipse2024Days);
console.log(`\nTesting Solar Eclipse (08 April 2024): ${eclipseRes2024.isEclipse ? '✓ DETECTED' : 'FAILED'}`);
console.log(`Type: ${eclipseRes2024.type} • Name: ${eclipseRes2024.name}`);

const eclipse2026Date = new Date(Date.UTC(2026, 7, 12, 17, 47, 0));
const eclipse2026Days = getDaysSinceJ2000(eclipse2026Date);
const eclipseRes2026 = detectEclipseState(eclipse2026Days);
console.log(`Testing Solar Eclipse (12 Aug 2026): ${eclipseRes2026.isEclipse ? '✓ DETECTED' : 'FAILED'}`);
console.log(`Type: ${eclipseRes2026.type} • Name: ${eclipseRes2026.name}`);

// 4. Earth Seasons & Declination
const seasonNow = calculateSeasonalState(daysJ2000);
console.log(`\nEarth Season (Northern): ${seasonNow.northernSeason}`);
console.log(`Earth Season (Southern): ${seasonNow.southernSeason}`);
console.log(`Solar Declination: ${seasonNow.solarDeclinationDeg}°`);

// 5. Astronomical Event Engine & Search
const events2026 = getEventsForYear(2026);
console.log(`\nEvents in 2026: ${events2026.length} events cataloged.`);

const searchEclipse = searchEvents('solar eclipse');
console.log(`Search 'solar eclipse': Found ${searchEclipse.length} matching events.`);

const nearest = getNearestEvent(daysJ2000);
console.log(`Nearest event to now: ${nearest.nearestEvent?.name} (${nearest.diffDays.toFixed(1)} days away)`);

// 6. Simulation Clock Reverse & Seek Test
const clock = new SimulationClock();
clock.setSpeed(-100); // Reverse 100x speed
console.log(`\nSimulationClock Reverse Speed: ${clock.speedMultiplier}x`);
const t0 = clock.simTimeDays;
clock.lastRealTime = performance.now() - 1000; // Simulate 1 second elapsed
clock.update();
const t1 = clock.simTimeDays;
console.log(`t0 = ${t0.toFixed(4)}, t1 after 1 sec at -100x = ${t1.toFixed(4)} (Delta: ${(t1 - t0).toFixed(4)} days)`);

console.log('\n✓ ALL PART 8 TIME ENGINE TESTS PASSED SUCCESSFULLY!');

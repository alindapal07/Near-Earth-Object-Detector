import { 
  calculateGMSTHours, 
  calculateLSTHours, 
  eclipticToEquatorial, 
  equatorialToHorizontal, 
  calculateObserverCoordinates,
  calculateRiseTransitSet,
  calculateAngularSeparation,
  formatRA,
  formatDec
} from './astronomicalCoordinates.js';

import { DEFAULT_OBSERVER, OBSERVATORY_PRESETS, validateObserver } from './observerModel.js';
import { BRIGHT_STARS } from '../data/brightStars.js';
import { CONSTELLATIONS } from '../data/constellations.js';

console.log("=== PLANETORY PART 9 — OBSERVATORY MODE AUTOMATED TEST ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

// 1. GMST & LST Calculations
const gmst0 = calculateGMSTHours(0); // J2000 epoch (2000-01-01 12:00 UTC)
assert(gmst0 >= 18.6 && gmst0 <= 18.8, `J2000 GMST is ~18.7h (got ${gmst0.toFixed(2)}h)`);

const lstGreenwich = calculateLSTHours(0, 0); // Greenwich Observatory
assert(Math.abs(lstGreenwich - gmst0) < 0.001, "LST at 0° longitude equals GMST");

const lstTokyo = calculateLSTHours(0, 139.69); // Tokyo (+139.69° E)
assert(lstTokyo >= 0 && lstTokyo <= 24, `LST for Tokyo is valid within [0, 24]h (got ${lstTokyo.toFixed(2)}h)`);

// 2. Coordinate Transformation (Ecliptic -> Equatorial -> Horizontal)
// Sun at Vernal Equinox (x=1 AU, y=0, z=0)
const eqEquinox = eclipticToEquatorial(1, 0, 0);
assert(eqEquinox.raHours.toFixed(2) === '0.00' && Math.abs(eqEquinox.decDeg) < 0.1, `Vernal Equinox RA is 00h (got ${formatRA(eqEquinox.raHours)})`);
assert(eqEquinox.frame === 'GEOCENTRIC_EQUATORIAL', `Equatorial frame label verified: ${eqEquinox.frame}`);

// Horizon Transformation for overhead zenith object (RA = LST, Dec = Lat)
const horizZenith = equatorialToHorizontal(lstGreenwich, 51.4769, lstGreenwich, 51.4769);
assert(horizZenith.altDeg >= 89.9, `Object at RA=LST, Dec=Lat is at Zenith Alt ~90° (got ${horizZenith.altDeg}°)`);
assert(horizZenith.isAboveHorizon === true, "Zenith object is above horizon");
assert(horizZenith.frame === 'HORIZONTAL_ALT_AZ', `Horizontal frame label verified: ${horizZenith.frame}`);

// 3. Observer Model & Presets
assert(DEFAULT_OBSERVER.name.includes("Royal Observatory Greenwich"), "Default observer is Greenwich");
assert(OBSERVATORY_PRESETS.length >= 6, `At least 6 observatory presets available (got ${OBSERVATORY_PRESETS.length})`);

const validObs = validateObserver({ latitudeDeg: 95, longitudeDeg: -190 });
assert(validObs.latitudeDeg === 90 && validObs.longitudeDeg === -180, "Observer coordinates clamped within valid geographical bounds [-90,90] and [-180,180]");

// 4. Bright Star Catalog
assert(BRIGHT_STARS.length >= 45, `Bright star catalog contains top 45+ stars (got ${BRIGHT_STARS.length})`);
const sirius = BRIGHT_STARS.find(s => s.name === 'Sirius');
assert(sirius && sirius.vmag < 0, `Sirius has negative visual magnitude (got ${sirius?.vmag})`);
assert(sirius && sirius.ra != null && sirius.dec != null, "Sirius has valid RA and Dec coordinates");

// 5. Constellations
assert(CONSTELLATIONS.length >= 8, `Constellation catalog loaded (got ${CONSTELLATIONS.length})`);
const orion = CONSTELLATIONS.find(c => c.id === 'orion' || c.name.includes('Orion'));
assert(orion && orion.lines.length > 0, "Orion constellation lines present");

// 6. Rise, Transit, Set Calculation
const rts = calculateRiseTransitSet(sirius.ra, sirius.dec, 0, DEFAULT_OBSERVER);
assert(rts.riseTime != null && rts.transitTime != null && rts.setTime != null, `Rise/Transit/Set computed: Rise ${rts.riseTime}, Transit ${rts.transitTime}, Set ${rts.setTime}`);

// 7. Angular Separation
const sep = calculateAngularSeparation(0, 0, 0, 90);
assert(Math.abs(sep - 90) < 0.01, `Angular separation between Equator and North Pole is 90° (got ${sep.toFixed(2)}°)`);

console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);

/**
 * testPart12EphemerisMission.node.js - Automated Test Suite for Part 12
 * Validates Ephemeris Engine, State Vectors, Reference Frames, Epochs, Mission Engine, and Hohmann Transfer calculations.
 */

import { dateToJulianDate, julianDateToDate, daysSinceJ2000, J2000_JD, getSimulationEpoch } from './epochUtils.js';
import { heliocentricToGeocentricEquatorial, REFERENCE_FRAMES } from './referenceFrameUtils.js';
import { validateCelestialState, sanitizeCelestialState } from './scientificValidation.js';
import CelestialState from '../engine/CelestialState.js';
import EphemerisEngine from '../engine/EphemerisEngine.js';
import MissionEngine from '../engine/MissionEngine.js';
import { calculateHohmannTransfer } from './hohmannTransfer.js';

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

console.log('=== PLANETORY PART 12 — EPHEMERIS ENGINE & MISSION SYSTEM AUTOMATED TEST ===\n');

// 1. Julian Date & Epoch Tests
const testDate = new Date('2000-01-01T12:00:00Z');
const jd = dateToJulianDate(testDate);
assert(Math.abs(jd - 2451545.0) < 0.0001, `J2000 Julian Date is ~2451545.0 (got ${jd})`);

const reconDate = julianDateToDate(2451545.0);
assert(reconDate.toISOString() === '2000-01-01T12:00:00.000Z', `JD 2451545.0 reconstructs to J2000 ISO (got ${reconDate.toISOString()})`);

const epochMeta = getSimulationEpoch(0);
assert(epochMeta.julianDate === 2451545.0, `Simulation epoch at simTimeDays=0 is JD 2451545.0`);

// 2. CelestialState & Validation Tests
const validState = new CelestialState({
  objectId: 'earth',
  position: { x: 1.0, y: 0.0, z: 0.0 },
  velocity: { vx: 0.0, vy: 29.78, vz: 0.0 },
  referenceFrame: REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC,
  source: 'ANALYTICAL-KEPLER'
});
const checkValid = validateCelestialState(validState);
assert(checkValid.isValid === true, `Valid state vector passes scientific validation`);

const invalidState = new CelestialState({
  objectId: 'corrupted',
  position: { x: NaN, y: 0.0, z: 0.0 }
});
const checkInvalid = validateCelestialState(invalidState);
assert(checkInvalid.isValid === false, `Corrupted state vector with NaN is correctly rejected`);

const sanitized = sanitizeCelestialState(invalidState, validState);
assert(sanitized.isFallbackApplied === true, `Sanitizer applies safe fallback state for corrupted data`);

// 3. Ephemeris Engine Dispatch Tests
const earthState = EphemerisEngine.getBodyState('earth', 0);
assert(earthState && earthState.position.x !== undefined, `EphemerisEngine generates Earth state vector`);
assert(earthState.precision === 'STANDARD', `Earth state defaults to analytical standard precision`);

const voyagerState = EphemerisEngine.getBodyState('voyager-1', 0);
assert(voyagerState && voyagerState.source.includes('LOCAL'), `Voyager 1 state retrieved from Local High-Precision Ephemeris Provider`);

// 4. Reference Frame Transformation Tests
const geocentricEq = heliocentricToGeocentricEquatorial(
  { x: 1.524, y: 0.0, z: 0.0 }, // Mars heliocentric
  { x: 1.0, y: 0.0, z: 0.0 }    // Earth heliocentric
);
assert(Math.abs(geocentricEq.x - 0.524) < 0.0001, `Geocentric DX correctly calculated (got ${geocentricEq.x.toFixed(3)} AU)`);

// 5. Mission Engine Spacecraft & Analytics Tests
const missions = MissionEngine.getMissions();
assert(missions.length >= 8, `MissionEngine loads at least 8 iconic spacecraft missions (got ${missions.length})`);

const analytics = MissionEngine.calculateRelativeAnalytics('voyager-1', 'earth', 0);
assert(analytics && analytics.distanceAu > 100, `Voyager 1 relative distance to Earth exceeds 100 AU (got ${analytics.distanceAu.toFixed(1)} AU)`);

// 6. Hohmann Transfer Calculator Tests
const transfer = calculateHohmannTransfer('earth', 'mars');
assert(transfer.origin === 'Earth' && transfer.destination === 'Mars', `Hohmann transfer calculated between Earth and Mars`);
assert(transfer.durationDays > 200 && transfer.durationDays < 300, `Earth-Mars Hohmann transfer travel time is ~259 days (got ${transfer.durationDays} days)`);
assert(transfer.totalDeltaVKmS > 4.0 && transfer.totalDeltaVKmS < 7.0, `Earth-Mars Hohmann total delta-v is ~5.6 km/s (got ${transfer.totalDeltaVKmS.toFixed(2)} km/s)`);
assert(transfer.trajectoryPoints.length > 30, `Hohmann transfer generates 3D trajectory points arc (got ${transfer.trajectoryPoints.length} points)`);

console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) {
  process.exit(1);
}

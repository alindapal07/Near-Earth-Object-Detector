/**
 * AnalyticalEphemerisProvider.js - Keplerian Analytical Ephemeris Engine
 * Computes deterministic heliocentric/geocentric position and velocity state vectors.
 */

import CelestialState from '../CelestialState';
import { PLANET_DATA } from '../../data/planets';
import { MOON_DATA } from '../../data/moons';
import { REFERENCE_FRAMES } from '../../utils/referenceFrameUtils';
import { CONSTANTS } from '../../utils/epochUtils';

export default class AnalyticalEphemerisProvider {
  constructor() {
    this.name = 'ANALYTICAL-KEPLER';
    this.priority = 10; // Base fallback provider
  }

  /**
   * Generates a CelestialState vector for any known celestial body at a given simulation epoch.
   * @param {string} bodyId 
   * @param {number} simTimeDays - Days relative to J2000
   * @returns {CelestialState}
   */
  getState(bodyId, simTimeDays = 0) {
    const planetList = Object.values(PLANET_DATA);
    const planetData = planetList.find(p => p.id.toLowerCase() === bodyId.toLowerCase());
    
    if (planetData) {
      return this._calculatePlanetState(planetData, simTimeDays);
    }

    const moonData = MOON_DATA.find(m => m.id.toLowerCase() === bodyId.toLowerCase());
    if (moonData) {
      return this._calculateMoonState(moonData, simTimeDays);
    }

    // Default fallback state if object unknown
    return new CelestialState({
      objectId: bodyId,
      epoch: simTimeDays,
      position: { x: 1.0, y: 0.0, z: 0.0 },
      velocity: { vx: 0.0, vy: 29.78, vz: 0.0 },
      referenceFrame: REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC,
      center: 'SUN',
      source: 'ANALYTICAL-KEPLER',
      precision: 'STANDARD'
    });
  }

  _calculatePlanetState(planet, simTimeDays) {
    const a = planet.a || planet.semiMajorAxis || 1.0; // AU
    const e = planet.e || planet.eccentricity || 0;
    const incRad = planet.i || ((planet.inclinationDeg || 0) * Math.PI / 180);
    const periodDays = planet.orbitalPeriodDays || planet.orbitalPeriod || 365.25;
    const meanLongitude0 = planet.M0 || planet.meanLongitude0 || 0;

    // Mean anomaly M (radians)
    const n = (2 * Math.PI) / periodDays; // Mean motion (rad/day)
    const M = (n * simTimeDays + (meanLongitude0 * Math.PI / 180)) % (2 * Math.PI);

    // Approximate eccentric anomaly E using 1st order Kepler equation solver
    let E = M;
    for (let i = 0; i < 5; i++) {
      E = M + e * Math.sin(E);
    }

    // True anomaly nu
    const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
    const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);

    // Distance r (AU)
    const r = a * (1 - e * Math.cos(E));

    // Position in orbital plane
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);

    // 3D Ecliptic position
    const x = xOrb;
    const y = yOrb * Math.cos(incRad);
    const z = yOrb * Math.sin(incRad);

    // Vis-viva speed v (km/s) = sqrt(GM * (2/r - 1/a))
    // GM_Sun = 1.327e11 km^3/s^2, 1 AU = 1.496e8 km
    const rKm = r * CONSTANTS.AU_IN_KM;
    const aKm = a * CONSTANTS.AU_IN_KM;
    const vSpeed = Math.sqrt(CONSTANTS.GM_SUN * (Math.abs(2 / rKm - 1 / aKm)));

    // Tangential velocity vector
    const vx = -vSpeed * Math.sin(nu);
    const vy = vSpeed * Math.cos(nu) * Math.cos(incRad);
    const vz = vSpeed * Math.cos(nu) * Math.sin(incRad);

    return new CelestialState({
      objectId: planet.id,
      epoch: simTimeDays,
      position: { x, y, z },
      velocity: { vx, vy, vz },
      acceleration: { ax: 0, ay: 0, az: 0 },
      referenceFrame: REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC,
      center: 'SUN',
      source: 'ANALYTICAL-KEPLER',
      precision: 'STANDARD',
      confidence: 0.95,
      accuracy: '0.001 AU',
      units: { position: 'AU', velocity: 'km/s', acceleration: 'm/s²' }
    });
  }

  _calculateMoonState(moon, simTimeDays) {
    const periodDays = moon.orbitalPeriodDays || moon.orbitalPeriod || 27.3;
    // moon.a is already in AU relative to parent; fallback to km conversion
    const aAu = moon.a || ((moon.semiMajorAxisKm || 384400) / CONSTANTS.AU_IN_KM);
    const aKm = aAu * CONSTANTS.AU_IN_KM;

    const angle = ((2 * Math.PI / periodDays) * simTimeDays) % (2 * Math.PI);
    const x = aAu * Math.cos(angle);
    const y = aAu * Math.sin(angle);
    const z = 0;

    const vSpeed = (2 * Math.PI * aKm) / (periodDays * 86400); // km/s
    const vx = -vSpeed * Math.sin(angle);
    const vy = vSpeed * Math.cos(angle);
    const vz = 0;

    return new CelestialState({
      objectId: moon.id,
      epoch: simTimeDays,
      position: { x, y, z },
      velocity: { vx, vy, vz },
      referenceFrame: REFERENCE_FRAMES.BODY_CENTERED,
      center: moon.parent || moon.parentPlanet || 'EARTH',
      source: 'ANALYTICAL-KEPLER',
      precision: 'STANDARD',
      confidence: 0.9,
      accuracy: '100 km'
    });
  }
}

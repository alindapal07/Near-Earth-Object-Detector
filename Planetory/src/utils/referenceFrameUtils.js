/**
 * referenceFrameUtils.js - Astronomical Reference Frame Transformations
 * Supports Heliocentric Ecliptic, Geocentric Equatorial, Horizontal Alt-Az, and Body-Centered frames.
 */

export const REFERENCE_FRAMES = {
  HELIOCENTRIC_ECLIPTIC: 'HELIOCENTRIC_ECLIPTIC',   // Sun-centered ecliptic plane (J2000)
  GEOCENTRIC_EQUATORIAL: 'GEOCENTRIC_EQUATORIAL', // Earth-centered celestial equator
  HORIZONTAL_ALT_AZ: 'HORIZONTAL_ALT_AZ',         // Observer-centered horizon
  BARYCENTRIC: 'BARYCENTRIC',                     // Solar System Barycenter
  BODY_CENTERED: 'BODY_CENTERED'                  // Planet/Moon/Spacecraft centered
};

/**
 * Transforms a Heliocentric Ecliptic position vector to Geocentric Equatorial.
 * @param {Object} posHeliocentric - { x, y, z } in AU or km
 * @param {Object} posEarthHeliocentric - Earth's heliocentric { x, y, z }
 * @param {number} [obliquityRad=0.4090928] - Earth ecliptic obliquity (~23.44 deg in rad)
 * @returns {Object} { x, y, z } Geocentric Equatorial
 */
export function heliocentricToGeocentricEquatorial(posHeliocentric, posEarthHeliocentric, obliquityRad = 0.4090928) {
  // 1. Shift origin from Sun to Earth (Geocentric Ecliptic)
  const dx = posHeliocentric.x - posEarthHeliocentric.x;
  const dy = posHeliocentric.y - posEarthHeliocentric.y;
  const dz = posHeliocentric.z - posEarthHeliocentric.z;

  // 2. Rotate ecliptic coordinates to equatorial (rotation around X-axis by obliquity ε)
  const cosE = Math.cos(obliquityRad);
  const sinE = Math.sin(obliquityRad);

  const xEq = dx;
  const yEq = dy * cosE - dz * sinE;
  const zEq = dy * sinE + dz * cosE;

  return { x: xEq, y: yEq, z: zEq };
}

/**
 * Converts Heliocentric position to Body-Centered frame.
 * @param {Object} posObjHeliocentric 
 * @param {Object} posParentHeliocentric 
 * @returns {Object} Relative { x, y, z }
 */
export function heliocentricToBodyCentered(posObjHeliocentric, posParentHeliocentric) {
  return {
    x: posObjHeliocentric.x - posParentHeliocentric.x,
    y: posObjHeliocentric.y - posParentHeliocentric.y,
    z: posObjHeliocentric.z - posParentHeliocentric.z
  };
}

/**
 * Validates reference frame compatibility between two states.
 */
export function checkFrameCompatibility(frameA, frameB) {
  if (!frameA || !frameB) return false;
  return frameA === frameB;
}

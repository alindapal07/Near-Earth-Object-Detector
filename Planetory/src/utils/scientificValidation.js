/**
 * scientificValidation.js - Scientific Data & State Vector Validation Layer
 * Ensures astronomical state vectors and physical parameters are mathematically valid.
 */

/**
 * Validates an astronomical 3D vector object.
 * @param {Object} vec - { x, y, z } or { vx, vy, vz }
 * @returns {boolean}
 */
export function isValidVector(vec) {
  if (!vec || typeof vec !== 'object') return false;
  const { x, y, z, vx, vy, vz } = vec;
  
  if (x !== undefined && (isNaN(x) || !isFinite(x))) return false;
  if (y !== undefined && (isNaN(y) || !isFinite(y))) return false;
  if (z !== undefined && (isNaN(z) || !isFinite(z))) return false;

  if (vx !== undefined && (isNaN(vx) || !isFinite(vx))) return false;
  if (vy !== undefined && (isNaN(vy) || !isFinite(vy))) return false;
  if (vz !== undefined && (isNaN(vz) || !isFinite(vz))) return false;

  return true;
}

/**
 * Validates a CelestialState object against astronomical bounds.
 * @param {Object} state 
 * @returns {Object} { isValid: boolean, reason?: string, fallbackRequired: boolean }
 */
export function validateCelestialState(state) {
  if (!state) {
    return { isValid: false, reason: 'State is null/undefined', fallbackRequired: true };
  }

  if (!isValidVector(state.position)) {
    return { isValid: false, reason: 'Position vector contains NaN or Infinity', fallbackRequired: true };
  }

  // Calculate distance magnitude (in AU or km)
  const distSq = (state.position.x ** 2) + (state.position.y ** 2) + (state.position.z ** 2);
  const dist = Math.sqrt(distSq);

  // Unphysical distance bounds check (for Solar System objects, distance shouldn't exceed 500 AU unless specified)
  if (dist > 1000.0 && state.units?.position === 'AU') {
    return { isValid: false, reason: `Unphysical distance ${dist.toFixed(2)} AU`, fallbackRequired: true };
  }

  if (state.velocity && isValidVector(state.velocity)) {
    const vSq = (state.velocity.vx ** 2) + (state.velocity.vy ** 2) + (state.velocity.vz ** 2);
    const speed = Math.sqrt(vSq);

    // If speed is in km/s, solar system escape velocity is ~500 km/s max
    if (state.units?.velocity === 'km/s' && speed > 1000.0) {
      return { isValid: false, reason: `Unphysical orbital speed ${speed.toFixed(2)} km/s`, fallbackRequired: true };
    }
  }

  return { isValid: true, fallbackRequired: false };
}

/**
 * Ensures state vector safe values or fallback.
 * @param {Object} state 
 * @param {Object} fallbackState 
 * @returns {Object} Valid state vector
 */
export function sanitizeCelestialState(state, fallbackState) {
  const check = validateCelestialState(state);
  if (check.isValid) {
    return state;
  }

  console.warn(`[ScientificValidation] State vector rejected (${check.reason}). Applying fallback state.`);
  return {
    ...fallbackState,
    isFallbackApplied: true,
    fallbackReason: check.reason,
    precision: 'ESTIMATED'
  };
}

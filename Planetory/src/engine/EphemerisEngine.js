/**
 * EphemerisEngine.js - Central Ephemeris Dispatcher & Scientific Provider Manager
 * Provides unified getBodyState(bodyId, simTimeDays, referenceFrame) interface.
 * Enforces Provider Priority: JPL HORIZONS -> LOCAL CACHED -> ANALYTICAL KEPLER -> SAFE FALLBACK.
 */

import AnalyticalEphemerisProvider from './providers/AnalyticalEphemerisProvider';
import LocalEphemerisProvider from './providers/LocalEphemerisProvider';
import JPLEphemerisProvider from './providers/JPLEphemerisProvider';
import { sanitizeCelestialState } from '../utils/scientificValidation';
import { REFERENCE_FRAMES, heliocentricToGeocentricEquatorial, heliocentricToBodyCentered } from '../utils/referenceFrameUtils';

class EphemerisEngine {
  constructor() {
    this.analyticalProvider = new AnalyticalEphemerisProvider();
    this.localProvider = new LocalEphemerisProvider();
    this.jplProvider = new JPLEphemerisProvider();
  }

  /**
   * Main entry point: Retrieves the high-precision state vector for any body at a given simulation epoch.
   * @param {string} bodyId - Target body ID
   * @param {number} simTimeDays - Simulation epoch (days from J2000)
   * @param {string} [targetFrame=REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC] - Requested reference frame
   * @returns {CelestialState} Unified state vector
   */
  getBodyState(bodyId, simTimeDays = 0, targetFrame = REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC) {
    if (!bodyId) {
      return this.analyticalProvider.getState('earth', simTimeDays);
    }

    let state = null;

    // 1. Try Local High-Precision Ephemeris Provider first (instantaneous)
    if (this.localProvider.hasState(bodyId)) {
      state = this.localProvider.getState(bodyId, simTimeDays);
    }

    // 2. Fall back to Analytical Keplerian Engine
    if (!state) {
      state = this.analyticalProvider.getState(bodyId, simTimeDays);
    }

    // 3. Perform Scientific Validation Layer check
    const validState = sanitizeCelestialState(state, this.analyticalProvider.getState('earth', simTimeDays));

    // 4. Perform Reference Frame Transformation if requested
    if (targetFrame && targetFrame !== validState.referenceFrame) {
      return this.transformFrame(validState, targetFrame, simTimeDays);
    }

    return validState;
  }

  /**
   * Async state vector fetch (attempts JPL Horizons live fetch if available).
   */
  async getBodyStateAsync(bodyId, simTimeDays = 0) {
    const jplState = await this.jplProvider.getStateAsync(bodyId, simTimeDays);
    if (jplState) {
      return sanitizeCelestialState(jplState, this.getBodyState(bodyId, simTimeDays));
    }
    return this.getBodyState(bodyId, simTimeDays);
  }

  /**
   * Reference frame transformation logic.
   */
  transformFrame(state, targetFrame, simTimeDays) {
    if (targetFrame === REFERENCE_FRAMES.GEOCENTRIC_EQUATORIAL && state.referenceFrame === REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC) {
      const earthState = this.getBodyState('earth', simTimeDays, REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC);
      const posEq = heliocentricToGeocentricEquatorial(state.position, earthState.position);
      
      const newState = { ...state };
      newState.position = posEq;
      newState.referenceFrame = REFERENCE_FRAMES.GEOCENTRIC_EQUATORIAL;
      newState.center = 'EARTH';
      return newState;
    }

    return state;
  }
}

export default new EphemerisEngine();

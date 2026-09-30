/**
 * JPLEphemerisProvider.js - Authoritative JPL Horizons Ephemeris Provider
 * Communicates with NASA/JPL Horizons API proxy service for high-precision state vectors.
 */

import CelestialState from '../CelestialState';
import { fetchHorizonsPosition } from '../../api/spaceApi';
import { REFERENCE_FRAMES } from '../../utils/referenceFrameUtils';

export default class JPLEphemerisProvider {
  constructor() {
    this.name = 'JPL-HORIZONS';
    this.priority = 100; // Highest priority
    this.cache = new Map();
    this.ttlMs = 10 * 60 * 1000; // 10 minutes cache TTL
  }

  /**
   * Fetches state vector from JPL Horizons backend proxy.
   * @param {string} bodyId 
   * @param {number} simTimeDays 
   * @returns {Promise<CelestialState|null>}
   */
  async getStateAsync(bodyId, simTimeDays = 0) {
    if (!bodyId) return null;

    const cacheKey = `${bodyId.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < this.ttlMs)) {
      return cached.state;
    }

    try {
      const data = await fetchHorizonsPosition(bodyId);
      if (data && !data.error && data.position) {
        const state = new CelestialState({
          objectId: bodyId,
          epoch: simTimeDays,
          position: {
            x: data.position.x,
            y: data.position.y,
            z: data.position.z
          },
          velocity: data.velocity ? {
            vx: data.velocity.vx * 1731.46, // AU/day to km/s
            vy: data.velocity.vy * 1731.46,
            vz: data.velocity.vz * 1731.46
          } : { vx: 0, vy: 0, vz: 0 },
          referenceFrame: REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC,
          center: 'SUN',
          source: 'JPL-HORIZONS',
          precision: 'HIGH',
          confidence: 1.0,
          accuracy: '0.00001 AU',
          units: { position: 'AU', velocity: 'km/s', acceleration: 'm/s²' }
        });

        this.cache.set(cacheKey, { state, timestamp: now });
        return state;
      }
    } catch (err) {
      console.warn(`[JPLEphemerisProvider] Horizons lookup failed for ${bodyId}:`, err.message);
    }

    return null;
  }
}

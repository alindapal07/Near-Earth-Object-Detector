import { fetchHorizonsPosition } from '../api/spaceApi';

export default class EphemerisManager {
  constructor() {
    this.ephemerisCache = new Map();
    this.ttlMs = 15 * 60 * 1000; // 15 minute cache TTL
  }

  /**
   * Fetch high-accuracy JPL Horizons ephemeris state vectors for selected target.
   */
  async getSelectedEphemeris(targetId) {
    if (!targetId) return null;

    const cached = this.ephemerisCache.get(targetId);
    const now = Date.now();

    if (cached && (now - cached.fetchedAt < this.ttlMs)) {
      return {
        ...cached.data,
        dataState: 'CACHED',
        dataBadge: '🔵 CACHED (JPL HORIZONS)',
        lastUpdated: new Date(cached.fetchedAt).toISOString()
      };
    }

    try {
      const data = await fetchHorizonsPosition(targetId);
      if (data && !data.error) {
        const result = {
          ...data,
          dataState: 'LIVE',
          dataBadge: '🟢 LIVE - JPL HORIZONS',
          lastUpdated: new Date().toISOString()
        };
        this.ephemerisCache.set(targetId, { data: result, fetchedAt: now });
        return result;
      }
    } catch (err) {
      console.warn(`[EphemerisManager] Failed to fetch Horizons ephemeris for ${targetId}: ${err.message}`);
    }

    // Fallback if Horizons call fails
    return {
      dataState: 'PROPAGATED',
      dataBadge: '🟡 PROPAGATED - KEPLER ORBIT',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clears cached ephemeris data.
   */
  clearCache() {
    this.ephemerisCache.clear();
  }
}

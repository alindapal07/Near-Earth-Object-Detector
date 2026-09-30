import axios from 'axios';

// Comets & Asteroids provided by NASA's SBN/JPL data
// Current endpoint: https://data.nasa.gov/resource/b67r-rgxc.json

const NASA_DATA_URL = 'https://data.nasa.gov/resource/b67r-rgxc.json';
const CACHE_KEY = 'planetory:nasa:comets';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 1 day

/**
 * Fetch and parse comet/asteroid orbital data.
 * Will use cached data if available and fresh.
 */
export async function getCometData() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        return { data: parsed.data, source: 'cached' };
      }
    } catch (e) {
      console.warn("Error parsing cached comet data", e);
    }
  }

  try {
    const response = await axios.get(NASA_DATA_URL, {
      params: {
        $limit: 100 // Limiting to top 100 for performance
      }
    });

    const parsedData = response.data
      .map(item => ({
        id: item.object || item.object_name,
        name: item.object_name,
        type: 'Comet/Asteroid',
        e: Number(item.e),
        a: Number(item.q_au_1) / (1 - Number(item.e)), // calculate semi-major axis from perihelion
        q: Number(item.q_au_1),
        i: Number(item.i_deg) * (Math.PI / 180), // deg to rad
        Omega: Number(item.node_deg) * (Math.PI / 180),
        omega: Number(item.w_deg) * (Math.PI / 180),
        M0: 0, // Incomplete data for epoch mean anomaly often in this dataset, defaulting
        orbitalPeriodDays: Number(item.p_yr) * 365.25
      }))
      .filter(item => 
        Number.isFinite(item.e) && 
        Number.isFinite(item.a) && 
        Number.isFinite(item.i) &&
        item.e < 1.0 // Ensure elliptical orbit
      );

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: parsedData
    }));

    return { data: parsedData, source: 'live' };
  } catch (error) {
    console.error("NASA API fetch failed:", error);
    
    // Fallback to cache if available even if expired
    if (cached) {
      return { data: JSON.parse(cached).data, source: 'offline-cache' };
    }
    
    return { data: [], source: 'offline' };
  }
}

import axios from 'axios';

// Base URL for our backend proxy
const API_BASE = 'http://localhost:3001/api';

/**
 * Fetches the NASA NeoWs feed for the next 7 days.
 */
export async function fetchNeoFeed() {
  try {
    const response = await axios.get(`${API_BASE}/neo/feed`, { timeout: 15000 });
    return { ...response.data, status: 'live' };
  } catch (err) {
    console.error('[spaceApi] NEO feed failed:', err.message);
    return { error: true, objects: [], status: 'offline', message: err.message };
  }
}

/**
 * Fetches the asteroid catalog.
 * @param {Object} options - { group, limit, page, q }
 */
export async function fetchAsteroidCatalog({ group = 'neo', limit = 200, page = 1, q } = {}) {
  try {
    const response = await axios.get(`${API_BASE}/asteroids`, {
      params: { group, limit, page, q },
      timeout: 20000
    });
    return { ...response.data, status: 'live' };
  } catch (err) {
    console.error('[spaceApi] Asteroid catalog failed:', err.message);
    return { error: true, objects: [], status: 'offline', message: err.message };
  }
}

/**
 * Searches asteroids by name/designation.
 */
export async function searchAsteroids(query) {
  try {
    const response = await axios.get(`${API_BASE}/asteroids/search`, {
      params: { q: query },
      timeout: 15000
    });
    return { ...response.data, status: 'live' };
  } catch (err) {
    console.error('[spaceApi] Search failed:', err.message);
    return { error: true, objects: [], status: 'offline', message: err.message };
  }
}

/**
 * Fetches full details for a single asteroid.
 */
export async function fetchAsteroidDetail(id) {
  try {
    const response = await axios.get(`${API_BASE}/asteroids/${encodeURIComponent(id)}`, { timeout: 20000 });
    return { ...response.data, status: 'live' };
  } catch (err) {
    console.error('[spaceApi] Asteroid detail failed:', err.message);
    return { error: true, status: 'offline', message: err.message };
  }
}

/**
 * Fetches upcoming close approaches.
 */
export async function fetchCloseApproaches({ distMax = '0.05', limit = 50 } = {}) {
  try {
    const response = await axios.get(`${API_BASE}/close-approaches`, {
      params: { 'dist-max': distMax, limit },
      timeout: 20000
    });
    return { ...response.data, status: 'live' };
  } catch (err) {
    console.error('[spaceApi] Close approaches failed:', err.message);
    return { error: true, approaches: [], status: 'offline', message: err.message };
  }
}

/**
 * Fetches the Horizons position for a specific object.
 */
export async function fetchHorizonsPosition(id) {
  try {
    const response = await axios.get(`${API_BASE}/horizons/${encodeURIComponent(id)}`, { timeout: 30000 });
    return { ...response.data, status: 'live' };
  } catch (err) {
    console.error('[spaceApi] Horizons failed:', err.message);
    return { error: true, status: 'offline', message: err.message };
  }
}

/**
 * Checks backend server status.
 */
export async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_BASE}/system/status`, { timeout: 5000 });
    return { online: true, ...response.data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

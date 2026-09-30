/**
 * neoApi.js — Frontend NEO API Layer (Part 35)
 * 
 * All frontend fetch calls proxied through the Planetory backend server.
 * NO direct calls to JPL/NASA from the browser.
 * NO API keys in this file.
 */

const API_BASE = 'http://localhost:3001/api';

// ─── Generic fetch with error/stale handling ──────────────────────────────────

async function apiFetch(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `HTTP ${response.status} for ${path}`);
  }

  const data = await response.json();
  return {
    ...data,
    _fetchedAt: new Date().toISOString(),
    _dataStatus: data.dataStatus || (data.fromCache ? 'CACHED' : 'LIVE'),
    _apiPath: path
  };
}

// ─── NEO Feed (NASA NeoWs 7-day) ──────────────────────────────────────────────

export async function fetchNeoFeed() {
  return apiFetch('/neo/feed');
}

// ─── NEO Search (JPL SBDB) ────────────────────────────────────────────────────

export async function searchNEOs(query) {
  if (!query || query.trim().length < 2) {
    return { source: 'JPL-SBDB', count: 0, objects: [], _dataStatus: 'NO_QUERY' };
  }
  return apiFetch('/neo/search', { q: query.trim() });
}

// ─── NEO Catalog (JPL SBDB) ───────────────────────────────────────────────────

export async function fetchNEOCatalog(options = {}) {
  const { group = 'neo', limit = 100, page = 1, q } = options;
  return apiFetch('/neo/catalog', { group, limit, page, q });
}

// ─── Earth Close Approaches (JPL CNEOS CAD) ───────────────────────────────────

export async function fetchEarthApproaches(options = {}) {
  const {
    distMax = '0.05',
    dateMin,
    dateMax,
    limit = 100
  } = options;
  return apiFetch('/neo/earth-approaches', {
    'dist-max': distMax,
    'date-min': dateMin,
    'date-max': dateMax,
    limit
  });
}

// ─── Full NEO Detail (SBDB + Sentry + CAD) ────────────────────────────────────

export async function fetchNEODetail(id) {
  if (!id) throw new Error('NEO id is required');
  return apiFetch(`/neo/${encodeURIComponent(id)}`);
}

// ─── Orbital Elements Only ────────────────────────────────────────────────────

export async function fetchNEOOrbit(id) {
  return apiFetch(`/neo/${encodeURIComponent(id)}/orbit`);
}

// ─── Close Approaches for Specific Object ────────────────────────────────────

export async function fetchCloseApproachesForNEO(id, options = {}) {
  const { distMax = '0.3', limit = 50 } = options;
  return apiFetch(`/neo/${encodeURIComponent(id)}/close-approaches`, {
    'dist-max': distMax,
    limit
  });
}

// ─── Sentry Risk Assessment (official CNEOS data only) ────────────────────────

export async function fetchSentryRisk(id) {
  return apiFetch(`/neo/${encodeURIComponent(id)}/risk`);
}

// ─── Sentry Risk Summary (top monitored objects) ──────────────────────────────

export async function fetchRiskSummary(limit = 50) {
  return apiFetch('/neo/risk-summary', { limit });
}

// ─── JPL Horizons High-Precision Ephemeris ────────────────────────────────────

export async function fetchHorizonsEphemeris(id) {
  return apiFetch(`/neo/${encodeURIComponent(id)}/horizons`);
}

// ─── Convenience: Fetch all data for an NEO in parallel ──────────────────────

export async function fetchNEOFullProfile(id) {
  const [detail, risk, approaches, horizons] = await Promise.allSettled([
    fetchNEODetail(id),
    fetchSentryRisk(id),
    fetchCloseApproachesForNEO(id),
    fetchHorizonsEphemeris(id)
  ]);

  return {
    detail: detail.status === 'fulfilled' ? detail.value : null,
    risk: risk.status === 'fulfilled' ? risk.value : null,
    approaches: approaches.status === 'fulfilled' ? approaches.value : null,
    horizons: horizons.status === 'fulfilled' ? horizons.value : null,
    errors: {
      detail: detail.status === 'rejected' ? detail.reason?.message : null,
      risk: risk.status === 'rejected' ? risk.reason?.message : null,
      approaches: approaches.status === 'rejected' ? approaches.reason?.message : null,
      horizons: horizons.status === 'rejected' ? horizons.reason?.message : null
    },
    fetchedAt: new Date().toISOString()
  };
}

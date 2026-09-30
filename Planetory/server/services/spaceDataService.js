import axios from 'axios';
import { getCache, setCache } from './cache.js';

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const JPL_BASE = 'https://ssd-api.jpl.nasa.gov';
const NEOWS_BASE = 'https://api.nasa.gov/neo/rest/v1';

/**
 * Normalizes a raw JPL SBDB query data row into a clean asteroid object.
 * @param {Array} row - Raw row from SBDB query
 * @param {Array} fieldNames - Field names matching row indices
 */
function normalizeAsteroid(row, fieldNames) {
  const obj = {};
  fieldNames.forEach((f, i) => { obj[f] = row[i]; });

  const safe = (v) => (v != null && v !== '' ? Number(v) : null);
  const safeBool = (v) => v === 'Y';

  return {
    id: obj.spkid || null,
    designation: obj.pdes || null,
    name: obj.name || null,
    fullName: obj.full_name ? obj.full_name.trim() : null,
    neo: safeBool(obj.neo),
    pha: safeBool(obj.pha),
    orbitClass: obj['orbit_class.name'] || null,
    // Orbital elements (in degrees for angles, AU for distances)
    e: safe(obj.e),
    a: safe(obj.a),
    q: safe(obj.q),
    i: safe(obj.i),
    Omega: safe(obj.om),   // Longitude of ascending node (deg)
    omega: safe(obj.w),    // Argument of perihelion (deg)
    M0: safe(obj.ma),      // Mean anomaly (deg)
    period: safe(obj.per), // Orbital period (days)
    // Physical
    H: safe(obj.H),
    diameter: safe(obj.diameter),
    albedo: safe(obj.albedo),
    source: 'JPL-SBDB'
  };
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
function fmtDate(d) {
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// SBDB QUERY — catalog of asteroids
// ─────────────────────────────────────────────────────────────────────────────

export async function getAsteroidCatalog({ group = 'neo', limit = 200, page = 1, q = null } = {}) {
  const cacheKey = `catalog:${group}:${limit}:${page}:${q || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const fields = 'spkid,full_name,pdes,name,neo,pha,orbit_class.name,e,a,q,i,om,w,ma,per,H,diameter,albedo';
  const params = {
    fields,
    'sb-kind': 'a',
    limit: Math.min(Number(limit), 1000),
    'full-prec': false,
    'sb-ns': '0' // numbered objects only for performance (has more data)
  };

  if (group === 'neo') params['sb-group'] = 'neo';
  else if (group === 'pha') params['sb-group'] = 'pha';
  else if (group === 'mba') { params['sb-class'] = 'MBA'; delete params['sb-ns']; }
  else if (group === 'amor') params['sb-class'] = 'AMO';
  else if (group === 'apollo') params['sb-class'] = 'APO';
  else if (group === 'aten') params['sb-class'] = 'ATE';
  else if (group === 'all') { delete params['sb-ns']; }

  if (q) {
    params.sstr = q;
    delete params['sb-ns'];
  }

  const response = await axios.get(`${JPL_BASE}/sbdb_query.api`, { params, timeout: 20000 });
  const { fields: fieldArr, data } = response.data;

  if (!fieldArr || !data) {
    return { source: 'JPL-SBDB', count: 0, objects: [] };
  }

  const objects = data.map(row => normalizeAsteroid(row, fieldArr));
  const result = {
    source: 'JPL-SBDB',
    generatedAt: new Date().toISOString(),
    count: objects.length,
    group,
    objects
  };

  setCache(cacheKey, result, 3600); // 1 hour
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// SBDB SEARCH — full-text search by name/designation
// ─────────────────────────────────────────────────────────────────────────────

export async function searchAsteroids(query) {
  if (!query || query.trim().length < 2) {
    return { source: 'JPL-SBDB', count: 0, objects: [] };
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const fields = 'spkid,full_name,pdes,name,neo,pha,orbit_class.name,e,a,q,i,om,w,ma,per,H,diameter,albedo';
  const response = await axios.get(`${JPL_BASE}/sbdb_query.api`, {
    params: { fields, 'sb-kind': 'a', sstr: query.trim(), limit: 30 },
    timeout: 15000
  });

  const { fields: fieldArr, data } = response.data;
  const objects = (data || []).map(row => normalizeAsteroid(row, fieldArr || []));
  const result = { source: 'JPL-SBDB', count: objects.length, objects };

  setCache(cacheKey, result, 600); // 10 min
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// SBDB DETAIL — full single object record
// ─────────────────────────────────────────────────────────────────────────────

export async function getAsteroidDetail(id) {
  const cacheKey = `detail:${id}`;
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const response = await axios.get(`${JPL_BASE}/sbdb.api`, {
    params: {
      sstr: id,
      'phys-par': true,
      'close-app': true,
      discovery: true,
      'full-prec': false
    },
    timeout: 20000
  });

  const d = response.data;
  const orb = d.orbit || {};
  const els = {};
  if (orb.elements) {
    orb.elements.forEach(el => { els[el.name] = el.value; });
  }

  const safe = (v) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null);

  const detail = {
    id: d.object?.spkid || id,
    name: d.object?.shortname || null,
    fullName: d.object?.des || null,
    designation: d.object?.pdes || null,
    spkid: d.object?.spkid || null,
    neo: d.object?.neo === 'Y',
    pha: d.object?.pha === 'Y',
    orbitClass: d.object?.orbit_class?.name || null,
    orbitClassCode: d.object?.orbit_class?.code || null,
    orbital: {
      epoch: orb.epoch || null,
      e: safe(els.e),
      a: safe(els.a),
      q: safe(els.q),
      Q: safe(els.Q),  // aphelion
      i: safe(els.i),
      Omega: safe(els.om),
      omega: safe(els.w),
      M0: safe(els.ma),
      period: safe(els.per),
      n: safe(els.n),
      moid: orb.moid != null ? safe(orb.moid) : null,
      moid_jup: orb.moid_jup != null ? safe(orb.moid_jup) : null,
      tisserand: orb.t_jup != null ? safe(orb.t_jup) : null,
      solutionDate: orb.soln_date || null,
      dataArc: orb.data_arc || null,
      nObsUsed: orb.n_obs_used || null,
      conditionCode: orb.condition_code || null,
    },
    physical: {
      H: null,
      diameter: null,
      albedo: null,
      rotPer: null,
      spectralType: null,
      gm: null,
      density: null,
    },
    closeApproaches: (d.close_approach || []).map(ca => ({
      date: ca.cd,
      body: ca.body,
      dist: ca.dist,
      distMin: ca.dist_min,
      distMax: ca.dist_max,
      vRel: ca.v_rel,
      vInf: ca.v_inf,
      h: ca.h
    })),
    discovery: d.discovery
      ? {
          date: d.discovery.date || null,
          who: d.discovery.who || null,
          location: d.discovery.location || null,
          notes: d.discovery.notes || null
        }
      : null,
    source: 'JPL-SBDB',
    retrievedAt: new Date().toISOString()
  };

  // Parse physical parameters
  if (d.phys_par) {
    d.phys_par.forEach(p => {
      if (p.name === 'H') detail.physical.H = safe(p.value);
      if (p.name === 'diameter') detail.physical.diameter = safe(p.value);
      if (p.name === 'albedo') detail.physical.albedo = safe(p.value);
      if (p.name === 'rot_per') detail.physical.rotPer = safe(p.value);
      if (p.name === 'spec_T' || p.name === 'spec_B') detail.physical.spectralType = p.value;
      if (p.name === 'GM') detail.physical.gm = safe(p.value);
      if (p.name === 'density') detail.physical.density = safe(p.value);
    });
  }

  setCache(cacheKey, detail, 21600); // 6 hours
  return detail;
}

// ─────────────────────────────────────────────────────────────────────────────
// NASA NeoWs FEED
// ─────────────────────────────────────────────────────────────────────────────

export async function getNeoFeed() {
  const cacheKey = 'neofeed';
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);

  const response = await axios.get(`${NEOWS_BASE}/feed`, {
    params: {
      start_date: fmtDate(today),
      end_date: fmtDate(endDate),
      api_key: NASA_API_KEY
    },
    timeout: 25000
  });

  const neo_objects = [];
  const nearEarthObjects = response.data.near_earth_objects || {};

  Object.entries(nearEarthObjects).forEach(([date, dayList]) => {
    dayList.forEach(neo => {
      const ca = neo.close_approach_data?.[0] || {};
      neo_objects.push({
        id: neo.id,
        name: neo.name,
        designation: neo.designation || neo.name,
        absoluteMagnitude: Number(neo.absolute_magnitude_h) || null,
        estimatedDiameterMinKm: neo.estimated_diameter?.kilometers?.estimated_diameter_min
          ? Number(neo.estimated_diameter.kilometers.estimated_diameter_min)
          : null,
        estimatedDiameterMaxKm: neo.estimated_diameter?.kilometers?.estimated_diameter_max
          ? Number(neo.estimated_diameter.kilometers.estimated_diameter_max)
          : null,
        isPha: neo.is_potentially_hazardous_asteroid,
        isNeo: true,
        closeApproachDate: ca.close_approach_date || date,
        velocityKmS: ca.relative_velocity?.kilometers_per_second
          ? Number(ca.relative_velocity.kilometers_per_second)
          : null,
        missDistanceKm: ca.miss_distance?.kilometers
          ? Number(ca.miss_distance.kilometers)
          : null,
        missDistanceLunar: ca.miss_distance?.lunar
          ? Number(ca.miss_distance.lunar)
          : null,
        orbitingBody: ca.orbiting_body || 'Earth',
        source: 'NASA-NeoWs'
      });
    });
  });

  // Sort by close approach date
  neo_objects.sort((a, b) => new Date(a.closeApproachDate) - new Date(b.closeApproachDate));

  const result = {
    source: 'NASA-NeoWs',
    generatedAt: new Date().toISOString(),
    count: neo_objects.length,
    objects: neo_objects
  };

  setCache(cacheKey, result, 600); // 10 min
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// JPL CNEOS CLOSE APPROACH DATA
// ─────────────────────────────────────────────────────────────────────────────

export async function getCloseApproaches({ distMax = '0.05', dateMin, dateMax, limit = 50, des } = {}) {
  const today = new Date();
  const twoMonths = new Date(today);
  twoMonths.setDate(twoMonths.getDate() + 60);

  const params = {
    'date-min': dateMin || fmtDate(today),
    'date-max': dateMax || fmtDate(twoMonths),
    'dist-max': distMax,
    body: 'Earth',
    sort: 'date',
    limit: Math.min(Number(limit) || 50, 200),
    'full-prec': false,
    'sb-kind': 'a' // asteroids only
  };

  if (des) params.des = des;

  const cacheKey = `cad:${JSON.stringify(params)}`;
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const response = await axios.get(`${JPL_BASE}/cad.api`, { params, timeout: 20000 });
  const { fields, data, signature } = response.data;

  const approaches = (data || []).map(row => {
    const obj = {};
    (fields || []).forEach((f, i) => { obj[f] = row[i]; });
    return {
      designation: obj.des,
      name: obj.name || obj.des,
      closeApproachDate: obj.cd,
      dist: obj.dist ? Number(obj.dist) : null,       // AU
      distMin: obj.dist_min ? Number(obj.dist_min) : null,
      distMax: obj.dist_max ? Number(obj.dist_max) : null,
      vRel: obj.v_rel ? Number(obj.v_rel) : null,    // km/s
      vInf: obj.v_inf ? Number(obj.v_inf) : null,
      h: obj.h ? Number(obj.h) : null,
      diameter: obj.diameter ? Number(obj.diameter) : null,
      source: 'JPL-CNEOS'
    };
  });

  const result = {
    source: 'JPL-CNEOS',
    generatedAt: new Date().toISOString(),
    count: approaches.length,
    approaches
  };

  setCache(cacheKey, result, 900); // 15 min
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// JPL HORIZONS — high-accuracy ephemeris
// ─────────────────────────────────────────────────────────────────────────────

export async function getHorizonsPosition(id) {
  const cacheKey = `horizons:${id}`;
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const response = await axios.get('https://ssd.jpl.nasa.gov/api/horizons.api', {
    params: {
      format: 'json',
      COMMAND: `'${id}'`,
      OBJ_DATA: 'YES',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'VECTORS',
      CENTER: "'500@10'",       // Sun as center
      START_TIME: `'${fmtDate(now)}'`,
      STOP_TIME: `'${fmtDate(tomorrow)}'`,
      STEP_SIZE: "'1d'",
      VEC_TABLE: '2',
      VEC_CORR: 'NONE'
    },
    timeout: 30000
  });

  const text = response.data.result || '';

  // Extract X, Y, Z position (AU)
  const posMatch = text.match(/X\s*=\s*([-\d.E+]+)\s+Y\s*=\s*([-\d.E+]+)\s+Z\s*=\s*([-\d.E+]+)/i);
  // Extract VX, VY, VZ velocity (AU/day)
  const velMatch = text.match(/VX\s*=\s*([-\d.E+]+)\s+VY\s*=\s*([-\d.E+]+)\s+VZ\s*=\s*([-\d.E+]+)/i);

  if (!posMatch) {
    throw new Error(`Could not parse position from Horizons response for id=${id}`);
  }

  const result = {
    id,
    epoch: now.toISOString(),
    position: {
      x: Number(posMatch[1]),
      y: Number(posMatch[2]),
      z: Number(posMatch[3])
    },
    velocity: velMatch
      ? { vx: Number(velMatch[1]), vy: Number(velMatch[2]), vz: Number(velMatch[3]) }
      : null,
    positionSource: 'JPL-Horizons',
    positionType: 'PROPAGATED_VECTORS',
    units: { position: 'AU', velocity: 'AU/day' }
  };

  setCache(cacheKey, result, 300); // 5 min
  return result;
}

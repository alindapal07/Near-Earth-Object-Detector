/**
 * sentryService.js — JPL CNEOS Sentry Impact Risk Integration (Part 35)
 *
 * Fetches official impact risk data from JPL CNEOS Sentry system.
 * IMPORTANT: This is the ONLY source for impact probabilities.
 * We NEVER fabricate or estimate impact probabilities.
 *
 * Sentry API: https://ssd-api.jpl.nasa.gov/sentry.api
 */

import axios from 'axios';
import { getCache, setCache } from './cache.js';

const SENTRY_BASE = 'https://ssd-api.jpl.nasa.gov/sentry.api';
const KNOWN_SENTRY_VERSION = '2.0';

/**
 * Validate Sentry API version before parsing
 */
function validateSentryVersion(signature) {
  if (!signature?.version) return { valid: true, warning: false };
  if (signature.version !== KNOWN_SENTRY_VERSION) {
    console.warn(`[Sentry] API version mismatch: expected=${KNOWN_SENTRY_VERSION}, received=${signature.version}`);
    return {
      valid: false,
      warning: true,
      receivedVersion: signature.version,
      expectedVersion: KNOWN_SENTRY_VERSION,
      message: `Sentry API version mismatch: expected ${KNOWN_SENTRY_VERSION}, got ${signature.version}`
    };
  }
  return { valid: true, warning: false };
}

/**
 * Parse Sentry impact probability into a display string.
 * Always uses scientific notation for tiny probabilities — never rounds to 0.
 */
function formatImpactProbability(ip) {
  if (ip == null || isNaN(Number(ip))) return null;
  const val = Number(ip);
  if (val === 0) return '0';
  if (val < 0.001) return val.toExponential(3);
  return val.toFixed(6);
}

/**
 * Convert Sentry cumulative Palermo scale to human-readable description
 */
function describePalermo(ps) {
  if (ps == null) return null;
  const v = Number(ps);
  if (isNaN(v)) return null;
  if (v < -2) return 'Well below background level — routine monitoring';
  if (v < -1) return 'Somewhat below background level';
  if (v < 0)  return 'Approaching background level — further analysis warranted';
  return 'At or above background level — further analysis urgently warranted';
}

/**
 * Fetch Sentry data for a specific object by designation.
 * Returns null (not an error) if the object is not in Sentry database.
 * 
 * @param {string} des — Asteroid designation or spkid
 */
export async function getSentryRisk(des) {
  const cacheKey = `sentry:${des}`;
  const cached = getCache(cacheKey);
  if (cached !== undefined) return cached; // cached null is valid (not in Sentry)

  try {
    const response = await axios.get(SENTRY_BASE, {
      params: { des, 'removed': 0 },
      timeout: 15000
    });

    const data = response.data;
    const versionCheck = validateSentryVersion(data.signature);

    // Object not in Sentry
    if (!data.summary && !data.data) {
      setCache(cacheKey, null, 3600); // cache negative result 1 hour
      return null;
    }

    const summary = data.summary || {};
    const impacts = data.data || [];

    // Parse impact solutions
    const potentialImpacts = impacts.map(sol => ({
      date: sol.date,
      probability: sol.ip != null ? Number(sol.ip) : null,
      probabilityDisplay: formatImpactProbability(sol.ip),
      palermo: sol.ps != null ? Number(sol.ps) : null,
      torino: sol.ts != null ? Number(sol.ts) : null,
      impactVelocityKmS: sol.v_imp != null ? Number(sol.v_imp) : null,
      energyMt: sol.energy != null ? Number(sol.energy) : null,
      width: sol.width || null
    }));

    // Determine risk status from official Sentry values
    const maxTorino = summary.ts_max != null ? Number(summary.ts_max) : 0;
    const cumPalermo = summary.ps_cum != null ? Number(summary.ps_cum) : null;
    const cumIp = summary.ip != null ? Number(summary.ip) : null;

    let riskStatus;
    if (maxTorino >= 1) {
      riskStatus = 'NON_ZERO_IMPACT_PROBABILITY';
    } else if (cumIp != null && cumIp > 0) {
      riskStatus = 'NON_ZERO_IMPACT_PROBABILITY';
    } else {
      riskStatus = 'SENTRY_MONITORED_NO_CURRENT_PREDICTION';
    }

    const result = {
      sentryId: summary.des || des,
      sentryMonitored: true,
      impactProbability: cumIp,
      impactProbabilityDisplay: formatImpactProbability(cumIp),
      palermo: cumPalermo,
      palermoCumulative: cumPalermo,
      palermoMax: summary.ps_max != null ? Number(summary.ps_max) : null,
      palermoDescription: describePalermo(cumPalermo),
      torino: maxTorino,
      torinoMax: maxTorino,
      potentialImpacts,
      vImpact: summary.v_imp != null ? Number(summary.v_imp) : null,
      energy: summary.energy != null ? Number(summary.energy) : null,
      completeness: summary.completeness || null,
      lastObs: summary.last_obs || null,
      nImpactors: summary.n_imp || 0,
      riskStatus,
      source: 'NASA/JPL-CNEOS-SENTRY',
      apiVersionWarning: versionCheck.warning ? versionCheck : null,
      retrievedAt: new Date().toISOString()
    };

    setCache(cacheKey, result, 3600); // 1 hour
    return result;

  } catch (err) {
    // 404 or object not found = not in Sentry (not an error)
    if (err.response?.status === 404 || err.response?.status === 200) {
      setCache(cacheKey, null, 3600);
      return null;
    }
    console.error(`[Sentry] Error fetching risk for ${des}:`, err.message);
    throw err;
  }
}

/**
 * Fetch Sentry summary list — top monitored objects.
 * Used for the NEO risk dashboard and risk-summary endpoint.
 */
export async function getSentrySummary(limit = 50) {
  const cacheKey = `sentry:summary:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  try {
    const response = await axios.get(SENTRY_BASE, {
      params: { removed: 0, limit },
      timeout: 20000
    });

    const data = response.data;
    const versionCheck = validateSentryVersion(data.signature);
    const objects = (data.data || []).map(obj => ({
      designation: obj.des,
      name: obj.fullname || obj.des,
      probability: obj.ip != null ? Number(obj.ip) : null,
      probabilityDisplay: formatImpactProbability(obj.ip),
      palermoCumulative: obj.ps_cum != null ? Number(obj.ps_cum) : null,
      palermoMax: obj.ps_max != null ? Number(obj.ps_max) : null,
      torinoMax: obj.ts_max != null ? Number(obj.ts_max) : null,
      vImpact: obj.v_imp != null ? Number(obj.v_imp) : null,
      absoluteMagnitude: obj.h != null ? Number(obj.h) : null,
      firstImpactDate: obj.range ? obj.range.split('-')[0].trim() : null,
      lastImpactDate: obj.range ? obj.range.split('-').pop().trim() : null,
      nImpactors: obj.n_imp || 0,
      source: 'NASA/JPL-CNEOS-SENTRY'
    }));

    const result = {
      source: 'NASA/JPL-CNEOS-SENTRY',
      count: objects.length,
      objects,
      apiVersionWarning: versionCheck.warning ? versionCheck : null,
      generatedAt: new Date().toISOString()
    };

    setCache(cacheKey, result, 1800); // 30 min
    return result;

  } catch (err) {
    console.error('[Sentry] Error fetching summary:', err.message);
    throw err;
  }
}

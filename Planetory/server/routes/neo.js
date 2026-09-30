/**
 * neo.js — Full NEO Router (Part 35)
 * 
 * All /api/neo/* endpoints for the Planetory NEO Intelligence System.
 * Backed by NASA NeoWs, JPL SBDB, JPL CNEOS CAD, JPL Sentry, JPL Horizons.
 * 
 * Endpoints:
 *  GET /api/neo/feed                    — NASA NeoWs 7-day feed
 *  GET /api/neo/search?q=               — SBDB search by name/designation
 *  GET /api/neo/earth-approaches        — JPL CNEOS upcoming Earth approaches
 *  GET /api/neo/risk-summary            — Sentry monitored objects summary
 *  GET /api/neo/:id                     — Full NEO detail (SBDB + Sentry + CAD)
 *  GET /api/neo/:id/orbit               — Orbital elements only
 *  GET /api/neo/:id/close-approaches    — All close approaches for object
 *  GET /api/neo/:id/risk                — Sentry risk data for object
 *  GET /api/neo/:id/horizons            — JPL Horizons high-precision ephemeris
 */

import { Router } from 'express';
import {
  getNeoFeed,
  searchAsteroids,
  getNEODetail,
  getNEOOrbit,
  getNEOCloseApproaches,
  getEarthApproaches,
  getSentryRisk,
  getSentrySummary,
  getHorizonsPosition,
  getNEOCatalog
} from '../services/neoService.js';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setDataSourceHeader(res, source) {
  res.setHeader('X-Data-Source', source);
  res.setHeader('X-Planetory-Version', 'NEO-2.0');
}

function errorResponse(res, statusCode, message, source = 'unknown') {
  return res.status(statusCode).json({
    error: true,
    message,
    source,
    dataStatus: 'UNAVAILABLE',
    retrievedAt: new Date().toISOString()
  });
}

// ─── GET /api/neo/feed ────────────────────────────────────────────────────────

router.get('/feed', async (req, res) => {
  try {
    const data = await getNeoFeed();
    setDataSourceHeader(res, 'NASA-NeoWs');
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[NEO /feed]', err.message);
    errorResponse(res, 503, err.message, 'NASA-NeoWs');
  }
});

// ─── GET /api/neo/search ──────────────────────────────────────────────────────

router.get('/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q || q.length < 2) {
    return res.json({ source: 'JPL-SBDB', count: 0, objects: [], dataStatus: 'NO_QUERY' });
  }
  try {
    const data = await searchAsteroids(q);
    setDataSourceHeader(res, 'JPL-SBDB');
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[NEO /search]', err.message);
    errorResponse(res, 503, err.message, 'JPL-SBDB');
  }
});

// ─── GET /api/neo/catalog ─────────────────────────────────────────────────────

router.get('/catalog', async (req, res) => {
  const { group = 'neo', limit = 100, page = 1, q } = req.query;
  try {
    const data = await getNEOCatalog({ group, limit: Number(limit), page: Number(page), q });
    setDataSourceHeader(res, 'JPL-SBDB');
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[NEO /catalog]', err.message);
    errorResponse(res, 503, err.message, 'JPL-SBDB');
  }
});

// ─── GET /api/neo/earth-approaches ───────────────────────────────────────────

router.get('/earth-approaches', async (req, res) => {
  const {
    'dist-max': distMax = '0.05',
    'date-min': dateMin,
    'date-max': dateMax,
    limit = 100
  } = req.query;
  try {
    const data = await getEarthApproaches({ distMax, dateMin, dateMax, limit: Number(limit) });
    setDataSourceHeader(res, 'JPL-CNEOS-CAD');
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[NEO /earth-approaches]', err.message);
    errorResponse(res, 503, err.message, 'JPL-CNEOS-CAD');
  }
});

// ─── GET /api/neo/risk-summary ────────────────────────────────────────────────

router.get('/risk-summary', async (req, res) => {
  const { limit = 50 } = req.query;
  try {
    const data = await getSentrySummary(Number(limit));
    setDataSourceHeader(res, 'NASA/JPL-CNEOS-SENTRY');
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[NEO /risk-summary]', err.message);
    errorResponse(res, 503, err.message, 'NASA/JPL-CNEOS-SENTRY');
  }
});

// ─── GET /api/neo/:id ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getNEODetail(id);
    if (!data) return errorResponse(res, 404, `NEO not found: ${id}`, 'JPL-SBDB');
    setDataSourceHeader(res, 'JPL-SBDB+JPL-CNEOS-SENTRY+JPL-CNEOS-CAD');
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[NEO /${id}]`, err.message);
    errorResponse(res, 503, err.message, 'JPL-SBDB');
  }
});

// ─── GET /api/neo/:id/orbit ───────────────────────────────────────────────────

router.get('/:id/orbit', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getNEOOrbit(id);
    setDataSourceHeader(res, 'JPL-SBDB');
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[NEO /${id}/orbit]`, err.message);
    errorResponse(res, 503, err.message, 'JPL-SBDB');
  }
});

// ─── GET /api/neo/:id/close-approaches ───────────────────────────────────────

router.get('/:id/close-approaches', async (req, res) => {
  const { id } = req.params;
  const { 'dist-max': distMax = '0.3', limit = 50 } = req.query;
  try {
    const data = await getNEOCloseApproaches(id, { distMax, limit: Number(limit) });
    setDataSourceHeader(res, 'JPL-CNEOS-CAD');
    res.json({
      ...data,
      objectId: id,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[NEO /${id}/close-approaches]`, err.message);
    errorResponse(res, 503, err.message, 'JPL-CNEOS-CAD');
  }
});

// ─── GET /api/neo/:id/risk ────────────────────────────────────────────────────

router.get('/:id/risk', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getSentryRisk(id);
    setDataSourceHeader(res, 'NASA/JPL-CNEOS-SENTRY');
    if (!data) {
      return res.json({
        sentryMonitored: false,
        riskStatus: 'NO_SENTRY_RECORD',
        message: 'Object is not currently listed in the JPL CNEOS Sentry database.',
        source: 'NASA/JPL-CNEOS-SENTRY',
        dataStatus: 'LIVE',
        retrievedAt: new Date().toISOString()
      });
    }
    res.json({
      ...data,
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[NEO /${id}/risk]`, err.message);
    errorResponse(res, 503, err.message, 'NASA/JPL-CNEOS-SENTRY');
  }
});

// ─── GET /api/neo/:id/horizons ────────────────────────────────────────────────

router.get('/:id/horizons', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getHorizonsPosition(id);
    setDataSourceHeader(res, 'JPL-Horizons');
    res.json({
      ...data,
      positionLabel: 'JPL HORIZONS HIGH-PRECISION EPHEMERIS',
      dataStatus: data.fromCache ? 'CACHED' : 'LIVE',
      retrievedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[NEO /${id}/horizons]`, err.message);
    errorResponse(res, 503, err.message, 'JPL-Horizons');
  }
});

export default router;

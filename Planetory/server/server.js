import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import neoRouter from './routes/neo.js';
import planetsRouter from './routes/planets.js';
import {
  getAsteroidCatalog,
  searchAsteroids,
  getAsteroidDetail,
  getCloseApproaches,
  getHorizonsPosition
} from './services/spaceDataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from Planetory/.env or server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Primary routers
app.use('/api/neo', neoRouter);
app.use('/api/planets', planetsRouter);

// Asteroids endpoints (for spaceApi.js)
app.get('/api/asteroids', async (req, res) => {
  try {
    const { group = 'neo', limit = 200, page = 1, q } = req.query;
    const data = await getAsteroidCatalog({ group, limit: Number(limit), page: Number(page), q });
    res.json(data);
  } catch (err) {
    console.error('[API /asteroids]', err.message);
    res.status(500).json({ error: true, message: err.message });
  }
});

app.get('/api/asteroids/search', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const data = await searchAsteroids(q);
    res.json(data);
  } catch (err) {
    console.error('[API /asteroids/search]', err.message);
    res.status(500).json({ error: true, message: err.message });
  }
});

app.get('/api/asteroids/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getAsteroidDetail(id);
    res.json(data);
  } catch (err) {
    console.error(`[API /asteroids/${req.params.id}]`, err.message);
    res.status(500).json({ error: true, message: err.message });
  }
});

// Close approaches endpoint (for spaceApi.js)
app.get('/api/close-approaches', async (req, res) => {
  try {
    const { 'dist-max': distMax = '0.05', limit = 50 } = req.query;
    const data = await getCloseApproaches({ distMax, limit: Number(limit) });
    res.json(data);
  } catch (err) {
    console.error('[API /close-approaches]', err.message);
    res.status(500).json({ error: true, message: err.message });
  }
});

// Horizons ephemeris endpoint (for spaceApi.js)
app.get('/api/horizons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getHorizonsPosition(id);
    res.json(data);
  } catch (err) {
    console.error(`[API /horizons/${req.params.id}]`, err.message);
    res.status(500).json({ error: true, message: err.message });
  }
});

// System status healthcheck (for spaceApi.js)
app.get('/api/system/status', (req, res) => {
  res.json({
    online: true,
    version: '2.0.0',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Planetory backend server running on http://localhost:${PORT}`);
});

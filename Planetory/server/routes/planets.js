import { Router } from 'express';
import { PLANET_DATA } from '../../src/data/planets.js';

const router = Router();

/**
 * GET /api/planets
 * Returns planetary ephemeris data and physical properties
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    count: Object.keys(PLANET_DATA).length,
    data: Object.values(PLANET_DATA)
  });
});

export default router;

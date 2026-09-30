import { degToRad } from '../utils/units';

export const MOON_DATA = [
  // ── EARTH ──
  {
    id: 'moon',
    name: 'Moon',
    type: 'Natural Satellite',
    parent: 'earth',
    radiusKm: 1737.4,
    massKg: 7.342e22,
    a: 0.00257, // AU relative to Earth (~384,400 km)
    e: 0.0549,
    i: degToRad(5.145),
    orbitalPeriodDays: 27.321,
    rotationPeriodHours: 655.7,
    surfaceTempK: 250,
    albedo: 0.12,
    discovery: { date: 'Prehistoric', who: 'Known to Ancients' },
    texture: '/textures/mercurymap.jpg'
  },

  // ── MARS ──
  {
    id: 'phobos',
    name: 'Phobos',
    type: 'Natural Satellite',
    parent: 'mars',
    radiusKm: 11.26,
    massKg: 1.065e16,
    a: 0.0000627, // ~9,376 km
    e: 0.0151,
    i: degToRad(1.093),
    orbitalPeriodDays: 0.3189,
    discovery: { date: '1877-08-18', who: 'Asaph Hall', location: 'US Naval Observatory' }
  },
  {
    id: 'deimos',
    name: 'Deimos',
    type: 'Natural Satellite',
    parent: 'mars',
    radiusKm: 6.2,
    massKg: 1.476e15,
    a: 0.0001568, // ~23,463 km
    e: 0.0002,
    i: degToRad(0.93),
    orbitalPeriodDays: 1.263,
    discovery: { date: '1877-08-12', who: 'Asaph Hall', location: 'US Naval Observatory' }
  },

  // ── JUPITER (Galilean Moons) ──
  {
    id: 'io',
    name: 'Io',
    type: 'Natural Satellite',
    parent: 'jupiter',
    radiusKm: 1821.6,
    massKg: 8.931e22,
    a: 0.00282, // ~421,700 km
    e: 0.0041,
    i: degToRad(0.05),
    orbitalPeriodDays: 1.769,
    discovery: { date: '1610-01-08', who: 'Galileo Galilei' }
  },
  {
    id: 'europa',
    name: 'Europa',
    type: 'Natural Satellite',
    parent: 'jupiter',
    radiusKm: 1560.8,
    massKg: 4.800e22,
    a: 0.00448, // ~670,900 km
    e: 0.009,
    i: degToRad(0.47),
    orbitalPeriodDays: 3.551,
    discovery: { date: '1610-01-08', who: 'Galileo Galilei' }
  },
  {
    id: 'ganymede',
    name: 'Ganymede',
    type: 'Natural Satellite',
    parent: 'jupiter',
    radiusKm: 2634.1,
    massKg: 1.481e23,
    a: 0.00716, // ~1,070,400 km
    e: 0.0013,
    i: degToRad(0.2),
    orbitalPeriodDays: 7.155,
    discovery: { date: '1610-01-07', who: 'Galileo Galilei' }
  },
  {
    id: 'callisto',
    name: 'Callisto',
    type: 'Natural Satellite',
    parent: 'jupiter',
    radiusKm: 2410.3,
    massKg: 1.076e23,
    a: 0.01258, // ~1,882,700 km
    e: 0.0074,
    i: degToRad(0.28),
    orbitalPeriodDays: 16.689,
    discovery: { date: '1610-01-07', who: 'Galileo Galilei' }
  },

  // ── SATURN ──
  {
    id: 'titan',
    name: 'Titan',
    type: 'Natural Satellite',
    parent: 'saturn',
    radiusKm: 2574.7,
    massKg: 1.345e23,
    a: 0.00817, // ~1,221,870 km
    e: 0.0288,
    i: degToRad(0.348),
    orbitalPeriodDays: 15.945,
    discovery: { date: '1655-03-25', who: 'Christiaan Huygens' }
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    type: 'Natural Satellite',
    parent: 'saturn',
    radiusKm: 252.1,
    massKg: 1.080e20,
    a: 0.00159, // ~238,000 km
    e: 0.0047,
    i: degToRad(0.019),
    orbitalPeriodDays: 1.370,
    discovery: { date: '1789-08-28', who: 'William Herschel' }
  },
  {
    id: 'rhea',
    name: 'Rhea',
    type: 'Natural Satellite',
    parent: 'saturn',
    radiusKm: 763.8,
    massKg: 2.306e21,
    a: 0.00352, // ~527,108 km
    e: 0.0012,
    i: degToRad(0.345),
    orbitalPeriodDays: 4.518,
    discovery: { date: '1672-12-23', who: 'Giovanni Domenico Cassini' }
  },
  {
    id: 'iapetus',
    name: 'Iapetus',
    type: 'Natural Satellite',
    parent: 'saturn',
    radiusKm: 734.5,
    massKg: 1.805e21,
    a: 0.0238, // ~3,560,820 km
    e: 0.0286,
    i: degToRad(15.47),
    orbitalPeriodDays: 79.321,
    discovery: { date: '1671-10-25', who: 'Giovanni Domenico Cassini' }
  },

  // ── URANUS ──
  {
    id: 'titania',
    name: 'Titania',
    type: 'Natural Satellite',
    parent: 'uranus',
    radiusKm: 788.4,
    massKg: 3.527e21,
    a: 0.00291, // ~435,910 km
    e: 0.0011,
    i: degToRad(0.34),
    orbitalPeriodDays: 8.706,
    discovery: { date: '1787-01-11', who: 'William Herschel' }
  },
  {
    id: 'oberon',
    name: 'Oberon',
    type: 'Natural Satellite',
    parent: 'uranus',
    radiusKm: 761.4,
    massKg: 3.014e21,
    a: 0.00390, // ~583,520 km
    e: 0.0014,
    i: degToRad(0.05),
    orbitalPeriodDays: 13.463,
    discovery: { date: '1787-01-11', who: 'William Herschel' }
  },

  // ── NEPTUNE ──
  {
    id: 'triton',
    name: 'Triton',
    type: 'Natural Satellite',
    parent: 'neptune',
    radiusKm: 1353.4,
    massKg: 2.140e22,
    a: 0.00237, // ~354,759 km
    e: 0.000016,
    i: degToRad(156.885), // Retrograde
    orbitalPeriodDays: -5.877, // Retrograde
    discovery: { date: '1846-10-10', who: 'William Lassell' }
  }
];

/**
 * CelestialVisuals — Central visual configuration for all celestial bodies.
 *
 * texture: path in /public/textures/ (Vite serves these at runtime as /textures/...)
 * proceduralId: fallback key for ProceduralTextureFactory if texture fails/missing
 * fallbackColor: THREE hex color for last-resort fallback
 * roughness / metalness: PBR surface properties
 * emissive: for self-glowing bodies (Sun)
 * hasAtmosphere / atmosphereColor / atmosphereOpacity: atmospheric shell
 * hasClouds / cloudTexture: rotating cloud layer
 * hasRings: ring system
 * ringTexture: path to ring texture
 * ringInner / ringOuter: ring radii multipliers of planet radius
 * segments: sphere geometry quality (widthSeg, heightSeg)
 */

export const CELESTIAL_VISUALS = {

  // ─── STAR ─────────────────────────────────────────────────────────────────────
  sun: {
    texture: null,               // Use procedural for best effect
    proceduralId: 'sun',
    fallbackColor: 0xfff5a0,
    roughness: 1.0,
    metalness: 0.0,
    emissive: true,
    emissiveColor: 0xffaa00,
    emissiveIntensity: 1.0,
    segments: 64,
    textureStatus: 'PROCEDURAL'
  },

  // ─── TERRESTRIAL PLANETS ──────────────────────────────────────────────────────
  mercury: {
    texture: '/textures/mercurymap.jpg',
    proceduralId: 'mercury',
    fallbackColor: 0xb0906a,
    roughness: 0.95,
    metalness: 0.0,
    segments: 48,
    textureStatus: 'LOADING'
  },

  venus: {
    texture: '/textures/venusmap.jpg',
    proceduralId: 'venus',
    fallbackColor: 0xc8901a,
    roughness: 0.9,
    metalness: 0.0,
    hasAtmosphere: true,
    atmosphereColor: 0xffcc66,
    atmosphereOpacity: 0.18,
    segments: 48,
    textureStatus: 'LOADING'
  },

  earth: {
    texture: '/textures/earth1.jpg',
    proceduralId: 'earth',
    fallbackColor: 0x1a6b3c,
    roughness: 0.7,
    metalness: 0.0,
    hasAtmosphere: true,
    atmosphereColor: 0x4488ff,
    atmosphereOpacity: 0.15,
    hasClouds: true,
    cloudTexture: '/textures/earth_clouds.jpg',   // generated procedurally if missing
    cloudProceduralId: 'earthClouds',
    segments: 64,
    textureStatus: 'LOADING'
  },

  mars: {
    texture: '/textures/marsmap1k.jpg',
    proceduralId: 'mars',
    fallbackColor: 0xc1440e,
    roughness: 0.95,
    metalness: 0.0,
    hasAtmosphere: true,
    atmosphereColor: 0xff8844,
    atmosphereOpacity: 0.06,
    segments: 48,
    textureStatus: 'LOADING'
  },

  // ─── GAS GIANTS ───────────────────────────────────────────────────────────────
  jupiter: {
    texture: '/textures/jupitermap.jpg',
    proceduralId: 'jupiter',
    fallbackColor: 0xc88b3a,
    roughness: 0.85,
    metalness: 0.0,
    segments: 48,
    textureStatus: 'LOADING'
  },

  saturn: {
    texture: '/textures/saturn_prime.jpg',
    proceduralId: 'saturn',
    fallbackColor: 0xead6a0,
    roughness: 0.85,
    metalness: 0.0,
    hasRings: true,
    ringTexture: '/textures/saturnring.png',       // generated procedurally if missing
    ringProceduralId: 'saturnRing',
    ringInner: 1.35,
    ringOuter: 2.45,
    ringTilt: Math.PI / 2.2,
    segments: 48,
    textureStatus: 'LOADING'
  },

  // ─── ICE GIANTS ───────────────────────────────────────────────────────────────
  uranus: {
    texture: '/textures/uranusmap.jpg',            // existing file is very small — procedural preferred
    proceduralId: 'uranus',
    fallbackColor: 0x7de8e8,
    roughness: 0.75,
    metalness: 0.0,
    hasAtmosphere: true,
    atmosphereColor: 0x44dddd,
    atmosphereOpacity: 0.12,
    preferProcedural: true,                        // prefer procedural because uranusmap.jpg is 8KB stub
    segments: 48,
    textureStatus: 'LOADING'
  },

  neptune: {
    texture: '/textures/neptunemap.jpg',           // existing file is 48KB — may be low quality
    proceduralId: 'neptune',
    fallbackColor: 0x2255cc,
    roughness: 0.75,
    metalness: 0.0,
    hasAtmosphere: true,
    atmosphereColor: 0x2244bb,
    atmosphereOpacity: 0.14,
    segments: 48,
    textureStatus: 'LOADING'
  },

  // ─── DWARF PLANETS ────────────────────────────────────────────────────────────
  pluto: {
    texture: '/textures/plutomap1k.jpg',
    proceduralId: 'pluto',
    fallbackColor: 0xb09870,
    roughness: 0.95,
    metalness: 0.0,
    segments: 32,
    textureStatus: 'LOADING'
  },

  // ─── EARTH'S MOON ─────────────────────────────────────────────────────────────
  moon: {
    texture: '/textures/moonmap.jpg',
    proceduralId: 'moon',
    fallbackColor: 0x888880,
    roughness: 0.95,
    metalness: 0.0,
    segments: 32,
    textureStatus: 'LOADING'
  },

  // ─── MARS MOONS ───────────────────────────────────────────────────────────────
  phobos: {
    texture: null,
    proceduralId: 'phobos',
    fallbackColor: 0x6b4c36,
    roughness: 1.0,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },
  deimos: {
    texture: null,
    proceduralId: 'deimos',
    fallbackColor: 0x5a4535,
    roughness: 1.0,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },

  // ─── JUPITER'S GALILEAN MOONS ──────────────────────────────────────────────────
  io: {
    texture: '/textures/iomap.jpg',
    proceduralId: 'io',
    fallbackColor: 0xd4b020,
    roughness: 0.9,
    metalness: 0.0,
    segments: 32,
    textureStatus: 'LOADING'
  },
  europa: {
    texture: '/textures/europamap.jpg',
    proceduralId: 'europa',
    fallbackColor: 0xd8dce8,
    roughness: 0.7,
    metalness: 0.0,
    segments: 32,
    textureStatus: 'LOADING'
  },
  ganymede: {
    texture: '/textures/ganymedemap.jpg',
    proceduralId: 'ganymede',
    fallbackColor: 0x8a8878,
    roughness: 0.9,
    metalness: 0.0,
    segments: 32,
    textureStatus: 'LOADING'
  },
  callisto: {
    texture: '/textures/callistomap.jpg',
    proceduralId: 'callisto',
    fallbackColor: 0x403830,
    roughness: 1.0,
    metalness: 0.0,
    segments: 32,
    textureStatus: 'LOADING'
  },

  // ─── SATURN'S MAJOR MOONS ─────────────────────────────────────────────────────
  mimas: {
    texture: null,
    proceduralId: 'mimas',
    fallbackColor: 0xb8b8b0,
    roughness: 0.9,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },
  enceladus: {
    texture: null,
    proceduralId: 'enceladus',
    fallbackColor: 0xecf0fc,
    roughness: 0.6,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  },
  tethys: {
    texture: null,
    proceduralId: 'tethys',
    fallbackColor: 0xc8ccd8,
    roughness: 0.75,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  },
  dione: {
    texture: null,
    proceduralId: 'dione',
    fallbackColor: 0xb8bcc8,
    roughness: 0.8,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  },
  rhea: {
    texture: null,
    proceduralId: 'rhea',
    fallbackColor: 0xc0c4d0,
    roughness: 0.8,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  },
  titan: {
    texture: '/textures/titanmap.jpg',
    proceduralId: 'titan',
    fallbackColor: 0xc06020,
    roughness: 0.85,
    metalness: 0.0,
    hasAtmosphere: true,
    atmosphereColor: 0xff8822,
    atmosphereOpacity: 0.25,
    segments: 32,
    textureStatus: 'LOADING'
  },
  iapetus: {
    texture: null,
    proceduralId: 'iapetus',
    fallbackColor: 0xa09080,
    roughness: 0.9,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  },

  // ─── URANIAN MOONS ────────────────────────────────────────────────────────────
  miranda: {
    texture: null,
    proceduralId: 'miranda',
    fallbackColor: 0xa0a8b4,
    roughness: 0.9,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },
  ariel: {
    texture: null,
    proceduralId: 'ariel',
    fallbackColor: 0xb8c0cc,
    roughness: 0.85,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },
  umbriel: {
    texture: null,
    proceduralId: 'umbriel',
    fallbackColor: 0x404850,
    roughness: 1.0,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },
  titania: {
    texture: null,
    proceduralId: 'titania',
    fallbackColor: 0x9098a8,
    roughness: 0.9,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },
  oberon: {
    texture: null,
    proceduralId: 'oberon',
    fallbackColor: 0x505860,
    roughness: 0.95,
    metalness: 0.0,
    segments: 16,
    textureStatus: 'PROCEDURAL'
  },

  // ─── NEPTUNIAN MOONS ──────────────────────────────────────────────────────────
  triton: {
    texture: null,
    proceduralId: 'triton',
    fallbackColor: 0xc8dcc8,
    roughness: 0.7,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  },

  // ─── PLUTO SYSTEM ─────────────────────────────────────────────────────────────
  charon: {
    texture: null,
    proceduralId: 'charon',
    fallbackColor: 0x708090,
    roughness: 0.9,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  }
};

/**
 * Get visual config for an object, with safe defaults.
 */
export function getVisualConfig(id) {
  return CELESTIAL_VISUALS[id] || {
    texture: null,
    proceduralId: id,
    fallbackColor: 0x888888,
    roughness: 0.9,
    metalness: 0.0,
    segments: 24,
    textureStatus: 'PROCEDURAL'
  };
}

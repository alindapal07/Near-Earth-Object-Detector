/**
 * ProceduralTextureFactory
 * Generates scientifically-themed canvas textures for celestial bodies.
 * Used as high-quality fallbacks when image files are unavailable.
 * All textures are deterministic based on object ID.
 */
import * as THREE from 'three';

export default class ProceduralTextureFactory {
  constructor() {
    this._cache = new Map();
  }

  /**
   * Get a procedural texture for a known celestial body.
   * Returns a THREE.CanvasTexture immediately (no async).
   */
  getProceduralTexture(id) {
    if (this._cache.has(id)) return this._cache.get(id);
    const tex = this._generate(id);
    this._cache.set(id, tex);
    return tex;
  }

  _generate(id) {
    switch (id) {
      case 'sun':       return this._makeSun();
      // ─── Planets ─────────────────────────────────────────────────────────────
      case 'mercury':   return this._makeMercury();
      case 'venus':     return this._makeVenus();
      case 'earth':     return this._makeEarth();
      case 'mars':      return this._makeMars();
      case 'jupiter':   return this._makeJupiter();
      case 'saturn':    return this._makeSaturn();
      case 'uranus':    return this._makeUranus();
      case 'neptune':   return this._makeNeptune();
      case 'pluto':     return this._makePluto();
      // ─── Moons ───────────────────────────────────────────────────────────────
      case 'moon':      return this._makeMoon();
      case 'phobos':    return this._makeRocky(0x6b4c36, 0x3d2b1f, 12);
      case 'deimos':    return this._makeRocky(0x5a4535, 0x3a2c22, 10);
      case 'io':        return this._makeIo();
      case 'europa':    return this._makeEuropa();
      case 'ganymede':  return this._makeGanymede();
      case 'callisto':  return this._makeCallisto();
      case 'mimas':     return this._makeRocky(0xc8c8c8, 0x888888, 8, true);
      case 'enceladus': return this._makeIcy(0xf0f4ff, 0xdde8ff);
      case 'tethys':    return this._makeIcy(0xd8dce8, 0xb8bcc8);
      case 'dione':     return this._makeIcy(0xbcc0cc, 0x9aa0b0);
      case 'rhea':      return this._makeIcy(0xc0c4d0, 0xa0a8b8);
      case 'titan':     return this._makeTitan();
      case 'iapetus':   return this._makeIapetus();
      case 'miranda':   return this._makeRocky(0xb0b8c8, 0x708090, 6, true);
      case 'ariel':     return this._makeIcy(0xc8cce0, 0x9096b0);
      case 'umbriel':   return this._makeRocky(0x404550, 0x282c30, 8);
      case 'titania':   return this._makeIcy(0xa8b0c0, 0x8090a0);
      case 'oberon':    return this._makeRocky(0x505860, 0x303840, 10);
      case 'triton':    return this._makeIcy(0xd8ecd8, 0xa8c8b0);
      case 'charon':    return this._makeRocky(0x707880, 0x505860, 7, true);
      // ─── Ring textures ────────────────────────────────────────────────────────
      case 'earthClouds': return this._makeEarthClouds();
      case 'saturnRing':  return this._makeSaturnRingTex();
      default:          return this._makeRocky(0x909090, 0x606060, 8);
    }
  }

  // ─── Sun ────────────────────────────────────────────────────────────────────
  _makeSun() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base warm yellow
    const bg = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    bg.addColorStop(0.0,  '#fff5cc');
    bg.addColorStop(0.3,  '#ffdd66');
    bg.addColorStop(0.7,  '#ff9900');
    bg.addColorStop(1.0,  '#cc6600');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Solar granulation noise
    const rng = this._seededRng(42);
    for (let i = 0; i < 2000; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 2 + rng() * 8;
      const brightness = 0.6 + rng() * 0.4;
      ctx.globalAlpha = 0.15 + rng() * 0.25;
      ctx.fillStyle = `hsl(45, 100%, ${Math.round(brightness * 90)}%)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Sunspot areas
    for (let i = 0; i < 6; i++) {
      const sx = 60 + rng() * (size - 120);
      const sy = size * 0.3 + rng() * size * 0.4;
      const sr = 8 + rng() * 20;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#993300';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Moon ────────────────────────────────────────────────────────────────────
  _makeMoon() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#a0a090';
    ctx.fillRect(0, 0, size, size);
    this._addNoise(ctx, size, 0xb8b8a8, 0.3, 40, 80, 20);
    this._addPatches(ctx, size, '#606068', 5, 30, 80);
    this._addCraters(ctx, size, 25, '#888880', '#c0c0b8', '#70706a');

    return this._toTexture(canvas);
  }

  // ─── Mercury (grey rocky cratered) ───────────────────────────────────────────
  _makeMercury() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9c8c80';
    ctx.fillRect(0, 0, size, size);
    this._addNoise(ctx, size, 0xb0a090, 0.35, 40, 100, 25);
    this._addPatches(ctx, size, '#707060', 6, 20, 70);
    this._addCraters(ctx, size, 30, '#a09080', '#c8baa8', '#706050');

    return this._toTexture(canvas);
  }

  // ─── Venus (thick yellow-orange atmosphere) ───────────────────────────────────
  _makeVenus() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base pale yellow
    ctx.fillStyle = '#d4b060';
    ctx.fillRect(0, 0, size, size);

    // Swirling sulfuric cloud patterns
    const rng = this._seededRng(99);
    for (let i = 0; i < 12; i++) {
      const y = rng() * size;
      const h = 20 + rng() * 60;
      const opacity = 0.1 + rng() * 0.25;
      ctx.globalAlpha = opacity;
      const shade = rng() > 0.5 ? '#c89840' : '#e8c870';
      ctx.fillStyle = shade;
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;
    this._addNoise(ctx, size, 0xe0c060, 0.25, 30, 120, 20);

    return this._toTexture(canvas);
  }

  // ─── Earth (blue oceans + green/brown land) ───────────────────────────────────
  _makeEarth() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Ocean base
    ctx.fillStyle = '#1a5090';
    ctx.fillRect(0, 0, size, size);

    // Landmasses (rough continents)
    const landPatches = [
      { x: 220, y: 150, r: 80 }, { x: 310, y: 180, r: 60 }, { x: 140, y: 250, r: 70 },
      { x: 380, y: 280, r: 55 }, { x: 60, y: 300, r: 50 }, { x: 460, y: 150, r: 45 },
      { x: 100, y: 100, r: 65 }, { x: 400, y: 380, r: 60 }
    ];
    ctx.fillStyle = '#4a8040';
    landPatches.forEach(p => {
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Desert areas
    this._addPatches(ctx, size, '#c8a060', 4, 20, 50);
    // Ice caps
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#e8f0ff';
    ctx.fillRect(0, 0, size, 30);         // North pole
    ctx.fillRect(0, size - 25, size, 25); // South pole (smaller)
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Earth Clouds (white wispy alpha texture) ─────────────────────────────────
  _makeEarthClouds() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    const rng = this._seededRng(55);
    for (let i = 0; i < 80; i++) {
      const x = rng() * size; const y = rng() * size;
      const rx = 20 + rng() * 80; const ry = 8 + rng() * 30;
      ctx.globalAlpha = 0.3 + rng() * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Mars (reddish-orange rocky) ─────────────────────────────────────────────
  _makeMars() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#c14412';
    ctx.fillRect(0, 0, size, size);
    this._addNoise(ctx, size, 0xd06028, 0.4, 30, 100, 30);
    this._addPatches(ctx, size, '#902010', 5, 20, 80);
    this._addPatches(ctx, size, '#e08050', 8, 15, 60);
    // Polar ice
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#f0e8e0';
    ctx.fillRect(0, 0, size, 20);
    ctx.fillRect(0, size - 15, size, 15);
    ctx.globalAlpha = 1;
    this._addCraters(ctx, size, 12, '#a03810', '#d87050', '#801808');

    return this._toTexture(canvas);
  }

  // ─── Jupiter (atmospheric bands) ─────────────────────────────────────────────
  _makeJupiter() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base orange-brown
    ctx.fillStyle = '#c88b3a';
    ctx.fillRect(0, 0, size, size);

    // Atmospheric bands (horizontal stripes)
    const bands = [
      { y: 0.05, h: 0.04, color: '#e8c090', opacity: 0.7 },
      { y: 0.12, h: 0.06, color: '#a06020', opacity: 0.6 },
      { y: 0.20, h: 0.08, color: '#d4a060', opacity: 0.65 },
      { y: 0.30, h: 0.05, color: '#805020', opacity: 0.55 },
      { y: 0.37, h: 0.09, color: '#e0b870', opacity: 0.6 },
      { y: 0.48, h: 0.04, color: '#c07030', opacity: 0.7 },
      { y: 0.54, h: 0.07, color: '#d8a858', opacity: 0.65 },
      { y: 0.63, h: 0.05, color: '#905830', opacity: 0.6 },
      { y: 0.70, h: 0.08, color: '#e0c080', opacity: 0.55 },
      { y: 0.80, h: 0.06, color: '#b07040', opacity: 0.65 },
      { y: 0.88, h: 0.04, color: '#d09050', opacity: 0.6 },
    ];

    bands.forEach(b => {
      ctx.globalAlpha = b.opacity;
      ctx.fillStyle = b.color;
      ctx.fillRect(0, b.y * size, size, b.h * size);
    });
    ctx.globalAlpha = 1;

    // Great Red Spot
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#c03010';
    ctx.beginPath(); ctx.ellipse(320, 220, 40, 22, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#e05020';
    ctx.beginPath(); ctx.ellipse(320, 218, 30, 15, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Saturn (pale gold with subtle bands) ────────────────────────────────────
  _makeSaturn() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#d4b870';
    ctx.fillRect(0, 0, size, size);

    const rng = this._seededRng(17);
    for (let i = 0; i < 20; i++) {
      const y = rng() * size;
      const h = 5 + rng() * 25;
      ctx.globalAlpha = 0.15 + rng() * 0.25;
      ctx.fillStyle = rng() > 0.5 ? '#c0a050' : '#e8d090';
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;
    this._addNoise(ctx, size, 0xe0c878, 0.15, 40, 120, 15);

    return this._toTexture(canvas);
  }

  // ─── Uranus (cyan-blue smooth) ────────────────────────────────────────────────
  _makeUranus() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.0, '#a0eef0');
    grad.addColorStop(0.3, '#7de0e8');
    grad.addColorStop(0.6, '#68d8e4');
    grad.addColorStop(0.8, '#7de0e8');
    grad.addColorStop(1.0, '#a0eef0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Very subtle horizontal banding
    const rng = this._seededRng(22);
    for (let i = 0; i < 8; i++) {
      const y = rng() * size;
      const h = 3 + rng() * 15;
      ctx.globalAlpha = 0.06 + rng() * 0.08;
      ctx.fillStyle = rng() > 0.5 ? '#50c8d0' : '#c0f4f8';
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Neptune (deeper blue with storm bands) ───────────────────────────────────
  _makeNeptune() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.0, '#2855bb');
    grad.addColorStop(0.35, '#2244a8');
    grad.addColorStop(0.65, '#1c3899');
    grad.addColorStop(1.0, '#2855bb');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Stormy streaks
    const rng = this._seededRng(31);
    for (let i = 0; i < 15; i++) {
      const y = rng() * size;
      const h = 4 + rng() * 25;
      ctx.globalAlpha = 0.15 + rng() * 0.3;
      ctx.fillStyle = rng() > 0.6 ? '#1030aa' : '#4070dd';
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;

    // Great Dark Spot
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#101880';
    ctx.beginPath(); ctx.ellipse(180, 200, 35, 20, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Pluto (pale brown mottled) ───────────────────────────────────────────────
  _makePluto() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b09878';
    ctx.fillRect(0, 0, size, size);
    this._addNoise(ctx, size, 0xc8b090, 0.35, 30, 90, 25);
    this._addPatches(ctx, size, '#786050', 5, 20, 70);

    // Tombaugh Regio (heart-shaped bright region)
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#e0d8c8';
    ctx.beginPath(); ctx.ellipse(260, 250, 70, 55, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Saturn Ring Texture ──────────────────────────────────────────────────────
  _makeSaturnRingTex() {
    const width = 512; const height = 8;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');

    const bands = [
      { s: 0.00, e: 0.05, r: 60,  g: 50, b: 40,  a: 0.2  },
      { s: 0.05, e: 0.35, r: 220, g: 200, b: 170, a: 0.85 },
      { s: 0.35, e: 0.42, r: 30,  g: 25, b: 20,  a: 0.08 },
      { s: 0.42, e: 0.70, r: 190, g: 175, b: 150, a: 0.70 },
      { s: 0.70, e: 0.82, r: 90,  g: 80, b: 65,  a: 0.25 },
      { s: 0.82, e: 1.00, r: 50,  g: 45, b: 35,  a: 0.08 },
    ];
    bands.forEach(b => {
      const x0 = Math.round(b.s * width); const x1 = Math.round(b.e * width);
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0,   `rgba(${b.r},${b.g},${b.b},${b.a * 0.6})`);
      g.addColorStop(0.5, `rgba(${b.r},${b.g},${b.b},${b.a})`);
      g.addColorStop(1,   `rgba(${b.r},${b.g},${b.b},${b.a * 0.6})`);
      ctx.fillStyle = g;
      ctx.fillRect(x0, 0, x1 - x0, height);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  }

  // ─── Io (volcanic yellow-orange) ─────────────────────────────────────────────
  _makeIo() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Sulfurous yellow-orange base
    ctx.fillStyle = '#e8c840';
    ctx.fillRect(0, 0, size, size);

    // Orange and red volcanic patches
    this._addPatches(ctx, size, '#cc4400', 8, 20, 70);
    this._addPatches(ctx, size, '#ff8800', 10, 15, 50);
    this._addPatches(ctx, size, '#884400', 6, 10, 40);
    this._addPatches(ctx, size, '#ffe060', 12, 20, 60);

    // Volcanic calderas (dark spots with bright rings)
    const rng = this._seededRng(73);
    for (let i = 0; i < 15; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 8 + rng() * 25;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#220000';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Europa (icy with fractures) ──────────────────────────────────────────────
  _makeEuropa() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Bright icy white base
    ctx.fillStyle = '#e8ecf4';
    ctx.fillRect(0, 0, size, size);

    // Subtle warm variations
    this._addNoise(ctx, size, 0xd8dce8, 0.25, 60, 100, 30);

    // Characteristic fracture lines
    const rng = this._seededRng(88);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 60; i++) {
      const x1 = rng() * size; const y1 = rng() * size;
      const x2 = x1 + (rng() - 0.5) * 200; const y2 = y1 + (rng() - 0.5) * 200;
      ctx.globalAlpha = 0.3 + rng() * 0.3;
      const brown = Math.round(100 + rng() * 60);
      ctx.strokeStyle = `rgb(${brown + 20}, ${brown - 10}, ${brown - 30})`;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Ganymede (icy/rocky mix) ─────────────────────────────────────────────────
  _makeGanymede() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808878';
    ctx.fillRect(0, 0, size, size);
    this._addNoise(ctx, size, 0x989c90, 0.35, 40, 100, 30);
    this._addPatches(ctx, size, '#b8c0b0', 8, 20, 80);
    this._addPatches(ctx, size, '#585c50', 6, 15, 60);
    this._addCraters(ctx, size, 10, '#b0b4a8', '#c8ccc0', '#707868');

    return this._toTexture(canvas);
  }

  // ─── Callisto (dark heavily cratered) ─────────────────────────────────────────
  _makeCallisto() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3c3830';
    ctx.fillRect(0, 0, size, size);
    this._addNoise(ctx, size, 0x4a4540, 0.3, 30, 60, 20);
    this._addCraters(ctx, size, 35, '#606060', '#c0b890', '#282420');

    return this._toTexture(canvas);
  }

  // ─── Titan (orange-brown hazy) ───────────────────────────────────────────────
  _makeTitan() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Orange hazy atmosphere base
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#c87840');
    grad.addColorStop(0.3, '#a05828');
    grad.addColorStop(0.7, '#884420');
    grad.addColorStop(1, '#603018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    this._addNoise(ctx, size, 0xb06030, 0.4, 50, 120, 20);
    // Horizontal banding (thick atmosphere layers)
    const rng = this._seededRng(33);
    for (let i = 0; i < 8; i++) {
      const y = rng() * size;
      const h = 5 + rng() * 30;
      ctx.globalAlpha = 0.15 + rng() * 0.2;
      ctx.fillStyle = i % 2 === 0 ? '#d09050' : '#603020';
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;

    return this._toTexture(canvas);
  }

  // ─── Iapetus (strong dark/light contrast) ────────────────────────────────────
  _makeIapetus() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Icy white trailing hemisphere
    ctx.fillStyle = '#d8d0c0';
    ctx.fillRect(0, 0, size, size);

    // Dark leading hemisphere (Cassini Regio)
    const darkGrad = ctx.createLinearGradient(0, 0, size * 0.55, 0);
    darkGrad.addColorStop(0, 'rgba(20, 16, 12, 0.95)');
    darkGrad.addColorStop(0.4, 'rgba(20, 16, 12, 0.90)');
    darkGrad.addColorStop(0.6, 'rgba(20, 16, 12, 0.4)');
    darkGrad.addColorStop(1, 'rgba(20, 16, 12, 0.0)');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, size, size);

    this._addCraters(ctx, size, 15, '#c8c0b0', '#e0d8c8', '#a09888');

    return this._toTexture(canvas);
  }

  // ─── Generic Icy Moon ─────────────────────────────────────────────────────────
  _makeIcy(baseHex, varHex) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const baseColor = `#${new THREE.Color(baseHex).getHexString()}`;
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    this._addNoise(ctx, size, varHex, 0.25, 20, 60, 15);
    this._addCraters(ctx, size, 8, baseColor, `#${new THREE.Color(Math.min(0xffffff, baseHex + 0x202020)).getHexString()}`, `#${new THREE.Color(Math.max(0, baseHex - 0x202020)).getHexString()}`);

    return this._toTexture(canvas);
  }

  // ─── Generic Rocky Moon ───────────────────────────────────────────────────────
  _makeRocky(baseHex, darkHex, craterCount, isCratered = false) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const baseColor = `#${new THREE.Color(baseHex).getHexString()}`;
    const darkColor = `#${new THREE.Color(darkHex).getHexString()}`;
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    this._addNoise(ctx, size, darkHex, 0.3, 20, 50, 15);

    const craters = isCratered ? craterCount * 2 : craterCount;
    this._addCraters(ctx, size, craters, baseColor, `#${new THREE.Color(Math.min(0xffffff, baseHex + 0x303030)).getHexString()}`, darkColor);

    return this._toTexture(canvas);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _addNoise(ctx, size, colorHex, alpha, minR, maxR, count) {
    const color = `#${new THREE.Color(colorHex).getHexString()}`;
    const rng = this._seededRng(colorHex);
    for (let i = 0; i < count; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = minR + rng() * (maxR - minR);
      ctx.globalAlpha = alpha * (0.5 + rng() * 0.5);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _addPatches(ctx, size, color, count, minR, maxR) {
    const rng = this._seededRng(color.charCodeAt(1) + color.charCodeAt(2));
    for (let i = 0; i < count; i++) {
      const x = rng() * size; const y = rng() * size;
      const r = minR + rng() * (maxR - minR);
      ctx.globalAlpha = 0.3 + rng() * 0.5;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _addCraters(ctx, size, count, rimColor, brightColor, darkColor) {
    const rng = this._seededRng(count * 17 + size);
    for (let i = 0; i < count; i++) {
      const x = rng() * size; const y = rng() * size;
      const r = 4 + rng() * 20;

      // Crater shadow
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = darkColor;
      ctx.beginPath(); ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2); ctx.fill();

      // Crater floor
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = rimColor;
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();

      // Bright rim
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = brightColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /** Simple seeded pseudo-random generator (mulberry32) */
  _seededRng(seed) {
    let s = typeof seed === 'number' ? seed : String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  _toTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  dispose() {
    this._cache.forEach(t => t.dispose());
    this._cache.clear();
  }
}

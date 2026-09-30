/**
 * TextureManager — Central texture loading, caching, and status system.
 *
 * Texture lifecycle states:
 *   LOADING    → actively fetching
 *   READY      → loaded image texture
 *   PROCEDURAL → generated from ProceduralTextureFactory
 *   FALLBACK   → solid color canvas (last resort)
 *   ERROR      → load failed, using fallback
 */
import * as THREE from 'three';
import ProceduralTextureFactory from './ProceduralTextureFactory';

export default class TextureManager {
  constructor(renderer = null) {
    this.loader = new THREE.TextureLoader();
    this.cache = new Map();            // url/key → THREE.Texture
    this.statusMap = new Map();        // objectId → status string
    this.inFlight = new Map();         // url → Promise<Texture>
    this.procedural = new ProceduralTextureFactory();
    // Max anisotropy for sharper texture rendering on tilted surfaces
    this._maxAnisotropy = renderer
      ? renderer.capabilities.getMaxAnisotropy()
      : 4;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Load a texture from a URL. Returns a Promise<THREE.Texture>.
   * On failure, uses procedural (if proceduralId provided) then solid color fallback.
   *
   * @param {string|null} url             Path under /public e.g. '/textures/earth1.jpg'
   * @param {number}      fallbackColor   THREE hex color for last resort
   * @param {string}      objectId        Object ID for status tracking
   * @param {string|null} proceduralId    ProceduralTextureFactory key
   * @param {boolean}     preferProcedural Skip file load and go straight to procedural
   * @returns {Promise<THREE.Texture>}
   */
  async loadTexture(url, fallbackColor = 0x888888, objectId = '', proceduralId = null, preferProcedural = false) {

    // A: Prefer procedural over file texture (e.g. Uranus stub file)
    if (preferProcedural && proceduralId) {
      const tex = this.procedural.getProceduralTexture(proceduralId);
      this.statusMap.set(objectId, 'PROCEDURAL');
      return tex;
    }

    // B: No URL → go procedural/fallback immediately
    if (!url) {
      if (proceduralId) {
        const tex = this.procedural.getProceduralTexture(proceduralId);
        this.statusMap.set(objectId, 'PROCEDURAL');
        return tex;
      }
      const tex = this._makeSolidTexture(fallbackColor);
      this.statusMap.set(objectId, 'FALLBACK');
      return tex;
    }

    // C: Cached result
    if (this.cache.has(url)) {
      this.statusMap.set(objectId, this.cache.get(url)._isProc ? 'PROCEDURAL' : 'READY');
      return this.cache.get(url);
    }

    // D: Deduplicate in-flight
    if (this.inFlight.has(url)) {
      this.statusMap.set(objectId, 'LOADING');
      const tex = await this.inFlight.get(url);
      this.statusMap.set(objectId, tex._isProc ? 'PROCEDURAL' : 'READY');
      return tex;
    }

    // E: Start fresh load
    this.statusMap.set(objectId, 'LOADING');

    const promise = new Promise((resolve) => {
      this.loader.load(
        url,
        (tex) => {
          // Success
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.anisotropy = this._maxAnisotropy;
          tex._isProc = false;
          this.cache.set(url, tex);
          this.inFlight.delete(url);
          resolve(tex);
        },
        undefined,
        (_err) => {
          // Failure → try procedural then solid fallback
          console.warn(`[TextureManager] Failed: ${url} (id=${objectId}) — using ${proceduralId ? 'procedural' : 'fallback'}`);
          let fallback;
          if (proceduralId) {
            fallback = this.procedural.getProceduralTexture(proceduralId);
            fallback._isProc = true;
          } else {
            fallback = this._makeSolidTexture(fallbackColor);
            fallback._isProc = true;
          }
          this.cache.set(url, fallback);
          this.inFlight.delete(url);
          resolve(fallback);
        }
      );
    });

    this.inFlight.set(url, promise);
    const result = await promise;
    this.statusMap.set(objectId, result._isProc ? (proceduralId ? 'PROCEDURAL' : 'FALLBACK') : 'READY');
    return result;
  }

  /**
   * Synchronously retrieve a procedural texture.
   * Does NOT attempt file load.
   */
  getProcedural(proceduralId, objectId = '') {
    const tex = this.procedural.getProceduralTexture(proceduralId);
    this.statusMap.set(objectId, 'PROCEDURAL');
    return tex;
  }

  /**
   * Get texture status badge string for object intelligence panel display.
   */
  getStatusBadge(objectId) {
    const s = this.statusMap.get(objectId) || 'UNKNOWN';
    switch (s) {
      case 'READY':      return '🟢 TEXTURE READY';
      case 'PROCEDURAL': return '🔵 PROCEDURAL RENDER';
      case 'LOADING':    return '🟡 LOADING TEXTURE';
      case 'FALLBACK':   return '🟠 FALLBACK MATERIAL';
      case 'ERROR':      return '🔴 TEXTURE ERROR';
      default:           return '⚪ UNKNOWN STATUS';
    }
  }

  getStatus(objectId) {
    return this.statusMap.get(objectId) || 'UNKNOWN';
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  /**
   * Create a solid-color canvas texture (last resort fallback).
   * Each call creates a new texture to avoid shared-state issues.
   */
  _makeSolidTexture(colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const col = new THREE.Color(colorHex);
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex._isProc = true;
    return tex;
  }

  dispose() {
    this.cache.forEach(tex => tex.dispose());
    this.cache.clear();
    this.inFlight.clear();
    this.statusMap.clear();
    this.procedural.dispose();
  }
}

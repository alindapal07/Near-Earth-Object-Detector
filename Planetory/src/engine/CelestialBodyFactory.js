/**
 * CelestialBodyFactory — Reusable factory for creating Three.js celestial body meshes.
 *
 * Rendering pipeline:
 *   Object ID → Visual Config → TextureManager → Geometry → Material → Effects → Mesh
 *
 * Features:
 *  - Planets, moons, dwarf planets, Sun
 *  - Axial tilt hierarchy (SystemGroup → TiltGroup → RotationGroup → Mesh)
 *  - Earth multilayer (surface + clouds + atmosphere + night lights)
 *  - Saturn ring system with procedural ring texture (lit by Sun)
 *  - GLSL Fresnel atmosphere shader (day/night per planet profile)
 *  - Per-category PBR materials (TERRESTRIAL/GAS_GIANT/ICE_GIANT/MOON/etc.)
 *  - Color-space correct textures
 *  - Stable objectId userData on every mesh
 */
import * as THREE from 'three';
import { getVisualConfig } from '../data/celestialVisuals';
import { createAtmosphereMesh, ATMOSPHERE_PROFILES } from './AtmosphereShader';

const DEG2RAD = Math.PI / 180;

// Category material configs
const MATERIAL_PROFILES = {
  TERRESTRIAL: { roughness: 0.82, metalness: 0.0 },
  GAS_GIANT:   { roughness: 0.80, metalness: 0.0 },
  ICE_GIANT:   { roughness: 0.75, metalness: 0.0 },
  DWARF_PLANET:{ roughness: 0.92, metalness: 0.0 },
  MOON:        { roughness: 0.92, metalness: 0.0 },
  ASTEROID:    { roughness: 0.98, metalness: 0.05 },
  EARTH:       { roughness: 0.68, metalness: 0.0 },
};

const CATEGORY_MAP = {
  earth: 'EARTH', mercury: 'TERRESTRIAL', venus: 'TERRESTRIAL', mars: 'TERRESTRIAL',
  jupiter: 'GAS_GIANT', saturn: 'GAS_GIANT',
  uranus: 'ICE_GIANT', neptune: 'ICE_GIANT',
  pluto: 'DWARF_PLANET',
};

export default class CelestialBodyFactory {
  /**
   * @param {TextureManager} textureManager
   */
  constructor(textureManager) {
    this.tm = textureManager;
    // Ring geometry UV fix helper
    this._ringUVFixed = false;
    // Store atmosphere mesh refs for per-frame Sun direction update
    this.atmosphereMeshes = [];  // [{ mesh, uniforms, parentSystemGroup }]
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PUBLIC — Planet (with axial tilt hierarchy)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a planet/dwarf-planet system.
   * Returns a THREE.Group with:
   *   group.userData = { id, rotationGroup, planetMesh, cloudMesh? }
   *
   * @param {object} planetData  PLANET_DATA entry
   * @param {number} radius      Scene units
   * @returns {THREE.Group}
   */
  createPlanet(planetData, radius) {
    const id = planetData.id;
    const vis = getVisualConfig(id);

    // ── Hierarchy ───────────────────────────────────────────────────────────────
    const systemGroup  = new THREE.Group();  // orbital position group
    const tiltGroup    = new THREE.Group();  // axial tilt
    const rotationGroup = new THREE.Group(); // daily rotation

    systemGroup.add(tiltGroup);
    tiltGroup.add(rotationGroup);

    // Apply axial tilt on Z axis (north pole direction)
    if (planetData.axialTiltDeg) {
      tiltGroup.rotation.z = planetData.axialTiltDeg * DEG2RAD;
    }

    // ── Surface Geometry & Material ─────────────────────────────────────────────
    const seg = vis.segments || 48;
    const geo = new THREE.SphereGeometry(radius, seg, seg);
    const mat = this._makePlanetMaterial(vis, id);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      objectId: id,
      id,
      type: planetData.type,
      data: planetData,
      textureStatus: vis.textureStatus
    };
    rotationGroup.add(mesh);

    // ── Load Surface Texture ─────────────────────────────────────────────────────
    this.tm.loadTexture(
      vis.texture,
      vis.fallbackColor,
      id,
      vis.proceduralId,
      vis.preferProcedural || false
    ).then(tex => {
      mat.map = tex;
      mat.needsUpdate = true;
      mesh.userData.textureStatus = this.tm.getStatus(id);
    });

    // ── Special: Earth Cloud Layer + Night Lights ──────────────────────────────
    let cloudMesh = null;
    if (id === 'earth') {
      cloudMesh = this._createEarthClouds(radius, rotationGroup);
      this._createEarthNightLights(radius, mat, rotationGroup);
      this._createFresnelAtmosphere(id, radius, tiltGroup, systemGroup);
    } else if (vis.hasAtmosphere && ATMOSPHERE_PROFILES[id]) {
      this._createFresnelAtmosphere(id, radius, tiltGroup, systemGroup);
    } else if (vis.hasAtmosphere) {
      this._createSimpleAtmosphere(radius, vis, tiltGroup);
    }

    // ── Special: Saturn Rings ────────────────────────────────────────────────────
    if (vis.hasRings) {
      this._createRings(radius, vis, tiltGroup);
    }

    // ── Group userData ───────────────────────────────────────────────────────────
    systemGroup.userData = {
      objectId: id,
      id,
      type: planetData.type,
      data: planetData,
      rotationGroup,
      planetMesh: mesh,
      cloudMesh
    };

    return systemGroup;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PUBLIC — Moon / Natural Satellite
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a moon mesh.
   * @param {object} moonData  NATURAL_SATELLITES entry
   * @param {number} radius    Scene units
   * @returns {THREE.Mesh}
   */
  createMoon(moonData, radius) {
    const id = moonData.id;
    const vis = getVisualConfig(id);

    const seg = vis.segments || 24;
    const geo = new THREE.SphereGeometry(radius, seg, seg);
    const mat = this._makePlanetMaterial(vis);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      objectId: id,
      id,
      type: moonData.objectType || 'Natural Satellite',
      data: moonData,
      category: moonData.category,
      textureStatus: vis.textureStatus
    };

    // Load texture or use procedural immediately
    if (vis.textureStatus === 'PROCEDURAL' || !vis.texture) {
      // Synchronous procedural — no waiting
      const tex = this.tm.getProcedural(vis.proceduralId, id);
      mat.map = tex;
      mat.needsUpdate = true;
      mesh.userData.textureStatus = 'PROCEDURAL';
    } else {
      this.tm.loadTexture(
        vis.texture,
        vis.fallbackColor,
        id,
        vis.proceduralId,
        false
      ).then(tex => {
        mat.map = tex;
        mat.needsUpdate = true;
        mesh.userData.textureStatus = this.tm.getStatus(id);
      });
    }

    // Atmosphere for Titan (thick haze)
    if (vis.hasAtmosphere) {
      const atmosGeo = new THREE.SphereGeometry(radius * 1.08, 24, 24);
      const atmosMat = new THREE.MeshBasicMaterial({
        color: vis.atmosphereColor,
        transparent: true,
        opacity: vis.atmosphereOpacity,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
      atmosMesh.userData = { objectId: id + '_atmos' };

      // Wrap mesh + atmosphere in a group
      const group = new THREE.Group();
      group.add(mesh);
      group.add(atmosMesh);
      group.userData = mesh.userData;
      return group;
    }

    return mesh;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PUBLIC — Sun (special emissive object)
  // ══════════════════════════════════════════════════════════════════════════════

  createSun(radius) {
    const vis = getVisualConfig('sun');
    const geo = new THREE.SphereGeometry(radius, 64, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: vis.fallbackColor
    });

    // Apply procedural sun texture immediately
    const tex = this.tm.getProcedural('sun', 'sun');
    mat.map = tex;
    mat.needsUpdate = true;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      objectId: 'sun',
      id: 'sun',
      type: 'Star',
      textureStatus: 'PROCEDURAL'
    };

    return mesh;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PRIVATE — Material helpers
  // ══════════════════════════════════════════════════════════════════════════════

  _makePlanetMaterial(vis, planetId = '') {
    const category = CATEGORY_MAP[planetId] || 'MOON';
    const profile  = MATERIAL_PROFILES[category] || MATERIAL_PROFILES.MOON;
    return new THREE.MeshStandardMaterial({
      roughness: vis.roughness ?? profile.roughness,
      metalness: vis.metalness ?? profile.metalness,
      color: new THREE.Color(vis.fallbackColor)
    });
  }

  // ── Earth Cloud Layer ─────────────────────────────────────────────────────────
  _createEarthClouds(radius, parentGroup) {
    const cloudGeo = new THREE.SphereGeometry(radius * 1.014, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.6,
      roughness: 1.0,
      metalness: 0.0,
      depthWrite: false
    });

    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.name = 'earthClouds';
    cloudMesh.userData = { objectId: 'earth_clouds' };
    parentGroup.add(cloudMesh);

    // Try to load cloud texture, fallback to procedural white wisps
    this.tm.loadTexture(
      '/textures/earth_clouds.jpg',
      0xffffff,
      'earth_clouds',
      'earthClouds',
      false
    ).then(tex => {
      // Cloud textures should NOT have sRGB applied (they're luminance data)
      tex.colorSpace = THREE.NoColorSpace;
      cloudMat.alphaMap = tex;
      cloudMat.color.set(0xffffff);
      cloudMat.needsUpdate = true;
    });

    return cloudMesh;
  }

  // ── GLSL Fresnel Atmosphere (per-planet shader) ───────────────────────────────
  _createFresnelAtmosphere(planetId, radius, parentGroup, systemGroup) {
    const { mesh, uniforms } = createAtmosphereMesh(planetId, radius);
    parentGroup.add(mesh);
    // Register for Sun-direction updates each frame
    this.atmosphereMeshes.push({ mesh, uniforms, systemGroup });
  }

  // ── Simple fallback atmosphere (MeshStandardMaterial, for Titan etc.) ─────────
  _createSimpleAtmosphere(radius, vis, parentGroup) {
    if (!vis.hasAtmosphere) return;
    const atmosGeo = new THREE.SphereGeometry(radius * 1.06, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: vis.atmosphereColor,
      transparent: true,
      opacity: vis.atmosphereOpacity ?? 0.12,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    atmosMesh.userData = { objectId: 'moon_atmos', isAtmosphere: true };
    parentGroup.add(atmosMesh);
  }

  // ── Earth Night Lights (emissive, modulated toward night side) ────────────────
  _createEarthNightLights(radius, _surfaceMat, parentGroup) {
    const geo = new THREE.SphereGeometry(radius * 1.001, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0xffdd88),
      emissiveIntensity: 0.0,   // will be set from SceneManager per frame based on Sun angle
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    // Try to load night texture; if unavailable the material is invisible (emissiveIntensity=0)
    this.tm.loadTexture(
      '/textures/earth_nightlights.jpg',
      0x000000,
      'earth_nightlights',
      null,
      false
    ).then(tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.emissiveMap = tex;
      mat.emissiveIntensity = 1.4;
      mat.needsUpdate = true;
    }).catch(() => {
      // Night texture not available — keep invisible
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'earthNightLights';
    mesh.renderOrder = 1;
    mesh.userData = { objectId: 'earth_nightlights', isNightLights: true, nightMat: mat };
    parentGroup.add(mesh);
  }

  // ── Legacy atmosphere (kept for Titan moon path in createMoon) ───────────────
  _createAtmosphere(radius, vis, parentGroup) {
    this._createSimpleAtmosphere(radius, vis, parentGroup);
  }

  // ── Saturn Ring System ────────────────────────────────────────────────────────
  _createRings(planetRadius, vis, parentGroup) {
    const innerR = planetRadius * (vis.ringInner ?? 1.35);
    const outerR = planetRadius * (vis.ringOuter ?? 2.45);

    const ringGeo = new THREE.RingGeometry(innerR, outerR, 128);

    // Fix ring UV mapping — RingGeometry UVs are wrong by default for textures
    this._fixRingUVs(ringGeo, innerR, outerR);

    const ringMat = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      roughness: 0.9,
      metalness: 0.0,
      depthWrite: false,
    });

    // Try image texture, fallback to procedural ring texture
    const ringTexPath = vis.ringTexture || null;
    this.tm.loadTexture(
      ringTexPath,
      0xc8b090,
      'saturn_rings',
      'saturnRing',
      !ringTexPath
    ).then(tex => {
      tex.colorSpace = THREE.NoColorSpace; // ring alpha/color data
      ringMat.map = tex;
      ringMat.alphaMap = tex;
      ringMat.needsUpdate = true;
    });

    // If no image texture at all, create procedural ring texture synchronously
    if (!ringTexPath) {
      const procRingTex = this._makeProceduralRingTexture();
      ringMat.map = procRingTex;
      ringMat.alphaMap = procRingTex;
      ringMat.needsUpdate = true;
    }

    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = vis.ringTilt ?? (Math.PI / 2.2);
    ringMesh.receiveShadow = true;
    ringMesh.userData = { objectId: 'saturn_rings' };
    parentGroup.add(ringMesh);
  }

  /**
   * Fix RingGeometry UV mapping so textures wrap correctly from inside to outside.
   */
  _fixRingUVs(geometry, innerR, outerR) {
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const range = outerR - innerR;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      uv.setXY(i, (dist - innerR) / range, 0.5);
    }
    uv.needsUpdate = true;
  }

  /**
   * Generate procedural Saturn ring texture.
   * Bands of varying density from inner (denser) to outer (sparser).
   */
  _makeProceduralRingTexture() {
    const width = 512;
    const height = 8;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Saturn-like ring band colors (inner → outer)
    // B ring (bright), A ring, Cassini Division, outer sparse
    const bands = [
      { start: 0.0,  end: 0.05,  r: 60,  g: 50, b: 40, a: 0.2 },   // C ring sparse
      { start: 0.05, end: 0.35,  r: 220, g: 200, b: 170, a: 0.85 }, // B ring bright
      { start: 0.35, end: 0.42,  r: 30,  g: 25, b: 20, a: 0.08 },   // Cassini Division
      { start: 0.42, end: 0.70,  r: 190, g: 175, b: 150, a: 0.70 }, // A ring
      { start: 0.70, end: 0.82,  r: 90,  g: 80, b: 65, a: 0.25 },   // Encke gap / outer A
      { start: 0.82, end: 1.00,  r: 50,  g: 45, b: 35, a: 0.08 },   // F / outer rings
    ];

    for (const band of bands) {
      const x0 = Math.round(band.start * width);
      const x1 = Math.round(band.end * width);
      const grd = ctx.createLinearGradient(x0, 0, x1, 0);
      grd.addColorStop(0,   `rgba(${band.r},${band.g},${band.b},${band.a * 0.7})`);
      grd.addColorStop(0.3, `rgba(${band.r},${band.g},${band.b},${band.a})`);
      grd.addColorStop(0.7, `rgba(${band.r},${band.g},${band.b},${band.a})`);
      grd.addColorStop(1,   `rgba(${band.r},${band.g},${band.b},${band.a * 0.7})`);
      ctx.fillStyle = grd;
      ctx.fillRect(x0, 0, x1 - x0, height);
    }

    // Fine ring structure noise
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let seed = 12345;
    const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
    for (let i = 0; i < width; i++) {
      const noiseA = 0.8 + rand() * 0.4;
      for (let j = 0; j < height; j++) {
        const idx = (j * width + i) * 4;
        data[idx + 3] = Math.min(255, Math.round(data[idx + 3] * noiseA));
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  dispose() {
    // Textures disposed via TextureManager
  }
}

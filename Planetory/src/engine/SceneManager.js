import * as THREE from 'three';
import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES, ARTIFICIAL_SATELLITES } from '../data/satellites';
import { calculateHeliocentricPosition, calculateMeanAnomaly } from '../utils/orbitalMath';
import { eclipticToThree } from '../utils/coordinateTransform';
import { degToRad } from '../utils/units';

import TextureManager from './TextureManager';
import LightingManager from './LightingManager';
import SpaceObjectRenderer from './SpaceObjectRenderer';
import ScaleManager, { SCENE_AU } from './ScaleManager';

const MAX_CATALOG_ASTEROIDS = 2500;


import ObservatorySkyManager from './ObservatorySkyManager.js';
import { calculateObserverCoordinates } from '../utils/astronomicalCoordinates.js';
import { DEFAULT_OBSERVER } from '../utils/observerModel.js';

export default class SceneManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.textureManager = new TextureManager(renderer);
    this.lightingManager = new LightingManager(this.scene, this.renderer);
    this.objectRenderer = new SpaceObjectRenderer(this.scene, this.textureManager);
    this.observatorySkyManager = new ObservatorySkyManager(this.scene);

    // Central size system — default 'balanced' mode
    this.scaleManager = new ScaleManager('balanced');

    this.planets = new Map();
    this.moons = new Map();
    this.satellites = new Map();
    this.interactableObjects = [];
    this.scaleMode = 'balanced';

    this.catalogAsteroidData = [];
    this.catalogInstanceMesh = null;
    this.catalogInstanceMap = new Map();
    this.cometGroup = new THREE.Group();
    this.scene.add(this.cometGroup);

    this.orbitLinesVisible = true;
    this.asteroidBeltVisible = true;
    this.catalogVisible = true;
    this.moonsVisible = true;
    this.satellitesVisible = true;

    this.selectionHalo = null;
    this.selectedObjectId = null;

    // PART 7 & 9 — Scientific Vectors, Motion Trails & Observatory Mode
    this.appMode = 'SOLAR_SYSTEM'; // 'SOLAR_SYSTEM' | 'OBSERVATORY'
    this.observer = DEFAULT_OBSERVER;

    this.showVectors = false;
    this.showTrails = 'short'; // 'off' | 'short' | 'medium' | 'long'
    this.posArrow = null;
    this.velArrow = null;
    this.trailLine = null;
    this.trailPoints = [];
    this.lastObservedPos = new THREE.Vector3();
  }

  getInteractableObjects() {
    return this.interactableObjects;
  }

  getObjectMesh(id) {
    if (this.planets.has(id)) return this.planets.get(id).mesh;
    if (this.moons.has(id)) {
      const moonObj = this.moons.get(id);
      // Handle moons that are wrapped in a Group (e.g. Titan with atmosphere)
      return moonObj.rootMesh || moonObj.mesh;
    }
    if (this.satellites.has(id)) return this.satellites.get(id).mesh;
    return null;
  }

  init(scaleMode) {
    // Map legacy 'educational' mode to our system; support 'balanced'/'true'/'educational'
    const normalizedMode = scaleMode === 'educational' ? 'educational'
      : scaleMode === 'true' ? 'true' : 'balanced';
    this.scaleMode = normalizedMode;
    this.scaleManager.mode = normalizedMode;

    this.createSpaceBackground();
    this.createCosmicDust();
    this.createSun();
    this.createPlanets();
    this.createNaturalSatellites();
    this.createArtificialSatellites();
    this.createAsteroidBelt();
    this.createSelectionHalo();
    this.createVectorAndTrailHelpers();
    this.observatorySkyManager.init();

    // Development-time hierarchy & Sun separation tests (console reports)
    this.scaleManager.runHierarchyTest(PLANET_DATA, NATURAL_SATELLITES);
    this.scaleManager.validateSunSeparation(PLANET_DATA);
    this.scaleManager.validateMoonSeparation(PLANET_DATA, NATURAL_SATELLITES);
    this._runSameSizeCheck();
  }

  setAppMode(mode) {
    this.appMode = mode;
    const isObs = mode === 'OBSERVATORY';
    this.observatorySkyManager.setEnabled(isObs);

    // Hide orbit lines in observatory mode to keep sky clean
    if (isObs) {
      this.setOrbitLinesVisible(false);
    } else {
      this.setOrbitLinesVisible(this.orbitLinesVisible);
    }
  }

  setObserver(obs) {
    this.observer = obs;
    this.observatorySkyManager.setObserver(obs);
  }

  createVectorAndTrailHelpers() {
    // Position Arrow (Yellow)
    this.posArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      5,
      0xffb703,
      1.2,
      0.8
    );
    this.posArrow.visible = false;
    this.scene.add(this.posArrow);

    // Velocity Arrow (Cyan)
    this.velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      5,
      0x00f0ff,
      1.2,
      0.8
    );
    this.velArrow.visible = false;
    this.scene.add(this.velArrow);

    // Fading Motion Trail Line
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
      linewidth: 2
    });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.trailLine.visible = false;
    this.scene.add(this.trailLine);
  }

  setShowVectors(visible) {
    this.showVectors = visible;
    if (!visible) {
      if (this.posArrow) this.posArrow.visible = false;
      if (this.velArrow) this.velArrow.visible = false;
    }
  }

  setShowTrails(mode) {
    this.showTrails = mode; // 'off' | 'short' | 'medium' | 'long'
    this.trailPoints = [];
    if (mode === 'off' && this.trailLine) {
      this.trailLine.visible = false;
    }
  }

  updateScale(mode) {
    this.scaleMode = mode;
    this.scaleManager.mode = mode;
  }

  createSpaceBackground() {
    // ── Primary Starfield (60,000 stars) ──────────────────────────────────────
    const starCount = 60000;
    const positions = new Float32Array(starCount * 3);
    const colors    = new Float32Array(starCount * 3);
    const sizes     = new Float32Array(starCount);
    const col       = new THREE.Color();

    const starTypes = [
      { hex: 0x9bb0ff, weight: 0.04, minSize: 0.8, maxSize: 2.2 }, // O/B blue giant
      { hex: 0xcad8ff, weight: 0.14, minSize: 0.6, maxSize: 1.8 }, // A/F white
      { hex: 0xfff8f0, weight: 0.44, minSize: 0.5, maxSize: 1.4 }, // G yellow-white
      { hex: 0xffd2a1, weight: 0.26, minSize: 0.4, maxSize: 1.2 }, // K orange
      { hex: 0xffaa66, weight: 0.12, minSize: 0.3, maxSize: 0.9 }, // M red dwarf
    ];

    // Milky Way galactic band: dense in XZ-plane (phi near PI/2)
    const MILKY_WAY_STRENGTH = 0.6; // 0..1; higher = more stars near band

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Reject-sample towards galactic plane for density gradient
      let theta, phi, r;
      let accepted = false;
      for (let tries = 0; tries < 8; tries++) {
        theta = Math.random() * Math.PI * 2;
        phi   = Math.acos(2 * Math.random() - 1);
        const bandBias = Math.pow(Math.sin(phi), 2.5); // 1 at equator, 0 at poles
        if (Math.random() < (MILKY_WAY_STRENGTH * bandBias + (1.0 - MILKY_WAY_STRENGTH))) {
          accepted = true; break;
        }
      }
      if (!accepted) { theta = Math.random() * Math.PI * 2; phi = Math.acos(2 * Math.random() - 1); }

      r = THREE.MathUtils.randFloat(4000, 18000);
      positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      // Spectral type
      const rnd = Math.random();
      let cum = 0;
      let st  = starTypes[2];
      for (const s of starTypes) { cum += s.weight; if (rnd <= cum) { st = s; break; } }

      col.setHex(st.hex);
      const brightness = Math.random() < 0.02
        ? THREE.MathUtils.randFloat(0.85, 1.0)   // 2% bright stars
        : THREE.MathUtils.randFloat(0.25, 0.75);  // rest dim
      col.multiplyScalar(brightness);
      colors[i3]     = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      sizes[i] = THREE.MathUtils.randFloat(st.minSize, st.maxSize);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.Float32BufferAttribute(sizes, 1));

    // Custom shader for per-star size variation
    const starMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          // Circular point
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.2, 0.5, d);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.scene.add(new THREE.Points(geo, starMat));

    // ── Secondary faint background stars (10k very dim) ───────────────────────
    const faintCount = 10000;
    const faintPos = new Float32Array(faintCount * 3);
    const faintCol = new Float32Array(faintCount).fill(0).map(() => 1);
    const faintColors = new Float32Array(faintCount * 3);
    for (let i = 0; i < faintCount; i++) {
      const r2 = THREE.MathUtils.randFloat(14000, 22000);
      const t2 = Math.random() * Math.PI * 2;
      const p2 = Math.acos(2 * Math.random() - 1);
      faintPos[i*3]   = r2 * Math.sin(p2) * Math.cos(t2);
      faintPos[i*3+1] = r2 * Math.sin(p2) * Math.sin(t2);
      faintPos[i*3+2] = r2 * Math.cos(p2);
      const b = THREE.MathUtils.randFloat(0.08, 0.22);
      faintColors[i*3] = b; faintColors[i*3+1] = b * 0.95; faintColors[i*3+2] = b;
    }
    const faintGeo = new THREE.BufferGeometry();
    faintGeo.setAttribute('position', new THREE.Float32BufferAttribute(faintPos, 3));
    faintGeo.setAttribute('color',    new THREE.Float32BufferAttribute(faintColors, 3));
    const faintMat = new THREE.PointsMaterial({
      size: 0.6, sizeAttenuation: false, vertexColors: true,
      transparent: true, opacity: 0.7, depthWrite: false
    });
    this.scene.add(new THREE.Points(faintGeo, faintMat));
  }

  createCosmicDust() {
    // Subtle deep-space interstellar medium glow
    const particleCount = 1200;
    const vertices = [];
    for (let i = 0; i < particleCount; i++) {
      vertices.push(
        THREE.MathUtils.randFloatSpread(2000),
        THREE.MathUtils.randFloatSpread(600),
        THREE.MathUtils.randFloatSpread(2000)
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x001a44,
      size: 1.8,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.cosmicDustPoints = new THREE.Points(geo, mat);
    this.scene.add(this.cosmicDustPoints);
  }

  createSun() {
    const sunData = PLANET_DATA.sun;
    // Use ScaleManager for the Sun's render radius
    const radius = this.scaleManager.getSunRenderRadius();

    // Wrap in LightingManager corona/glow system
    this.lightingManager.createRadialSun(radius, null);
    if (this.lightingManager.sunMesh) {
      const tex = this.textureManager.getProcedural('sun', 'sun');
      this.lightingManager.sunMesh.material.map = tex;
      this.lightingManager.sunMesh.material.needsUpdate = true;
      this.lightingManager.sunMesh.userData = {
        objectId: 'sun', id: sunData.id, type: sunData.type, data: sunData,
        physicalRadiusKm: sunData.radiusKm,
        renderRadius: radius
      };
    }

    this.planets.set(sunData.id, { mesh: this.lightingManager.sunMesh, data: sunData });
    this.interactableObjects.push(this.lightingManager.sunMesh);
  }

  createPlanets() {
    Object.values(PLANET_DATA).forEach(planetData => {
      if (planetData.id === 'sun') return;

      // Use ScaleManager — preserves physical hierarchy exactly
      const radius = this.scaleManager.getRenderRadius(planetData.radiusKm, 'planet');
      const systemGroup = this.objectRenderer.createPlanetMesh(planetData, radius);

      // Stamp render size onto userData for debug/UI access
      systemGroup.userData.physicalRadiusKm = planetData.radiusKm;
      systemGroup.userData.renderRadius = radius;

      this.scene.add(systemGroup);

      const planetMesh = systemGroup.userData.planetMesh;
      this.interactableObjects.push(planetMesh);

      const orbitLine = this.createOrbitPath(planetData, 0x335577);
      if (orbitLine) this.scene.add(orbitLine);

      this.planets.set(planetData.id, { mesh: systemGroup, data: planetData, orbitLine, renderRadius: radius });
    });
  }

  createNaturalSatellites() {
    NATURAL_SATELLITES.forEach(moonData => {
      const parentObj = this.planets.get(moonData.parentPlanet);
      if (!parentObj) return;

      // CRITICAL: Each moon gets its own independent radius from ScaleManager.
      // We do NOT use the parent planet's radius, and we do NOT apply any
      // multiplier. The ScaleManager guarantees moon < parent in all modes.
      const moonRadius = this.scaleManager.getRenderRadius(moonData.radiusKm, 'moon');

      // IMPORTANT: Moons are added directly to scene (not as children of planet
      // group), so they NEVER inherit the parent's scale transform.
      const moonResult = this.objectRenderer.createMoonMesh(moonData, moonRadius);

      let rootMesh = moonResult;
      let pickMesh = moonResult;

      if (moonResult instanceof THREE.Group) {
        pickMesh = moonResult.children.find(
          c => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry
        ) || moonResult.children[0];
        rootMesh = moonResult;
      }

      // Stamp render size for debug/UI
      rootMesh.userData = rootMesh.userData || {};
      rootMesh.userData.physicalRadiusKm = moonData.radiusKm;
      rootMesh.userData.renderRadius = moonRadius;

      // Add directly to scene (NOT as child of planet) — prevents scale inheritance
      this.scene.add(rootMesh);
      this.interactableObjects.push(pickMesh);
      this.moons.set(moonData.id, { mesh: rootMesh, rootMesh, pickMesh, data: moonData, renderRadius: moonRadius });
    });
  }

  createArtificialSatellites() {
    ARTIFICIAL_SATELLITES.forEach(satData => {
      const { group: satGroup, pickMesh } = this.objectRenderer.createSpacecraftGroup(satData);

      this.scene.add(satGroup);
      this.interactableObjects.push(pickMesh);
      this.satellites.set(satData.id, { mesh: satGroup, data: satData });
    });
  }

  createSelectionHalo() {
    const geo = new THREE.RingGeometry(1, 1.2, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthTest: false
    });
    this.selectionHalo = new THREE.Mesh(geo, mat);
    this.selectionHalo.visible = false;
    this.scene.add(this.selectionHalo);
  }

  setSelectedObject(id) {
    this.selectedObjectId = id;
    if (!id) {
      this.selectionHalo.visible = false;
      return;
    }
    const mesh = this.getObjectMesh(id);
    if (mesh) {
      this.selectionHalo.visible = true;
    } else {
      this.selectionHalo.visible = false;
    }
  }

  createOrbitPath(data, color = 0x335577) {
    if (!data.a) return null;
    const points = [];
    const segments = 360; // 1 point per degree of mean anomaly for smooth curve
    for (let k = 0; k <= segments; k++) {
      const M = (k / segments) * 2 * Math.PI;
      const pos = calculateHeliocentricPosition({
        a: data.a, e: data.e, i: data.i || 0,
        omega: data.omega || 0, Omega: data.Omega || 0, M
      });
      const s = this.getDistanceScale();
      const tp = eclipticToThree(pos);
      points.push(new THREE.Vector3(tp.x * s, tp.y * s, tp.z * s));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
    const line = new THREE.Line(geo, mat);
    line.userData.isOrbitLine = true;
    return line;
  }

  createAsteroidBelt() {
    const count = 3000;
    const geo = new THREE.OctahedronGeometry(0.06, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x998877, roughness: 1.0, flatShading: true });
    this.beltMesh = new THREE.InstancedMesh(geo, mat, count);
    this.beltMesh.userData = { isSyntheticBelt: true };

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = THREE.MathUtils.randFloat(2.1, 3.3);
      const e = THREE.MathUtils.randFloat(0, 0.25);
      const inc = THREE.MathUtils.randFloat(-0.25, 0.25);
      const M = Math.random() * Math.PI * 2;
      const Omega = Math.random() * Math.PI * 2;
      const omega = Math.random() * Math.PI * 2;

      try {
        const pos = calculateHeliocentricPosition({ a, e, i: inc, omega, Omega, M });
        const tp = eclipticToThree(pos);
        const s = this.getDistanceScale();
        dummy.position.set(tp.x * s, tp.y * s, tp.z * s);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const sz = THREE.MathUtils.randFloat(0.4, 2.2);
        dummy.scale.set(sz, sz, sz);
        dummy.updateMatrix();
        this.beltMesh.setMatrixAt(i, dummy.matrix);
      } catch {
        dummy.position.set(0, 9999, 0);
        dummy.updateMatrix();
        this.beltMesh.setMatrixAt(i, dummy.matrix);
      }
    }
    this.beltMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.beltMesh);
  }

  loadCatalogAsteroids(asteroidDataArray) {
    if (!asteroidDataArray || asteroidDataArray.length === 0) return;

    if (this.catalogInstanceMesh) {
      this.scene.remove(this.catalogInstanceMesh);
      this.catalogInstanceMesh.geometry.dispose();
      this.catalogInstanceMesh.material.dispose();
      this.catalogInstanceMesh = null;
    }
    this.catalogInstanceMap.clear();

    const valid = asteroidDataArray.filter(ast => {
      if (!ast.a || !ast.e) return false;
      const a = Number(ast.a); const e = Number(ast.e);
      return Number.isFinite(a) && Number.isFinite(e) && e >= 0 && e < 1.0 && a > 0;
    }).slice(0, MAX_CATALOG_ASTEROIDS);

    this.catalogAsteroidData = valid;
    const count = valid.length;
    if (count === 0) return;

    const geo = new THREE.OctahedronGeometry(0.14, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd9b38c, roughness: 0.9, flatShading: true
    });

    this.catalogInstanceMesh = new THREE.InstancedMesh(geo, mat, count);
    this.catalogInstanceMesh.userData = { isCatalogAsteroid: true };

    valid.forEach((ast, i) => {
      this.catalogInstanceMap.set(i, ast);
    });

    this.scene.add(this.catalogInstanceMesh);
    this.interactableObjects.push(this.catalogInstanceMesh);
    this._updateCatalogPositions(0);
  }

  _updateCatalogPositions(timeDays) {
    if (!this.catalogInstanceMesh || this.catalogAsteroidData.length === 0) return;

    const dummy = new THREE.Object3D();
    const s = this.getDistanceScale();

    this.catalogAsteroidData.forEach((ast, i) => {
      try {
        const a = Number(ast.a);
        const e = Number(ast.e);
        const inc = ast.i != null ? degToRad(Number(ast.i)) : 0;
        const Omega = ast.Omega != null ? degToRad(Number(ast.Omega)) : 0;
        const omega = ast.omega != null ? degToRad(Number(ast.omega)) : 0;
        const M0 = ast.M0 != null ? degToRad(Number(ast.M0)) : 0;
        const period = ast.period != null ? Number(ast.period) : null;

        const currentM = calculateMeanAnomaly(M0, period, timeDays);
        const pos = calculateHeliocentricPosition({ a, e, i: inc, omega, Omega, M: currentM });
        const tp = eclipticToThree(pos);

        dummy.position.set(tp.x * s, tp.y * s, tp.z * s);
        dummy.rotation.set(0, timeDays * 0.01 + i, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        this.catalogInstanceMesh.setMatrixAt(i, dummy.matrix);
      } catch {
        dummy.position.set(0, 99999, 0);
        dummy.updateMatrix();
        this.catalogInstanceMesh.setMatrixAt(i, dummy.matrix);
      }
    });

    this.catalogInstanceMesh.instanceMatrix.needsUpdate = true;
  }

  getAsteroidByInstanceId(instanceId) {
    return this.catalogInstanceMap.get(instanceId) || null;
  }

  addComets(cometsData) {
    while (this.cometGroup.children.length > 0) {
      const child = this.cometGroup.children[0];
      this.cometGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    const valid = (cometsData || []).filter(c => c.a && c.e && Number.isFinite(Number(c.a)) && Number(c.e) < 1.0);
    if (valid.length === 0) return;

    valid.forEach(c => {
      const cometMesh = new THREE.Group();

      // 1. Dark Irregular Nucleus (Req 18)
      const nucGeo = new THREE.IcosahedronGeometry(0.25, 1);
      // Deterministic vertex displacement for irregular rocky nucleus
      const posAttr = nucGeo.attributes.position;
      for (let idx = 0; idx < posAttr.count; idx++) {
        const vx = posAttr.getX(idx);
        const vy = posAttr.getY(idx);
        const vz = posAttr.getZ(idx);
        const disp = 1 + (Math.sin(vx * 15 + idx) * 0.15);
        posAttr.setXYZ(idx, vx * disp, vy * disp, vz * disp);
      }
      nucGeo.computeVertexNormals();

      const nucMat = new THREE.MeshStandardMaterial({
        color: 0x2a3545,
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true
      });
      const nucleus = new THREE.Mesh(nucGeo, nucMat);
      cometMesh.add(nucleus);

      // 2. Translucent Coma Envelope (Req 18)
      const comaGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const comaMat = new THREE.MeshBasicMaterial({
        color: 0x88eeff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      cometMesh.add(new THREE.Mesh(comaGeo, comaMat));

      // 3. Dust Tail (Broad, warm translucent fan along +Z anti-solar direction) (Req 17, 18)
      const dustPoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.6, 0.4, 6.0),
        new THREE.Vector3(0.6, 0.4, 6.0),
        new THREE.Vector3(0, -0.3, 6.5)
      ];
      const dustGeo = new THREE.ConeGeometry(0.8, 7.0, 16, 1, true);
      dustGeo.rotateX(Math.PI / 2);
      dustGeo.translate(0, 0, 3.5);
      const dustMat = new THREE.MeshBasicMaterial({
        color: 0xffddaa,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      cometMesh.add(new THREE.Mesh(dustGeo, dustMat));

      // 4. Ion Tail (Thin, blue straight stream along +Z anti-solar direction) (Req 17, 18)
      const ionGeo = new THREE.CylinderGeometry(0.05, 0.35, 10.0, 12, 1, true);
      ionGeo.rotateX(Math.PI / 2);
      ionGeo.translate(0, 0, 5.0);
      const ionMat = new THREE.MeshBasicMaterial({
        color: 0x33aaff,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      cometMesh.add(new THREE.Mesh(ionGeo, ionMat));

      cometMesh.userData = { id: c.id || c.name, type: 'Comet', data: c };
      this.cometGroup.add(cometMesh);
      this.interactableObjects.push(nucleus);
    });
  }

  setOrbitLinesVisible(v) {
    this.orbitLinesVisible = v;
    this.planets.forEach(obj => { if (obj.orbitLine) obj.orbitLine.visible = v; });
  }

  setAsteroidBeltVisible(v) {
    this.asteroidBeltVisible = v;
    if (this.beltMesh) this.beltMesh.visible = v;
  }

  setCatalogVisible(v) {
    this.catalogVisible = v;
    if (this.catalogInstanceMesh) this.catalogInstanceMesh.visible = v;
  }

  setMoonsVisible(v) {
    this.moonsVisible = v;
    this.moons.forEach(m => { m.mesh.visible = v; });
  }

  setSatellitesVisible(v) {
    this.satellitesVisible = v;
    this.satellites.forEach(s => { s.mesh.visible = v; });
  }

  showTrajectory(asteroidData) {
    this.clearTrajectory();
    if (!asteroidData || !asteroidData.a) return;

    const a = Number(asteroidData.a);
    const e = Number(asteroidData.e);
    const inc = asteroidData.i != null ? degToRad(Number(asteroidData.i)) : 0;
    const Omega = asteroidData.Omega != null ? degToRad(Number(asteroidData.Omega)) : 0;
    const omega = asteroidData.omega != null ? degToRad(Number(asteroidData.omega)) : 0;

    if (!Number.isFinite(a) || !Number.isFinite(e) || e >= 1) return;

    const points = [];
    const s = this.getDistanceScale();
    for (let k = 0; k <= 256; k++) {
      const M = (k / 256) * 2 * Math.PI;
      try {
        const pos = calculateHeliocentricPosition({ a, e, i: inc, omega, Omega, M });
        const tp = eclipticToThree(pos);
        points.push(new THREE.Vector3(tp.x * s, tp.y * s, tp.z * s));
      } catch { /* skip */ }
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
    this.trajectoryLine = new THREE.Line(geo, mat);
    this.scene.add(this.trajectoryLine);
  }

  clearTrajectory() {
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      this.trajectoryLine = null;
    }
  }

  /**
   * Get render radius for any object ID (used by camera focus, UI).
   * Checks planets, moons, and satellites maps.
   */
  getObjectRenderRadius(id) {
    if (this.planets.has(id)) return this.planets.get(id).renderRadius ?? 1.8;
    if (this.moons.has(id)) return this.moons.get(id).renderRadius ?? 0.5;
    return 1.0;
  }

  /**
   * Get full size debug info for a known object.
   */
  getSizeDebugInfo(id) {
    if (this.planets.has(id)) {
      const p = this.planets.get(id);
      return this.scaleManager.getDebugInfo(id, p.data.radiusKm, p.data.type);
    }
    if (this.moons.has(id)) {
      const m = this.moons.get(id);
      return this.scaleManager.getDebugInfo(id, m.data.radiusKm, m.data.objectType || 'Natural Satellite');
    }
    return null;
  }

  getDistanceScale() {
    return this.scaleManager.auToSceneUnits(1);
  }

  /**
   * Development-time same-size bug detector.
   * Logs a warning if any two unrelated objects have accidentally identical render radii.
   */
  _runSameSizeCheck() {
    const seen = new Map(); // renderRadius string → first id
    let bugFound = false;

    const check = (id, rr) => {
      const key = rr.toFixed(4);
      if (seen.has(key)) {
        const otherId = seen.get(key);
        // Only warn if neither is a min-floor case
        if (rr > 0.065) {
          console.warn(`[ScaleManager] SAME-SIZE WARNING: '${id}' and '${otherId}' both have renderRadius=${key}`);
          bugFound = true;
        }
      } else {
        seen.set(key, id);
      }
    };

    this.planets.forEach((obj, id) => {
      if (obj.renderRadius) check(id, obj.renderRadius);
    });
    this.moons.forEach((obj, id) => {
      if (obj.renderRadius) check(id, obj.renderRadius);
    });

    if (!bugFound) {
      console.log('[ScaleManager] ✅ No same-size duplicates detected among planets and major moons.');
    }
  }

  /**
   * Expose ScaleManager for external access (e.g. UI panels, camera focus).
   */
  getScaleManager() {
    return this.scaleManager;
  }

  // ─── UPDATE LOOP (Req 7, 9, 10, 14: Epoch-based Rotation) ────────────────

  update(timeDays) {
    const s = this.getDistanceScale();

    // Lighting update
    this.lightingManager.update(timeDays);

    // 1. Planets
    this.planets.forEach((obj, id) => {
      if (id === 'sun') return;
      const data = obj.data;
      try {
        const currentM = calculateMeanAnomaly(data.M0, data.orbitalPeriodDays, timeDays);
        const pos = calculateHeliocentricPosition({
          a: data.a, e: data.e, i: data.i || 0,
          omega: data.omega || 0, Omega: data.Omega || 0, M: currentM
        });
        const tp = eclipticToThree(pos);
        obj.mesh.position.set(tp.x * s, tp.y * s, tp.z * s);

        // Rotational Angle derived from simulation time & rotation period (Req 9)
        if (data.rotationPeriodHours && obj.mesh.userData.rotationGroup) {
          const hoursElapsed = timeDays * 24;
          const rotAngle = (hoursElapsed / Math.abs(data.rotationPeriodHours)) * Math.PI * 2;
          const dir = data.rotationPeriodHours < 0 ? -1 : 1;
          obj.mesh.userData.rotationGroup.rotation.y = dir * rotAngle;

          // Earth Clouds Rotation (Req 14)
          if (id === 'earth') {
            const clouds = obj.mesh.userData.rotationGroup.getObjectByName('earthClouds');
            if (clouds) clouds.rotation.y = rotAngle * 1.15;
          }
        }

        // ── Fresnel Atmosphere: pass Sun direction in LOCAL space ──────────────
        // The factory stores atmosphere uniforms on the objectRenderer's factory
        const atmMeshes = this.objectRenderer?.factory?.atmosphereMeshes || [];
        if (atmMeshes.length > 0) {
          const sunWorldPos = new THREE.Vector3(0, 0, 0); // Sun at origin
          for (const atmEntry of atmMeshes) {
            if (!atmEntry.mesh || !atmEntry.uniforms) continue;
            // Get planet world position from the atmosphere mesh's parent
            const atmWorldPos = new THREE.Vector3();
            atmEntry.mesh.getWorldPosition(atmWorldPos);
            const dirToSun = new THREE.Vector3().subVectors(sunWorldPos, atmWorldPos).normalize();
            // Convert world direction to local space of the atmosphere mesh
            const invMat = new THREE.Matrix4().copy(atmEntry.mesh.matrixWorld).invert();
            dirToSun.transformDirection(invMat);
            atmEntry.uniforms.uSunDirectionLocal.value.copy(dirToSun);
          }
        }

        // ── Earth Night Lights: darken on day side ────────────────────────────
        if (id === 'earth') {
          const rotGroup = obj.mesh.userData.rotationGroup;
          if (rotGroup) {
            rotGroup.traverse(child => {
              if (child.userData?.isNightLights && child.userData.nightMat) {
                const earthPos = obj.mesh.position;
                const sunDir  = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), earthPos).normalize();
                // Approximate: when facing away from sun (nightside), lights show
                // We modulate emissiveIntensity — actual night side is handled by additive blending
                // Nothing to do here beyond texture load; blending handles day/night naturally.
              }
            });
          }
        }

      } catch { /* skip */ }
    });

    // 2. Natural Satellites (Moons) — Parent-Centric Motion
    if (this.moonsVisible) {
      this.moons.forEach(({ mesh, rootMesh, data }) => {
        const parentObj = this.planets.get(data.parentPlanet);
        const parentMesh = parentObj?.mesh;
        if (!parentMesh) return;

        const parentRenderRadius = parentObj.renderRadius || 1.8;
        const moonRenderRadius = this.scaleManager.getRenderRadius(data.radiusKm, 'moon');

        // Moon distance: parent-centric, strictly clear of parent planet surface
        const baseDist = (data.a || 0.00257) * 450 * (s / 25);
        const minSafeDist = parentRenderRadius + moonRenderRadius + 1.2;
        const moonDist = Math.max(minSafeDist, baseDist);

        const moonM = (timeDays / (data.orbitalPeriodDays || 27.3)) * Math.PI * 2;
        const inc = data.inclination ? data.inclination * (Math.PI / 180) : 0.05;

        const mx = parentMesh.position.x + Math.cos(moonM) * moonDist;
        const my = parentMesh.position.y + Math.sin(moonM) * Math.sin(inc) * moonDist;
        const mz = parentMesh.position.z + Math.sin(moonM) * Math.cos(inc) * moonDist;

        // Position rootMesh directly in scene (parent-centric transform)
        const posMesh = rootMesh || mesh;
        posMesh.position.set(mx, my, mz);
      });
    }

    // 3. Artificial Satellites / Spacecraft
    if (this.satellitesVisible) {
      this.satellites.forEach(({ mesh, data }) => {
        const parentMesh = this.planets.get(data.parentPlanet)?.mesh;
        if (data.id === 'jwst') {
          const earthMesh = this.planets.get('earth')?.mesh;
          if (earthMesh) {
            const l2Offset = earthMesh.position.clone().normalize().multiplyScalar(4 * s);
            mesh.position.copy(earthMesh.position).add(l2Offset);
          }
        } else if (parentMesh) {
          const satM = (timeDays * (24 * 60 / (data.orbitalPeriodMinutes || 90))) * Math.PI * 2;
          const satDist = 1.2 * s;
          mesh.position.set(
            parentMesh.position.x + Math.cos(satM) * satDist,
            parentMesh.position.y + Math.sin(satM) * 0.3 * satDist,
            parentMesh.position.z + Math.sin(satM) * satDist
          );
        }
      });
    }

    // 4. Catalog Asteroids
    if (this.catalogInstanceMesh && this.catalogVisible) {
      this._updateCatalogPositions(timeDays);
    }

    // 5. Comets
    if (this.cometGroup.children.length > 0) {
      this.cometGroup.children.forEach(cometGroupMesh => {
        const c = cometGroupMesh.userData.data;
        if (!c || !c.a) return;
        try {
          const currentM = calculateMeanAnomaly(c.M0 || 0, c.orbitalPeriodDays || 1000, timeDays);
          const pos = calculateHeliocentricPosition({
            a: Number(c.a), e: Number(c.e), i: c.i || 0, omega: c.omega || 0, Omega: c.Omega || 0, M: currentM
          });
          const tp = eclipticToThree(pos);
          const cPos = new THREE.Vector3(tp.x * s, tp.y * s, tp.z * s);
          cometGroupMesh.position.copy(cPos);

          const sunDir = cPos.clone().normalize();
          cometGroupMesh.lookAt(cPos.clone().add(sunDir));
        } catch { /* skip */ }
      });
    }

    // 6. Selection Halo & 3D Telemetry Visualizers (PART 7)
    if (this.selectedObjectId) {
      const selectedMesh = this.getObjectMesh(this.selectedObjectId);
      if (selectedMesh) {
        if (this.selectionHalo.visible) {
          this.selectionHalo.position.copy(selectedMesh.position);
        }

        const curPos = selectedMesh.position.clone();

        // A. 3D Position & Velocity Vector Arrows
        if (this.showVectors) {
          // Position vector from origin (or parent planet)
          const origin = new THREE.Vector3(0, 0, 0);
          const rDir = curPos.clone().sub(origin);
          const rLen = rDir.length();
          if (rLen > 0.001) {
            this.posArrow.position.copy(origin);
            this.posArrow.setDirection(rDir.clone().normalize());
            this.posArrow.setLength(rLen, Math.min(2.5, rLen * 0.2), Math.min(1.5, rLen * 0.15));
            this.posArrow.visible = true;
          }

          // Velocity vector: compute displacement direction
          if (this.lastObservedPos && this.lastObservedPos.length() > 0) {
            const velDir = curPos.clone().sub(this.lastObservedPos);
            const vLen = velDir.length();
            if (vLen > 0.0001) {
              const arrowLen = Math.max(3, Math.min(15, vLen * 80));
              this.velArrow.position.copy(curPos);
              this.velArrow.setDirection(velDir.clone().normalize());
              this.velArrow.setLength(arrowLen, Math.min(2.0, arrowLen * 0.2), Math.min(1.2, arrowLen * 0.15));
              this.velArrow.visible = true;
            }
          }
        } else {
          if (this.posArrow) this.posArrow.visible = false;
          if (this.velArrow) this.velArrow.visible = false;
        }

        // B. 3D Fading Motion Trail
        if (this.showTrails !== 'off' && this.trailLine) {
          const maxPoints = this.showTrails === 'long' ? 240 : this.showTrails === 'medium' ? 120 : 60;
          this.trailPoints.push(curPos.clone());
          if (this.trailPoints.length > maxPoints) {
            this.trailPoints.shift();
          }

          const positions = new Float32Array(this.trailPoints.length * 3);
          for (let i = 0; i < this.trailPoints.length; i++) {
            positions[i * 3] = this.trailPoints[i].x;
            positions[i * 3 + 1] = this.trailPoints[i].y;
            positions[i * 3 + 2] = this.trailPoints[i].z;
          }

          this.trailLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          this.trailLine.geometry.attributes.position.needsUpdate = true;
          this.trailLine.visible = true;
        } else if (this.trailLine) {
          this.trailLine.visible = false;
        }

        this.lastObservedPos.copy(curPos);
      }
    } else {
      if (this.posArrow) this.posArrow.visible = false;
      if (this.velArrow) this.velArrow.visible = false;
      if (this.trailLine) this.trailLine.visible = false;
    }
  }

  cleanup() {
    this.lightingManager.dispose();
    this.textureManager.dispose();
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}

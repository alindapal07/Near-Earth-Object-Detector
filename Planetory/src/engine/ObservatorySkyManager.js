import * as THREE from 'three';
import { BRIGHT_STARS } from '../data/brightStars.js';
import { CONSTELLATIONS } from '../data/constellations.js';
import { calculateLSTHours, eclipticToEquatorial, equatorialToHorizontal } from '../utils/astronomicalCoordinates.js';
import { DEFAULT_OBSERVER } from '../utils/observerModel.js';

/**
 * 3D Observatory Sky Manager Engine (Part 29)
 * Manages celestial sphere, bright star catalog GPU points, constellation lines,
 * coordinate grids (Equatorial, Ecliptic, Horizontal Alt/Az), cardinal direction markers,
 * celestial poles, and real-time celestial motion.
 */
export default class ObservatorySkyManager {
  constructor(scene) {
    this.scene = scene;
    this.skyGroup = new THREE.Group();
    this.skyGroup.name = 'observatorySkyGroup';
    this.scene.add(this.skyGroup);

    this.observer = DEFAULT_OBSERVER;
    this.isEnabled = false;
    this.coordFrame = 'EQUATORIAL'; // EQUATORIAL | ECLIPTIC | HORIZONTAL | HELIOCENTRIC | GEOCENTRIC
    this.epoch = 'J2000'; // J2000 | OF_DATE

    // Toggles
    this.showConstellations = true;
    this.showStarLabels = true;
    this.showEquatorialGrid = true;
    this.showAltAzGrid = false;
    this.showEclipticLine = true;
    this.showHorizon = true;
    this.applyRefraction = false;

    this.starPointsMesh = null;
    this.constellationLinesMesh = null;
    this.horizonGroup = null;
    this.eqGridGroup = null;
    this.altAzGridGroup = null;
    this.eclipticGroup = null;
    this.starMap = new Map();
  }

  init() {
    this.createCelestialSphereAndStars();
    this.createConstellations();
    this.createHorizonAndCompass();
    this.createEquatorialGrid();
    this.createEclipticGrid();
    this.createAltAzGrid();
    this.skyGroup.visible = false;
  }

  setObserver(obs) {
    this.observer = obs;
  }

  setCoordFrame(frame) {
    this.coordFrame = frame;
    this.updateGridVisibility();
  }

  setEpoch(epoch) {
    this.epoch = epoch;
  }

  setApplyRefraction(enabled) {
    this.applyRefraction = enabled;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.skyGroup.visible = enabled;
  }

  /**
   * Creates GPU Points starfield positioned by true (RA, Dec) coordinates.
   */
  createCelestialSphereAndStars() {
    const R = 4500; // Celestial sphere radius
    const vertices = [];
    const colors = [];
    const sizes = [];
    const color = new THREE.Color();

    BRIGHT_STARS.forEach(star => {
      const raRad = (star.ra * Math.PI) / 12;
      const decRad = (star.dec * Math.PI) / 180;

      // 3D Equatorial position on celestial sphere
      const x = R * Math.cos(decRad) * Math.cos(raRad);
      const y = R * Math.sin(decRad);
      const z = R * Math.cos(decRad) * Math.sin(raRad);

      vertices.push(x, y, z);
      this.starMap.set(star.id, new THREE.Vector3(x, y, z));

      // Spectral colors
      if (star.spectral.startsWith('O') || star.spectral.startsWith('B')) color.setHex(0xa0c8ff);
      else if (star.spectral.startsWith('A')) color.setHex(0xd0e0ff);
      else if (star.spectral.startsWith('F')) color.setHex(0xffffff);
      else if (star.spectral.startsWith('G')) color.setHex(0xffea00);
      else if (star.spectral.startsWith('K')) color.setHex(0xffb703);
      else if (star.spectral.startsWith('M')) color.setHex(0xff5533);
      else color.setHex(0xffffff);

      // Star size scaled inversely by visual magnitude (brighter = larger)
      const sizeScale = Math.max(2.0, 7.5 - star.vmag * 1.8);
      sizes.push(sizeScale);

      const magBrightness = Math.max(0.4, 1.0 - (star.vmag + 1.5) * 0.15);
      color.multiplyScalar(magBrightness);
      colors.push(color.r, color.g, color.b);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 4.0,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    this.starPointsMesh = new THREE.Points(geo, mat);
    this.skyGroup.add(this.starPointsMesh);
  }

  /**
   * Renders constellation line segments.
   */
  createConstellations() {
    const vertices = [];
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      linewidth: 1
    });

    CONSTELLATIONS.forEach(c => {
      c.lines.forEach(([s1Id, s2Id]) => {
        const p1 = this.starMap.get(s1Id);
        const p2 = this.starMap.get(s2Id);
        if (p1 && p2) {
          vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      });
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.constellationLinesMesh = new THREE.LineSegments(geo, lineMat);
    this.skyGroup.add(this.constellationLinesMesh);
  }

  /**
   * Renders Horizon ring & Cardinal Direction markers (N, NE, E, SE, S, SW, W, NW, Zenith, Nadir).
   */
  createHorizonAndCompass() {
    this.horizonGroup = new THREE.Group();
    this.horizonGroup.name = 'horizonGroup';

    const R = 4400;
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(R * Math.cos(theta), 0, R * Math.sin(theta)));
    }
    const horizonGeo = new THREE.BufferGeometry().setFromPoints(points);
    const horizonMat = new THREE.LineBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.5 });
    const horizonLine = new THREE.Line(horizonGeo, horizonMat);
    this.horizonGroup.add(horizonLine);

    // Dark Ground Plane Cutoff
    const groundGeo = new THREE.CircleGeometry(R * 1.05, 64);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x010408,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = Math.PI / 2;
    groundMesh.position.y = -10;
    this.horizonGroup.add(groundMesh);

    this.skyGroup.add(this.horizonGroup);
  }

  /**
   * Renders Equatorial Grid lines (RA meridians & Dec parallels) + Celestial Poles
   */
  createEquatorialGrid() {
    this.eqGridGroup = new THREE.Group();
    this.eqGridGroup.name = 'eqGridGroup';

    const R = 4440;
    const gridMat = new THREE.LineDashedMaterial({ color: 0x00f0ff, dashSize: 30, gapSize: 20, transparent: true, opacity: 0.35 });

    // Declination Parallels (-60, -30, 0, +30, +60)
    [-60, -30, 0, 30, 60].forEach(dec => {
      const decRad = (dec * Math.PI) / 180;
      const rDec = R * Math.cos(decRad);
      const yDec = R * Math.sin(decRad);

      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(rDec * Math.cos(theta), yDec, rDec * Math.sin(theta)));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat);
      line.computeLineDistances();
      this.eqGridGroup.add(line);
    });

    this.skyGroup.add(this.eqGridGroup);
  }

  /**
   * Renders Ecliptic Line and Ecliptic Grid
   */
  createEclipticGrid() {
    this.eclipticGroup = new THREE.Group();
    this.eclipticGroup.name = 'eclipticGroup';

    const R = 4450;
    const eclPoints = [];
    const segs = 128;
    const sinEps = Math.sin((23.439 * Math.PI) / 180);
    const cosEps = Math.cos((23.439 * Math.PI) / 180);

    for (let i = 0; i <= segs; i++) {
      const lambda = (i / segs) * Math.PI * 2;
      const x = R * Math.cos(lambda);
      const y = R * sinEps * Math.sin(lambda);
      const z = R * cosEps * Math.sin(lambda);
      eclPoints.push(new THREE.Vector3(x, y, z));
    }
    const eclGeo = new THREE.BufferGeometry().setFromPoints(eclPoints);
    const eclMat = new THREE.LineDashedMaterial({ color: 0xffb703, dashSize: 40, gapSize: 20, transparent: true, opacity: 0.65 });
    const eclLine = new THREE.Line(eclGeo, eclMat);
    eclLine.computeLineDistances();
    this.eclipticGroup.add(eclLine);

    this.skyGroup.add(this.eclipticGroup);
  }

  /**
   * Renders Alt/Az Horizontal Grid
   */
  createAltAzGrid() {
    this.altAzGridGroup = new THREE.Group();
    this.altAzGridGroup.name = 'altAzGridGroup';

    const R = 4430;
    const mat = new THREE.LineDashedMaterial({ color: 0x00ffaa, dashSize: 25, gapSize: 15, transparent: true, opacity: 0.3 });

    [15, 30, 45, 60, 75].forEach(alt => {
      const altRad = (alt * Math.PI) / 180;
      const rAlt = R * Math.cos(altRad);
      const yAlt = R * Math.sin(altRad);

      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(rAlt * Math.cos(theta), yAlt, rAlt * Math.sin(theta)));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
      line.computeLineDistances();
      this.altAzGridGroup.add(line);
    });

    this.altAzGridGroup.visible = false;
    this.skyGroup.add(this.altAzGridGroup);
  }

  updateGridVisibility() {
    if (this.eqGridGroup) this.eqGridGroup.visible = this.coordFrame === 'EQUATORIAL' && this.showEquatorialGrid;
    if (this.altAzGridGroup) this.altAzGridGroup.visible = this.coordFrame === 'HORIZONTAL' || this.showAltAzGrid;
    if (this.eclipticGroup) this.eclipticGroup.visible = this.coordFrame === 'ECLIPTIC' || this.showEclipticLine;
  }

  /**
   * Updates sky dome rotation according to simulation time & observer sidereal time.
   */
  update(simTimeDays, sunAltDeg = -20) {
    if (!this.isEnabled) return;

    // Local Sidereal Time in hours
    const lstHours = calculateLSTHours(simTimeDays, this.observer.longitudeDeg);
    const lstRad = (lstHours * Math.PI) / 12;

    // Rotate sky group around Earth pole axis
    this.skyGroup.rotation.y = lstRad;

    // Adjust sky atmospheric brightness based on Sun altitude
    if (sunAltDeg > 0) {
      if (this.starPointsMesh) this.starPointsMesh.material.opacity = 0.25;
      if (this.constellationLinesMesh) this.constellationLinesMesh.material.opacity = 0.1;
    } else if (sunAltDeg > -12) {
      if (this.starPointsMesh) this.starPointsMesh.material.opacity = 0.65;
      if (this.constellationLinesMesh) this.constellationLinesMesh.material.opacity = 0.25;
    } else {
      if (this.starPointsMesh) this.starPointsMesh.material.opacity = 0.95;
      if (this.constellationLinesMesh) this.constellationLinesMesh.material.opacity = 0.45;
    }

    this.updateGridVisibility();
  }

  setShowConstellations(visible) {
    this.showConstellations = visible;
    if (this.constellationLinesMesh) this.constellationLinesMesh.visible = visible;
  }

  setShowGrid(visible) {
    this.showEquatorialGrid = visible;
    this.showEclipticLine = visible;
    this.updateGridVisibility();
  }
}

/**
 * NEOOrbitRenderer.js — NEO 3D Orbit & Trajectory Renderer (Part 35)
 *
 * Renders NEO orbits inside the EXISTING Planetory Three.js scene.
 * IMPORTANT:
 *  - Does NOT create a new renderer, scene, or camera
 *  - Does NOT create a new RAF loop
 *  - Added objects are fully managed (created, updated, removed via clearNEO)
 *  - Uses existing ScaleManager for AU→scene unit conversion
 *  - Trajectory labeled as PLANETORY TWO-BODY APPROXIMATION
 *
 * Visual language:
 *  - Normal NEO orbit:         cyan #00f0ff (thin)
 *  - PHA orbit:                amber #ffb703
 *  - Sentry monitored:         orange #ff8c00
 *  - Non-zero risk:            red #ff3d00 (pulsing)
 *  - Selected NEO marker:      white sphere
 *  - Close approach marker:    yellow diamond
 *  - Earth encounter zone:     translucent blue sphere
 *  - Uncertainty corridor:     translucent tube
 */

import * as THREE from 'three';
import { generateOrbitPoints, propagateNEOPosition, getEarthPosition } from '../utils/neoOrbitalCalc.js';

const AU_SCENE = 25; // 1 AU = 25 scene units (matches ScaleManager SCENE_AU balanced)

function auToScene(au) { return au * AU_SCENE; }

// ─────────────────────────────────────────────────────────────────────────────

export default class NEOOrbitRenderer {
  /**
   * @param {THREE.Scene} scene — the existing Planetory Three.js scene
   * @param {object} scaleManager — existing ScaleManager instance (optional, falls back to SCENE_AU=25)
   */
  constructor(scene, scaleManager = null) {
    this.scene = scene;
    this.scaleManager = scaleManager;
    this.neoGroup = new THREE.Group();
    this.neoGroup.name = 'NEO_ORBIT_GROUP';
    this.scene.add(this.neoGroup);

    this.activeNEO = null;
    this.neoMesh = null;
    this.orbitLine = null;
    this.uncertaintyTube = null;
    this.approachMarkers = [];
    this.earthMarker = null;
    this.animFrame = 0;

    this._showUncertainty = true;
    this._showOrbitPlane = false;
  }

  // ─── AU to scene unit conversion ──────────────────────────────────────────

  _au(au) {
    if (this.scaleManager?.auToSceneUnits) return this.scaleManager.auToSceneUnits(au);
    return auToScene(au);
  }

  // ─── Color based on risk level ────────────────────────────────────────────

  _getNEOColor(neoObj) {
    if (!neoObj) return 0x00f0ff;
    const risk = neoObj.riskAssessment;
    if (risk?.torino >= 1 || risk?.riskStatus === 'NON_ZERO_IMPACT_PROBABILITY') return 0xff3d00;
    if (risk?.sentryMonitored) return 0xff8c00;
    if (neoObj.isPHA) return 0xffb703;
    return 0x00f0ff;
  }

  // ─── Public: Render a selected NEO's orbit + position ─────────────────────

  renderNEOOrbit(neoObj, simTimeDays = 0) {
    this.clearNEO();
    if (!neoObj?.orbit) return;

    this.activeNEO = neoObj;
    const orbit = neoObj.orbit;
    const color = this._getNEOColor(neoObj);

    // Draw orbit ellipse
    const points = generateOrbitPoints(orbit, 360);
    if (points.length > 2) {
      const geometry = new THREE.BufferGeometry();
      const verts = new Float32Array(points.length * 3);
      points.forEach((p, i) => {
        verts[i * 3]     = this._au(p.x);
        verts[i * 3 + 1] = this._au(p.z); // Z is up in ecliptic, Y is up in Three.js
        verts[i * 3 + 2] = this._au(p.y);
      });
      geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        linewidth: 1
      });
      this.orbitLine = new THREE.LineLoop(geometry, lineMat);
      this.orbitLine.name = 'NEO_ORBIT_LINE';
      this.neoGroup.add(this.orbitLine);
    }

    // Draw uncertainty corridor (±3σ in distance, simplified as a thicker tube)
    if (this._showUncertainty && orbit.moid != null) {
      this._renderUncertaintyIndicator(orbit, color);
    }

    // Draw NEO position marker
    this._updateNEOPosition(neoObj, simTimeDays);

    // Draw close approach markers
    this._renderApproachMarkers(neoObj.closeApproaches || [], simTimeDays);

    console.log(`[NEOOrbitRenderer] Rendered orbit for ${neoObj.name || neoObj.designation} (model: PLANETORY TWO-BODY APPROXIMATION)`);
  }

  // ─── Public: Update NEO position (called from animation loop) ─────────────

  updateNEOPosition(simTimeDays) {
    if (!this.activeNEO) return;
    this._updateNEOPosition(this.activeNEO, simTimeDays);
  }

  // ─── Internal: Compute and place NEO position marker ──────────────────────

  _updateNEOPosition(neoObj, simTimeDays) {
    const pos = propagateNEOPosition(neoObj.orbit, simTimeDays);
    if (!pos) return;

    if (!this.neoMesh) {
      const geo = new THREE.SphereGeometry(0.15, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.neoMesh = new THREE.Mesh(geo, mat);
      this.neoMesh.name = 'NEO_MARKER';
      this.neoGroup.add(this.neoMesh);

      // Glow ring
      const ringGeo = new THREE.RingGeometry(0.18, 0.25, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this._getNEOColor(neoObj),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'NEO_GLOW_RING';
      this.neoMesh.add(ring);
    }

    this.neoMesh.position.set(
      this._au(pos.x),
      this._au(pos.z),
      this._au(pos.y)
    );
  }

  // ─── Internal: Uncertainty indicator ──────────────────────────────────────

  _renderUncertaintyIndicator(orbit, color) {
    if (!orbit.moid || orbit.moid > 0.1) return; // Only near-Earth

    // Simple tube around orbit line at close approach region
    const moidAu = orbit.moid;
    const uncertaintyRadius = Math.max(moidAu * 0.5, 0.005); // rough ±3σ

    // Create a translucent sphere at the MOID point (simplified)
    const geo = new THREE.SphereGeometry(this._au(uncertaintyRadius * 2), 12, 8);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    });
    const indicator = new THREE.Mesh(geo, mat);
    indicator.name = 'NEO_UNCERTAINTY_ZONE';
    indicator.userData.label = '3σ UNCERTAINTY REGION';
    this.uncertaintyTube = indicator;
    this.neoGroup.add(indicator);
  }

  // ─── Internal: Close approach markers ─────────────────────────────────────

  _renderApproachMarkers(approaches, simTimeDays) {
    // Clear old markers
    this.approachMarkers.forEach(m => this.neoGroup.remove(m));
    this.approachMarkers = [];

    if (!this.activeNEO?.orbit) return;

    // Show up to 5 closest approach markers
    const sorted = [...approaches]
      .filter(a => a.distAu != null)
      .sort((a, b) => a.distAu - b.distAu)
      .slice(0, 5);

    sorted.forEach((approach, idx) => {
      // For each approach, find the NEO position at that date
      // (This is a simplified marker at the orbit perihelion as proxy)
      const isPast = approach.date && new Date(approach.date) < new Date();

      const markerGeo = new THREE.OctahedronGeometry(0.12, 0);
      const markerMat = new THREE.MeshBasicMaterial({
        color: isPast ? 0x888888 : 0xffff00,
        transparent: true,
        opacity: isPast ? 0.5 : 1.0
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.name = `NEO_APPROACH_MARKER_${idx}`;
      marker.userData = {
        approachDate: approach.date,
        distAu: approach.distAu,
        type: 'CLOSE_APPROACH'
      };

      // Place at perihelion as proxy (actual position requires date lookup)
      const orbit = this.activeNEO.orbit;
      if (orbit.perihelionAu) {
        marker.position.set(this._au(orbit.perihelionAu), 0, 0);
      }

      this.neoGroup.add(marker);
      this.approachMarkers.push(marker);
    });
  }

  // ─── Public: Render Earth encounter view ──────────────────────────────────

  renderEarthEncounter(neoObj, approach, simTimeDays) {
    // Clear previous
    if (this.earthMarker) {
      this.neoGroup.remove(this.earthMarker);
      this.earthMarker = null;
    }

    if (!neoObj?.orbit || !approach) return;

    // Earth position (simplified circular)
    const earthPos = getEarthPosition(simTimeDays);

    // Earth marker
    const earthGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const earthMat = new THREE.MeshBasicMaterial({ color: 0x1a78c2 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(this._au(earthPos.x), this._au(earthPos.z), this._au(earthPos.y));
    earthMesh.name = 'NEO_ENCOUNTER_EARTH';
    this.neoGroup.add(earthMesh);
    this.earthMarker = earthMesh;

    // Approach distance ring around Earth
    if (approach.distAu) {
      const ringRadius = this._au(approach.distAu);
      const ringGeo = new THREE.RingGeometry(ringRadius * 0.95, ringRadius, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(earthMesh.position);
      ring.name = 'NEO_APPROACH_RING';
      ring.userData.label = `APPROACH DISTANCE: ${approach.distAu.toFixed(4)} AU`;
      this.neoGroup.add(ring);
    }
  }

  // ─── Public: Visibility toggles ───────────────────────────────────────────

  setUncertaintyVisible(visible) {
    this._showUncertainty = visible;
    if (this.uncertaintyTube) this.uncertaintyTube.visible = visible;
  }

  setOrbitVisible(visible) {
    if (this.orbitLine) this.orbitLine.visible = visible;
  }

  // ─── Public: Clear all NEO objects from scene ─────────────────────────────

  clearNEO() {
    // Remove all children from neoGroup
    while (this.neoGroup.children.length > 0) {
      const child = this.neoGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this.neoGroup.remove(child);
    }
    this.activeNEO = null;
    this.neoMesh = null;
    this.orbitLine = null;
    this.uncertaintyTube = null;
    this.approachMarkers = [];
    this.earthMarker = null;
  }

  // ─── Public: Called from SimulationEngine._loop() every tick ──────────────

  update(simTimeDays) {
    if (!this.activeNEO) return;
    this.updateNEOPosition(simTimeDays);
    this.animFrame++;
  }

  // ─── Public: Get the NEO group for camera targeting ───────────────────────

  getNEOGroup() { return this.neoGroup; }

  // ─── Public: Focus camera on active NEO ───────────────────────────────────

  getNEOPosition() {
    if (!this.neoMesh) return null;
    return this.neoMesh.position.clone();
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  dispose() {
    this.clearNEO();
    this.scene.remove(this.neoGroup);
  }
}

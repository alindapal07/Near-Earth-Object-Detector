/**
 * SpacecraftRenderer.js – Mission 3D Visualization Layer (Part 34)
 *
 * Renders inside the EXISTING Planetory Three.js scene/renderer/camera/RAF loop.
 * No new requestAnimationFrame. No new scene. No new renderer. No new clock.
 *
 * Provides:
 *  • Hohmann transfer arc   (TRAVELED cyan | REMAINING amber/dashed)
 *  • Spacecraft mesh        (gold cylinder + dish + wings + glow)
 *  • Velocity vector arrow  (toggleable)
 *  • SOI boundary ring      (toggleable, auto-sized)
 *  • Event / milestone markers along trajectory
 *  • Mission labels (HTML/CSS overlays driven by 3D world positions)
 *  • Catalog spacecraft (Voyager, Cassini, …)
 *  • Full resource disposal on trajectory/mission reset
 */

import * as THREE from 'three';
import MissionEngine from './MissionEngine';
import { calculateHohmannTransfer } from '../utils/hohmannTransfer';
import { activeSpacecraftModel } from './SpacecraftModel';

// ─── Constants ────────────────────────────────────────────────────────────────
const AU_SCENE = 200; // scene units per AU (must match ScaleManager)

// ─── Helper: AU → scene vector ────────────────────────────────────────────────
function auToScene(x, y, z = 0, scaleManager = null) {
  if (scaleManager && scaleManager.astronomicalToScene) {
    return scaleManager.astronomicalToScene(x, y, z);
  }
  return new THREE.Vector3(x * AU_SCENE, z * AU_SCENE, -y * AU_SCENE);
}

// ─── Helper: build a simple sprite label ─────────────────────────────────────
function makeLabelSprite(text, color = '#00f0ff', fontSize = 22) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 40);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(20, 5, 1);
  return sprite;
}

export default class SpacecraftRenderer {
  constructor(scene, scaleManager) {
    this.scene = scene;
    this.scaleManager = scaleManager;

    // ── Permanent groups (never disposed) ─────────────────────────────────────
    this.spacecraftGroup  = new THREE.Group(); this.spacecraftGroup.name  = 'sc_group';
    this.catalogGroup     = new THREE.Group(); this.catalogGroup.name     = 'catalog_group';
    this.scene.add(this.spacecraftGroup);
    this.scene.add(this.catalogGroup);

    // ── Mission-owned groups (disposed on reset/recalculate) ──────────────────
    this.missionGroup = new THREE.Group(); this.missionGroup.name = 'mission_group';
    this.scene.add(this.missionGroup);

    // Sub-groups inside missionGroup
    this.trajectoryGroup = new THREE.Group(); this.trajectoryGroup.name = 'traj_group';
    this.eventGroup      = new THREE.Group(); this.eventGroup.name      = 'event_group';
    this.soiGroup        = new THREE.Group(); this.soiGroup.name        = 'soi_group';
    this.labelGroup      = new THREE.Group(); this.labelGroup.name      = 'label_group';
    this.missionGroup.add(this.trajectoryGroup, this.eventGroup, this.soiGroup, this.labelGroup);

    // ── Spacecraft meshes ──────────────────────────────────────────────────────
    this.spacecraftMeshes = new Map(); // catalog spacecraft
    this.activeMesh       = null;      // active mission spacecraft
    this.velocityArrow    = null;

    // ── Trajectory lines (reused geometries updated via BufferAttribute) ───────
    this.traveledLine   = null; // cyan  – traveled portion
    this.remainingLine  = null; // amber – remaining portion
    this._trajPoints    = [];   // cached [ {x,y,z} ] in AU
    this._trajProgress  = -1;   // last rendered progress fraction (0–1)

    // ── Toggle states ─────────────────────────────────────────────────────────
    this.showVelocityVectors = true;
    this.showSOI             = true;

    // ── Active transfer result cache ───────────────────────────────────────────
    this._transferResult = null;

    // ── Camera-targeted mesh refs ──────────────────────────────────────────────
    this.cameraMesh = null; // set when focusSpacecraft() called externally

    this._initCatalogSpacecraft();
    this._initActiveMissionSpacecraft();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════════════════

  _initCatalogSpacecraft() {
    const missions = MissionEngine.getMissions();
    missions.forEach(mission => {
      const g = new THREE.Group();
      g.name = `spacecraft_${mission.id}`;

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff, emissive: 0x0088cc, emissiveIntensity: 0.6,
        metalness: 0.8, roughness: 0.2
      });
      const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 1), bodyMat);
      g.add(body);

      const wingMat = new THREE.MeshStandardMaterial({ color: 0x061830, emissive: 0x004488, metalness: 0.9, roughness: 0.1 });
      const wings = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 0.6), wingMat);
      g.add(wings);

      g.add(new THREE.PointLight(0x00f0ff, 1.5, 5.0));

      this.catalogGroup.add(g);
      this.spacecraftMeshes.set(mission.id, g);
    });
  }

  _initActiveMissionSpacecraft() {
    const g = new THREE.Group();
    g.name = 'spacecraft_active';

    // Core body
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0x996600, metalness: 0.95, roughness: 0.15
    });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.4, 8), coreMat);
    g.add(core);

    // High-gain dish
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 })
    );
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, 0, 0.9);
    g.add(dish);

    // Solar wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x002244, emissive: 0x0044aa });
    const wings = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 0.8), wingMat);
    g.add(wings);

    // Glow beacon
    g.add(new THREE.PointLight(0x00f0ff, 2.5, 10.0));

    // Velocity arrow (starts hidden)
    this.velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      3.5, 0x00f0ff, 0.8, 0.4
    );
    this.velocityArrow.visible = this.showVelocityVectors;
    g.add(this.velocityArrow);

    g.visible = false; // hidden until mission starts
    this.spacecraftGroup.add(g);
    this.activeMesh = g;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC API – called from SimulationEngine._loop() every frame
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Main per-frame update. Called by SimulationEngine._loop().
   * @param {number} simTimeDays
   */
  update(simTimeDays = 0) {
    // 1. Catalog spacecraft (historical probes)
    this._updateCatalogSpacecraft(simTimeDays);

    // 2. Active mission spacecraft & trajectory
    if (activeSpacecraftModel && this._transferResult) {
      this.activeMesh.visible = true;
      this._updateActiveMission();
    } else {
      this.activeMesh.visible = false;
    }
  }

  _updateCatalogSpacecraft(simTimeDays) {
    const missions = MissionEngine.getMissions();
    missions.forEach(mission => {
      const state = MissionEngine.getSpacecraftState(mission.id, simTimeDays);
      const mesh  = this.spacecraftMeshes.get(mission.id);
      if (!mesh || !state?.position) return;
      const pos = auToScene(state.position.x, state.position.y, state.position.z, this.scaleManager);
      mesh.position.copy(pos);
      mesh.rotation.y += 0.01;
    });
  }

  _updateActiveMission() {
    const sc  = activeSpacecraftModel;
    const pos = auToScene(sc.position.x, sc.position.y, sc.position.z, this.scaleManager);

    // ── Spacecraft position & orientation ──────────────────────────────────────
    this.activeMesh.position.copy(pos);

    // Smooth orientation toward velocity direction (SLERP)
    const v     = sc.velocity;
    const speed = Math.max(0.001, sc.speedKmS);
    if (speed > 0.001) {
      const vDirScene = new THREE.Vector3(v.vx / speed, 0, -v.vy / speed);
      if (vDirScene.lengthSq() > 1e-6) {
        vDirScene.normalize();
        const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), vDirScene);
        this.activeMesh.quaternion.slerp(targetQ, 0.05);
      }
    }

    // ── Velocity arrow ─────────────────────────────────────────────────────────
    if (this.velocityArrow) {
      this.velocityArrow.visible = this.showVelocityVectors;
      if (this.showVelocityVectors && speed > 0.001) {
        const dir = new THREE.Vector3(v.vx / speed, 0, -v.vy / speed).normalize();
        if (dir.lengthSq() > 1e-6) this.velocityArrow.setDirection(dir);
      }
    }

    // ── Trajectory progress lines ─────────────────────────────────────────────
    const progress = Math.max(0, Math.min(1, sc.progressPct / 100));
    if (Math.abs(progress - this._trajProgress) > 0.001) {
      this._updateTrajProgress(progress);
      this._trajProgress = progress;
    }

    // ── SOI visual ────────────────────────────────────────────────────────────
    this._updateSOIVisual(pos);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TRAJECTORY LINE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Build full trajectory from transfer result. Disposes old lines first.
   * Called when user clicks CALCULATE & PLOT 3D.
   */
  renderMissionTrajectory(transferResult) {
    this._transferResult = transferResult;
    this._disposeMissionAssets();

    if (!transferResult || !transferResult.valid) return;

    const pts = transferResult.trajectoryPoints || [];
    if (pts.length < 2) return;

    this._trajPoints = pts;
    this._trajProgress = -1; // force re-render

    const scenePts = pts.map(p => auToScene(p.x, p.y, p.z, this.scaleManager));

    // ── Remaining trajectory (full arc, amber dashed) ─────────────────────────
    {
      const geo = new THREE.BufferGeometry().setFromPoints(scenePts);
      const mat = new THREE.LineDashedMaterial({
        color: 0xffb703, linewidth: 1,
        dashSize: 4, gapSize: 3,
        transparent: true, opacity: 0.55
      });
      this.remainingLine = new THREE.Line(geo, mat);
      this.remainingLine.computeLineDistances();
      this.remainingLine.name = 'traj_remaining';
      this.trajectoryGroup.add(this.remainingLine);
    }

    // ── Traveled trajectory (starts empty, cyan solid) ────────────────────────
    {
      // Pre-allocate max positions; we'll shrink the draw range each frame
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(scenePts.length * 3);
      scenePts.forEach((p, i) => { positions[i*3]=p.x; positions[i*3+1]=p.y; positions[i*3+2]=p.z; });
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setDrawRange(0, 0); // start empty
      const mat = new THREE.LineBasicMaterial({
        color: 0x00f0ff, linewidth: 2.5,
        transparent: true, opacity: 0.95
      });
      this.traveledLine = new THREE.Line(geo, mat);
      this.traveledLine.name = 'traj_traveled';
      this.trajectoryGroup.add(this.traveledLine);
    }

    // ── Event milestone markers ────────────────────────────────────────────────
    this._placeEventMarkers(pts, transferResult);

    // ── Labels ────────────────────────────────────────────────────────────────
    this._placeLabels(pts, transferResult);
  }

  /** Update draw range of traveled/remaining lines based on mission progress */
  _updateTrajProgress(progress) {
    if (!this.traveledLine || !this.remainingLine) return;
    const total   = this._trajPoints.length;
    const travelN = Math.max(1, Math.round(progress * total));

    // Traveled: draw first N points
    this.traveledLine.geometry.setDrawRange(0, travelN);
    this.traveledLine.geometry.attributes.position.needsUpdate = true;

    // Remaining: draw from traveled index to end (use vertexColors trick via opacity not possible;
    // simpler: keep full remaining line, fade leading portion via opacity)
    // We keep the full remaining arc visible but we'll hide traveled portion
    // by adjusting draw range on remainingLine to start from travelN
    if (this.remainingLine.geometry) {
      this.remainingLine.geometry.setDrawRange(Math.max(0, travelN - 1), total - Math.max(0, travelN - 1));
      this.remainingLine.geometry.attributes.position.needsUpdate = true;
    }
  }

  // ── Event / milestone markers ──────────────────────────────────────────────
  _placeEventMarkers(pts, transfer) {
    const events = [
      { frac: 0,    label: 'DEPARTURE', color: 0x00ffaa },
      { frac: 0.5,  label: 'MID-COURSE',color: 0xffb703 },
      { frac: 1.0,  label: 'ARRIVAL',   color: 0xff6b35 }
    ];

    events.forEach(ev => {
      const idx = Math.min(pts.length - 1, Math.round(ev.frac * (pts.length - 1)));
      const pt  = pts[idx];
      if (!pt) return;
      const scPos = auToScene(pt.x, pt.y, pt.z, this.scaleManager);

      // Sphere marker
      const geo = new THREE.SphereGeometry(1.2, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: ev.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(scPos);
      mesh.name = `event_${ev.label}`;
      this.eventGroup.add(mesh);

      // Ring pulse
      const ringGeo = new THREE.RingGeometry(2, 2.5, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: ev.color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(scPos);
      this.eventGroup.add(ring);

      // Label sprite
      const sprite = makeLabelSprite(ev.label, `#${ev.color.toString(16).padStart(6,'0')}`);
      sprite.position.copy(scPos).y += 4;
      sprite.name = `label_ev_${ev.label}`;
      this.labelGroup.add(sprite);
    });
  }

  _placeLabels(pts, transfer) {
    // Spacecraft label (position updates every frame would require tracking,
    // so we add a static label that we reposition in _updateActiveMission if needed)
    // For now, add static origin/dest labels via sprite
    const depPt = pts[0];
    const arrPt = pts[pts.length - 1];
    if (!depPt || !arrPt) return;

    const depPos = auToScene(depPt.x, depPt.y, depPt.z, this.scaleManager);
    const arrPos = auToScene(arrPt.x, arrPt.y, arrPt.z, this.scaleManager);

    const originName = (transfer.origin || 'EARTH').toUpperCase();
    const destName   = (transfer.destination || 'MARS').toUpperCase();

    const lOrigin = makeLabelSprite(originName, '#64b5f6');
    lOrigin.position.copy(depPos).y += 6;
    this.labelGroup.add(lOrigin);

    const lDest = makeLabelSprite(destName, '#ff8a65');
    lDest.position.copy(arrPos).y += 6;
    this.labelGroup.add(lDest);
  }

  // ── SOI Visual ────────────────────────────────────────────────────────────
  _updateSOIVisual(scPosScene) {
    // Clear old SOI ring
    this._clearGroup(this.soiGroup);
    if (!this.showSOI) return;
    if (!activeSpacecraftModel?.currentSOI?.isPlanetRelative) return;

    const { bodyId, color = '#00f0ff' } = activeSpacecraftModel.currentSOI;

    // Estimate SOI radius in scene units from AU
    const rSoiAu = activeSpacecraftModel.currentSOI.soiRadiusKm / 149597870.7;
    const rSoiScene = rSoiAu * AU_SCENE;

    // Find planet mesh in scene for position
    const planetMesh = this.scene.getObjectByName(`planet_${bodyId}`) ||
                       this.scene.getObjectByName(bodyId);

    let ringCenter = scPosScene.clone();
    if (planetMesh) {
      planetMesh.updateMatrixWorld(true);
      planetMesh.getWorldPosition(ringCenter);
    }

    const soiGeo = new THREE.RingGeometry(Math.max(5, rSoiScene * 0.98), Math.max(5.5, rSoiScene), 64);
    const soiMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide, transparent: true, opacity: 0.35
    });
    const ring = new THREE.Mesh(soiGeo, soiMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(ringCenter);
    this.soiGroup.add(ring);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC CONTROL API (called from MissionControlPanel via solarSystemRef)
  // ══════════════════════════════════════════════════════════════════════════

  setShowVelocityVectors(enabled) {
    this.showVelocityVectors = enabled;
    if (this.velocityArrow) this.velocityArrow.visible = enabled;
  }

  setShowSOI(enabled) {
    this.showSOI = enabled;
    if (!enabled) this._clearGroup(this.soiGroup);
  }

  clearMission() {
    this._transferResult  = null;
    this._trajPoints      = [];
    this._trajProgress    = -1;
    this.activeMesh.visible = false;
    this._disposeMissionAssets();
  }

  /** Legacy – called from MissionPlannerModal.onPlotTransfer callback */
  renderHohmannTransferArc(originId = 'earth', destinationId = 'mars') {
    const transfer = calculateHohmannTransfer(originId, destinationId);
    if (transfer?.valid) {
      this.renderMissionTrajectory(transfer);
    }
  }

  /** Get the active spacecraft Three.js group (for CameraManager.focusObject) */
  getActiveMesh() { return this.activeMesh; }

  // ══════════════════════════════════════════════════════════════════════════
  // RESOURCE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  _disposeMissionAssets() {
    // Dispose trajectory lines
    [this.traveledLine, this.remainingLine].forEach(line => {
      if (!line) return;
      line.geometry?.dispose();
      line.material?.dispose();
    });
    this.traveledLine  = null;
    this.remainingLine = null;

    // Clear groups (dispose geometries/materials)
    [this.trajectoryGroup, this.eventGroup, this.soiGroup, this.labelGroup].forEach(g => {
      this._clearGroup(g);
    });
  }

  _clearGroup(group) {
    while (group.children.length > 0) {
      const obj = group.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
      group.remove(obj);
    }
  }

  /** Full cleanup when engine disposes */
  dispose() {
    this._disposeMissionAssets();
    this._clearGroup(this.spacecraftGroup);
    this._clearGroup(this.catalogGroup);
    this.scene.remove(this.spacecraftGroup, this.catalogGroup, this.missionGroup);
  }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer }   from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass }       from 'three/examples/jsm/postprocessing/OutputPass.js';
import SceneManager from './SceneManager';
import InteractionManager from './InteractionManager';
import CameraManager from './CameraManager';
import SimulationClock from './SimulationClock';
import SpacecraftRenderer from './SpacecraftRenderer';
import NEOOrbitRenderer from './NEOOrbitRenderer';

export default class SimulationEngine {
  constructor(container, onSelectObject) {
    this.container = container;
    this.onSelectObject = onSelectObject;

    // Core Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a);

    // Camera (Req 50: Deep Zoom support down to 0.05)
    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.05, 25000
    );
    this.camera.position.set(0, 60, 180);

    // Renderer — correct output color space for Three.js r152+
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Post-processing pipeline (CINEMATIC mode by default)
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(resolution, 0.45, 0.35, 0.88);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
    this.renderQuality = 'CINEMATIC';

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxDistance = 10000;
    this.controls.minDistance = 0.05;
    this.controls.zoomSpeed = 1.2;

    // Modular Managers & Engine
    this.sceneManager = new SceneManager(this.scene, this.renderer);
    this.cameraManager = new CameraManager(this.camera, this.controls, this.renderer.domElement);
    this.spacecraftRenderer = new SpacecraftRenderer(this.scene, this.sceneManager.scaleManager);
    this.simulationClock = new SimulationClock();

    // NEO Orbit Renderer — Part 35 (hooks into existing scene, no new RAF loop)
    this.neoOrbitRenderer = new NEOOrbitRenderer(this.scene, this.sceneManager.scaleManager);

    this.interactionManager = new InteractionManager(
      this.camera,
      this.sceneManager.getInteractableObjects(),
      this.renderer.domElement,
      this.handleSelect.bind(this)
    );

    this.animationFrameId = null;
    this.scaleMode = 'balanced';

    window.addEventListener('resize', this._onResize.bind(this));
  }

  init() {
    this.sceneManager.init(this.scaleMode);
    this._loop();
  }

  // ─── Select & Camera Focus ─────────────────────────────────────────────────

  handleSelect(objectData, instanceId) {
    if (instanceId !== undefined) {
      const asteroid = this.sceneManager.getAsteroidByInstanceId(instanceId);
      if (asteroid) {
        if (this.onSelectObject) this.onSelectObject(asteroid);
        this.sceneManager.showTrajectory(asteroid);
        this.sceneManager.setSelectedObject(null);
      }
    } else if (objectData) {
      if (this.onSelectObject) this.onSelectObject(objectData);
      this.sceneManager.clearTrajectory();
      this.focusOnObject(objectData.id || objectData.spkid || objectData.name);
    } else {
      if (this.onSelectObject) this.onSelectObject(null);
      this.cameraManager.resetCamera();
      this.sceneManager.clearTrajectory();
      this.sceneManager.setSelectedObject(null);
    }
  }

  focusOnObject(id) {
    const mesh = this.sceneManager.getObjectMesh(id);
    if (mesh) {
      this.sceneManager.setSelectedObject(id);
      // Get the actual render radius for this object from ScaleManager
      const renderRadius = this.sceneManager.getObjectRenderRadius(id);
      this.cameraManager.focusObject(mesh, id, renderRadius);
    }
  }

  focusOnPosition(x, y, z, distance = 20) {
    this.cameraManager.focusPosition(x, y, z, distance);
  }

  setFollowObject(enabled) {
    this.cameraManager.setFollow(enabled);
  }

  resetCamera() {
    this.cameraManager.resetCamera();
    this.sceneManager.clearTrajectory();
    this.sceneManager.setSelectedObject(null);
  }

  // ─── Mission Control APIs ──────────────────────────────────────────────────

  /** Plot a transfer trajectory in 3D from a pre-calculated transferResult object */
  plotMissionTrajectory(transferResult) {
    if (this.spacecraftRenderer && transferResult?.valid) {
      this.spacecraftRenderer.renderMissionTrajectory(transferResult);
    }
  }

  /** Clear mission trajectory and hide spacecraft */
  clearMission() {
    if (this.spacecraftRenderer) this.spacecraftRenderer.clearMission();
  }

  /** Toggle velocity vector display on active spacecraft */
  setMissionVelocityVectors(enabled) {
    if (this.spacecraftRenderer) this.spacecraftRenderer.setShowVelocityVectors(enabled);
  }

  /** Toggle SOI boundary ring display */
  setMissionSOI(enabled) {
    if (this.spacecraftRenderer) this.spacecraftRenderer.setShowSOI(enabled);
  }

  /** Camera: focus active spacecraft in FOLLOWING mode */
  focusActiveMission() {
    if (!this.spacecraftRenderer) return;
    const mesh = this.spacecraftRenderer.getActiveMesh();
    if (mesh && mesh.visible) {
      this.cameraManager.targetMesh = mesh;
      this.cameraManager.targetId   = 'spacecraft_active';
      this.cameraManager.focusDistance = 18;
      mesh.updateMatrixWorld(true);
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      this.cameraManager.state            = 'FOCUSING';
      this.cameraManager.transitionStart  = performance.now();
      this.cameraManager.startCamPos.copy(this.camera.position);
      this.cameraManager.startTargetPos.copy(this.controls.target);
      const dir = this.camera.position.clone().sub(worldPos).normalize();
      if (dir.y < 0.2) dir.y = 0.3; dir.normalize();
      this.cameraManager.desiredOffset.copy(dir.multiplyScalar(18));
      this.cameraManager.followOffset = this.cameraManager.desiredOffset.clone();
    }
  }

  /** Camera: frame entire mission (Sun + Earth + Mars + trajectory) */
  focusMissionOverview() {
    // Pull back to view full solar system at modest distance
    this.cameraManager.resetCamera();
    this.camera.position.set(0, 160, 400);
    this.controls.target.set(0, 0, 0);
  }

  /** Camera: follow active spacecraft */
  followSpacecraft() {
    if (!this.spacecraftRenderer) return;
    const mesh = this.spacecraftRenderer.getActiveMesh();
    if (mesh && mesh.visible) {
      this.cameraManager.focusObject(mesh, 'spacecraft_active', 8);
      this.cameraManager.setFollow(true);
    }
  }

  // ─── API & Catalog Loads ──────────────────────────────────────────────────

  loadCatalogAsteroids(data) {
    this.sceneManager.loadCatalogAsteroids(data);
    this.interactionManager.updateObjects(this.sceneManager.getInteractableObjects());
  }

  addComets(data) {
    this.sceneManager.addComets(data);
    this.interactionManager.updateObjects(this.sceneManager.getInteractableObjects());
  }

  setAppMode(mode) {
    this.appMode = mode;
    this.sceneManager.setAppMode(mode);
    this.cameraManager.setAppMode(mode);
  }

  setObserver(obs) {
    this.sceneManager.setObserver(obs);
  }

  setSkyToggles({ showConstellations, showGrid }) {
    if (this.sceneManager.observatorySkyManager) {
      if (showConstellations !== undefined) this.sceneManager.observatorySkyManager.setShowConstellations(showConstellations);
      if (showGrid !== undefined) this.sceneManager.observatorySkyManager.setShowGrid(showGrid);
    }
  }

  setScaleMode(mode) {
    this.scaleMode = mode;
    this.sceneManager.updateScale(mode);
  }

  setSimulationTime(timeDays) {
    this.simulationClock.setSimTimeDays(timeDays);
  }

  setSpeed(speed) {
    this.simulationClock.setSpeed(speed);
  }

  setPaused(paused) {
    this.simulationClock.setPaused(paused);
  }

  setOrbitLinesVisible(v) {
    this.sceneManager.setOrbitLinesVisible(v);
  }

  setAsteroidBeltVisible(v) {
    this.sceneManager.setAsteroidBeltVisible(v);
  }

  setCatalogVisible(v) {
    this.sceneManager.setCatalogVisible(v);
  }

  setMoonsVisible(v) {
    this.sceneManager.setMoonsVisible(v);
  }

  setSatellitesVisible(v) {
    this.sceneManager.setSatellitesVisible(v);
  }

  showTrajectoryForAsteroid(data) {
    this.sceneManager.showTrajectory(data);
  }

  // ─── NEO Orbit API (Part 35) ────────────────────────────────────────────────

  /** Render a canonical NEO object's orbit in the existing 3D scene. */
  renderNEOOrbit(neoObj, simTimeDays = 0) {
    if (!this.neoOrbitRenderer) return;
    this.neoOrbitRenderer.renderNEOOrbit(neoObj, simTimeDays);
  }

  /** Clear active NEO orbit from scene. */
  clearNEO() {
    if (!this.neoOrbitRenderer) return;
    this.neoOrbitRenderer.clearNEO();
  }

  /** Focus camera on the current NEO position. */
  focusNEO() {
    if (!this.neoOrbitRenderer) return;
    const pos = this.neoOrbitRenderer.getNEOPosition();
    if (pos) {
      this.cameraManager.focusOnPosition(pos.x, pos.y, pos.z, 20);
    }
  }

  /** Render Earth close encounter for selected approach. */
  renderEarthEncounter(neoObj, approach, simTimeDays) {
    if (!this.neoOrbitRenderer) return;
    this.neoOrbitRenderer.renderEarthEncounter(neoObj, approach, simTimeDays);
  }

  /** Get NEO orbit overview camera target (Sun + Earth + NEO framed). */
  focusNEOOverview() {
    this.cameraManager.resetToOverview ? this.cameraManager.resetToOverview() : this.cameraManager.resetCamera?.();
  }

  /** Toggle NEO uncertainty corridor visibility. */
  setNEOUncertaintyVisible(visible) {
    if (this.neoOrbitRenderer) this.neoOrbitRenderer.setUncertaintyVisible(visible);
  }

  // ─── Main Central Animation Loop (Req 24, 80) ─────────────────────────────

  _loop = () => {
    this.animationFrameId = requestAnimationFrame(this._loop);

    // 1. Advance simulation clock
    const currentSimDays = this.simulationClock.update();

    // 2. Update scene celestial positions & lighting
    this.sceneManager.update(currentSimDays);

    // 3. Update spacecraft positions & trajectory curves
    if (this.spacecraftRenderer) {
      this.spacecraftRenderer.update(currentSimDays);
    }

    // 3b. Update NEO orbit position (Part 35)
    if (this.neoOrbitRenderer) {
      this.neoOrbitRenderer.update(currentSimDays);
    }

    // 4. Update camera focus & follow motion
    this.cameraManager.update();

    // 5. Update OrbitControls
    this.controls.update();

    // 6. Render via post-processing composer (or bare renderer in PERFORMANCE mode)
    if (this.composer && this.renderQuality !== 'PERFORMANCE') {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) this.composer.setSize(w, h);
  }

  /**
   * Set render quality preset.
   * CINEMATIC: full bloom, high DPR
   * BALANCED:  moderate bloom
   * PERFORMANCE: no composer, lower DPR
   */
  setRenderQuality(mode) {
    this.renderQuality = mode;
    if (mode === 'CINEMATIC') {
      this.bloomPass.strength = 0.45;
      this.bloomPass.radius   = 0.35;
      this.bloomPass.threshold = 0.88;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } else if (mode === 'BALANCED') {
      this.bloomPass.strength = 0.28;
      this.bloomPass.radius   = 0.25;
      this.bloomPass.threshold = 0.90;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
      // PERFORMANCE
      this.renderer.setPixelRatio(1);
    }
  }

  cleanup() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this._onResize.bind(this));
    this.interactionManager.cleanup();
    this.sceneManager.cleanup();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

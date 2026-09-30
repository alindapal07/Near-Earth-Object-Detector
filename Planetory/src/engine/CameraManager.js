import * as THREE from 'three';

export default class CameraManager {
  constructor(camera, controls, domElement) {
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.targetMesh = null;
    this.targetId = null;
    this.isFollowing = false;
    this.focusDistance = 30;
    this.defaultCamPos = new THREE.Vector3(0, 60, 180);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);

    this.dampingFactor = 0.06;
    this.keysPressed = {};

    // Camera State Machine (FREE | FOCUSING | FOLLOWING | ORBITING | OBSERVATORY)
    this.state = 'FREE';
    this.statusText = 'FREE CAMERA';

    // Transition state
    this.transitionStart = 0;
    this.transitionDuration = 1400; // ms
    this.startCamPos = new THREE.Vector3();
    this.startTargetPos = new THREE.Vector3();
    this.desiredOffset = new THREE.Vector3(0, 15, 30);
    this.followOffset = null;
    this.orbitAngle = 0;

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.domElement) return;

    // Keyboard Control Listener
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      this.keysPressed[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keysPressed = {};
    });

    // Pointer down interrupts automatic focus transition so user maintains control
    this.domElement.addEventListener('pointerdown', (e) => {
      if (this.state === 'FOCUSING') {
        this.state = this.isFollowing ? 'FOLLOWING' : 'FREE';
        this.statusText = this.isFollowing ? 'FOLLOWING' : 'FREE CAMERA';
      }
      // Update follow offset if user manual drag starts
      if (this.isFollowing && this.targetMesh) {
        this.targetMesh.updateMatrixWorld(true);
        const worldPos = new THREE.Vector3();
        this.targetMesh.getWorldPosition(worldPos);
        this.followOffset = this.camera.position.clone().sub(worldPos);
      }
    });

    // Track mouse position in NDC coordinates [-1, 1]
    this.domElement.addEventListener('mousemove', (e) => {
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    // Cursor-centered dolly zoom
    this.domElement.addEventListener('wheel', (e) => {
      // If following, mouse wheel adjusts follow distance
      if (this.targetMesh && this.isFollowing) {
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        if (this.followOffset) {
          this.followOffset.multiplyScalar(zoomFactor);
          // Clamp distance
          const len = this.followOffset.length();
          if (len < 1.0) this.followOffset.setLength(1.0);
          if (len > 15000) this.followOffset.setLength(15000);
        }
        return;
      }

      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

      // Raycast to find 3D point under cursor
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.controls.scene?.children || [], true);

      let targetPoint;
      if (intersects.length > 0) {
        targetPoint = intersects[0].point.clone();
      } else {
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()).negate(),
          this.controls.target
        );
        targetPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, targetPoint);
      }

      if (!targetPoint) return;

      const camRay = this.camera.position.clone().sub(targetPoint);
      const newCamPos = targetPoint.clone().add(camRay.multiplyScalar(zoomFactor));
      
      if (newCamPos.length() > 0.1 && newCamPos.length() < 30000) {
        this.camera.position.copy(newCamPos);
        this.controls.target.lerp(targetPoint, 0.15);
      }
    }, { passive: false });
  }

  // Programmatic Camera Operations
  orbit(deltaTheta, deltaPhi) {
    if (!this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += deltaTheta;
    spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi + deltaPhi));
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();

    if (this.isFollowing) {
      this.followOffset = offset.clone();
    }
  }

  pan(deltaX, deltaY) {
    if (!this.controls) return;
    const offset = new THREE.Vector3();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const dist = this.camera.position.distanceTo(this.controls.target);
    const scale = Math.max(0.1, dist * 0.02);

    offset.addScaledVector(right, deltaX * scale);
    offset.addScaledVector(up, deltaY * scale);

    this.camera.position.add(offset);
    this.controls.target.add(offset);
    this.controls.update();

    if (this.isFollowing && this.targetMesh) {
      this.targetMesh.updateMatrixWorld(true);
      const worldPos = new THREE.Vector3();
      this.targetMesh.getWorldPosition(worldPos);
      this.followOffset = this.camera.position.clone().sub(worldPos);
    }
  }

  dolly(deltaFactor) {
    if (!this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const factor = 1 + deltaFactor;
    const newLen = offset.length() * factor;
    const minDist = this.controls.minDistance || 0.05;
    const maxDist = this.controls.maxDistance || 25000;
    if (newLen >= minDist && newLen <= maxDist) {
      offset.setLength(newLen);
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();

      if (this.isFollowing) {
        this.followOffset = offset.clone();
      }
    }
  }

  _handleKeyboardInput() {
    if (!this.keysPressed) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    const rotSpeed = 0.02;
    const zoomFactor = 0.03;

    if (this.keysPressed['KeyW']) this.dolly(-zoomFactor);
    if (this.keysPressed['KeyS']) this.dolly(zoomFactor);
    if (this.keysPressed['KeyA']) this.pan(-1, 0);
    if (this.keysPressed['KeyD']) this.pan(1, 0);
    if (this.keysPressed['KeyQ']) this.orbit(-rotSpeed, 0);
    if (this.keysPressed['KeyE']) this.orbit(rotSpeed, 0);
    if (this.keysPressed['ArrowLeft']) this.orbit(-rotSpeed, 0);
    if (this.keysPressed['ArrowRight']) this.orbit(rotSpeed, 0);
    if (this.keysPressed['ArrowUp']) this.orbit(0, -rotSpeed);
    if (this.keysPressed['ArrowDown']) this.orbit(0, rotSpeed);
  }

  calculateFocusDistance(id, renderRadius = null) {
    if (renderRadius != null && renderRadius > 0) {
      return Math.max(3, Math.min(250, renderRadius * 4.5));
    }
    if (id === 'sun') return 120;
    if (['jupiter', 'saturn'].includes(id)) return 55;
    if (['uranus', 'neptune'].includes(id)) return 30;
    if (['earth', 'venus', 'mars', 'mercury'].includes(id)) return 18;
    return 8;
  }

  focusObject(mesh, id, renderRadius = null) {
    if (!mesh) return;
    this.targetMesh = mesh;
    this.targetId = id;
    this.focusDistance = this.calculateFocusDistance(id, renderRadius);

    // Update matrix world immediately for current position accuracy
    this.targetMesh.updateMatrixWorld(true);
    const targetWorldPos = new THREE.Vector3();
    this.targetMesh.getWorldPosition(targetWorldPos);

    this.state = 'FOCUSING';
    this.statusText = 'TARGETING ' + (id ? id.toUpperCase() : 'OBJECT');
    this.transitionStart = performance.now();

    this.startCamPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    // Calculate aesthetically pleasing oblique offset direction
    const currentDir = this.camera.position.clone().sub(targetWorldPos);
    if (currentDir.lengthSq() < 0.001) currentDir.set(0, 1, 1);
    currentDir.normalize();

    // Ensure slight upward angle for cinematic framing
    if (currentDir.y < 0.2) currentDir.y = 0.25;
    currentDir.normalize();

    this.desiredOffset.copy(currentDir.multiplyScalar(this.focusDistance));
    this.followOffset = this.desiredOffset.clone();
  }

  focusPosition(x, y, z, distance = 20) {
    this.targetMesh = null;
    this.isFollowing = false;
    this.state = 'FOCUSING';
    this.statusText = 'TARGETING POSITION';
    this.transitionStart = performance.now();

    this.startCamPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    const targetWorldPos = new THREE.Vector3(x, y, z);
    const dir = this.camera.position.clone().sub(targetWorldPos).normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 1, 0);

    this.desiredOffset.copy(dir.multiplyScalar(distance));
  }

  setFollow(enabled) {
    this.isFollowing = enabled;
    if (enabled) {
      this.state = 'FOLLOWING';
      this.statusText = 'FOLLOWING';
      if (this.targetMesh) {
        this.targetMesh.updateMatrixWorld(true);
        const worldPos = new THREE.Vector3();
        this.targetMesh.getWorldPosition(worldPos);
        this.followOffset = this.camera.position.clone().sub(worldPos);
      }
    } else {
      if (this.state === 'FOLLOWING') {
        this.state = 'FREE';
        this.statusText = 'FREE CAMERA';
      }
    }
  }

  setCinematicOrbit(enabled) {
    if (enabled && this.targetMesh) {
      this.state = 'ORBITING';
      this.statusText = 'CINEMATIC ORBIT';
      this.targetMesh.updateMatrixWorld(true);
      const worldPos = new THREE.Vector3();
      this.targetMesh.getWorldPosition(worldPos);
      const offset = this.camera.position.clone().sub(worldPos);
      this.orbitAngle = Math.atan2(offset.z, offset.x);
    } else {
      if (this.state === 'ORBITING') {
        this.state = this.isFollowing ? 'FOLLOWING' : 'FREE';
        this.statusText = this.isFollowing ? 'FOLLOWING' : 'FREE CAMERA';
      }
    }
  }

  resetCamera() {
    this.targetMesh = null;
    this.targetId = null;
    this.isFollowing = false;
    this.state = 'FREE';
    this.statusText = 'FREE CAMERA';
    this.controls.target.copy(this.defaultTarget);
    this.camera.position.copy(this.defaultCamPos);
  }

  setAppMode(mode) {
    this.appMode = mode;
    if (mode === 'OBSERVATORY') {
      this.targetMesh = null;
      this.isFollowing = false;
      this.state = 'OBSERVATORY';
      this.statusText = 'OBSERVATORY VIEW';
      this.camera.position.set(0, 0, 0);
      this.controls.target.set(0, 20, -50);
      this.controls.minDistance = 0.01;
      this.controls.maxDistance = 0.5;
    } else {
      this.controls.minDistance = 0.05;
      this.controls.maxDistance = 10000;
      this.resetCamera();
    }
  }

  focusSkyPosition(directionVector) {
    if (!directionVector) return;
    this.targetMesh = null;
    this.isFollowing = false;
    this.camera.position.set(0, 0, 0);
    const target = directionVector.clone().normalize().multiplyScalar(50);
    this.controls.target.copy(target);
  }

  update() {
    this._handleKeyboardInput();

    if (this.appMode === 'OBSERVATORY') {
      this.camera.position.set(0, 0, 0);
      if (this.targetMesh) {
        this.targetMesh.updateMatrixWorld(true);
        const worldPos = new THREE.Vector3();
        this.targetMesh.getWorldPosition(worldPos);
        if (worldPos.lengthSq() > 0.001) {
          const desiredTarget = worldPos.clone().normalize().multiplyScalar(50);
          this.controls.target.lerp(desiredTarget, 0.08);
        }
      }
      return;
    }

    // Dynamic Frustum Near/Far adjustment
    const distToTarget = this.camera.position.distanceTo(this.controls.target);
    const newNear = Math.max(0.01, distToTarget * 0.001);
    const newFar = Math.max(15000, distToTarget * 25);

    if (Math.abs(this.camera.near - newNear) / this.camera.near > 0.1 || Math.abs(this.camera.far - newFar) / this.camera.far > 0.1) {
      this.camera.near = newNear;
      this.camera.far = newFar;
      this.camera.updateProjectionMatrix();
    }

    if (!this.targetMesh) return;

    // Force 100% current world matrix before reading position to eliminate 1-frame position lag!
    this.targetMesh.updateMatrixWorld(true);
    const targetWorldPos = new THREE.Vector3();
    this.targetMesh.getWorldPosition(targetWorldPos);

    if (this.state === 'FOCUSING') {
      const elapsed = performance.now() - this.transitionStart;
      const progress = Math.min(1, elapsed / this.transitionDuration);
      // Ease-out cubic: smooth deceleration as camera arrives at target
      const ease = 1 - Math.pow(1 - progress, 3);

      this.controls.target.lerpVectors(this.startTargetPos, targetWorldPos, ease);

      const desiredCamPos = targetWorldPos.clone().add(this.desiredOffset);
      this.camera.position.lerpVectors(this.startCamPos, desiredCamPos, ease);

      if (progress >= 1) {
        this.state = this.isFollowing ? 'FOLLOWING' : 'FREE';
        this.statusText = this.isFollowing ? 'FOLLOWING' : 'TARGET LOCK';
        if (!this.followOffset) {
          this.followOffset = this.desiredOffset.clone();
        }
      } else {
        this.statusText = 'APPROACHING ' + (this.targetId ? this.targetId.toUpperCase() : 'TARGET');
      }
    } else if (this.state === 'ORBITING') {
      this.orbitAngle += 0.005;
      const dist = this.focusDistance || 30;
      const camX = targetWorldPos.x + dist * Math.cos(this.orbitAngle);
      const camZ = targetWorldPos.z + dist * Math.sin(this.orbitAngle);
      const camY = targetWorldPos.y + dist * 0.35;

      this.controls.target.copy(targetWorldPos);
      this.camera.position.set(camX, camY, camZ);
      this.statusText = 'CINEMATIC ORBIT';
    } else if (this.isFollowing || this.state === 'FOLLOWING') {
      if (!this.followOffset) {
        this.followOffset = this.camera.position.clone().sub(this.controls.target);
      }
      this.controls.target.copy(targetWorldPos);
      this.camera.position.copy(targetWorldPos).add(this.followOffset);
      this.statusText = 'FOLLOWING ' + (this.targetId ? this.targetId.toUpperCase() : '');
    }
  }
}

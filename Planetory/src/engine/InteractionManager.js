import * as THREE from 'three';

export default class InteractionManager {
  constructor(camera, interactableObjects, domElement, onSelectCallback) {
    this.camera = camera;
    this.objects = [...interactableObjects];
    this.domElement = domElement;
    this.onSelectCallback = onSelectCallback;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 1;
    this.mouse = new THREE.Vector2();

    this._onClick = this._onClick.bind(this);
    this.domElement.addEventListener('click', this._onClick);
  }

  updateObjects(newObjects) {
    this.objects = [...newObjects];
  }

  _onClick(event) {
    // Ignore if it was a drag (moved more than threshold)
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.objects, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const obj = hit.object;

      if (obj.userData?.data) {
        // Planet or Sun
        this.onSelectCallback(obj.userData.data, undefined);
      } else if (obj.isInstancedMesh && obj.userData?.isCatalogAsteroid) {
        // Catalog asteroid — pass instanceId
        const instanceId = hit.instanceId;
        this.onSelectCallback({ _isCatalogAsteroid: true }, instanceId);
      } else if (obj.isInstancedMesh) {
        // Other instanced (belt) — deselect
        this.onSelectCallback(null, undefined);
      }
    } else {
      this.onSelectCallback(null, undefined);
    }
  }

  cleanup() {
    this.domElement.removeEventListener('click', this._onClick);
  }
}

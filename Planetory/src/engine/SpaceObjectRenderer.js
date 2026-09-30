/**
 * SpaceObjectRenderer — Delegates celestial body creation to CelestialBodyFactory.
 * Handles spacecraft construction separately (non-spherical geometry).
 */
import * as THREE from 'three';
import CelestialBodyFactory from './CelestialBodyFactory';

export default class SpaceObjectRenderer {
  constructor(scene, textureManager) {
    this.scene = scene;
    this.factory = new CelestialBodyFactory(textureManager);
  }

  // ── Planet (with axial tilt + rotation hierarchy) ─────────────────────────────
  createPlanetMesh(planetData, radius) {
    return this.factory.createPlanet(planetData, radius);
  }

  // ── Moon / Natural Satellite ──────────────────────────────────────────────────
  createMoonMesh(moonData, radius) {
    return this.factory.createMoon(moonData, radius);
  }

  // ── Sun ───────────────────────────────────────────────────────────────────────
  createSun(radius) {
    return this.factory.createSun(radius);
  }

  // ── Artificial Spacecraft (geometric approximations, not spheres) ─────────────
  createSpacecraftGroup(satData) {
    const satGroup = new THREE.Group();

    if (satData.id === 'iss') {
      // ISS: central truss + solar arrays
      const bodyGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 });
      satGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

      const solarGeo = new THREE.BoxGeometry(2.4, 0.05, 0.6);
      const solarMat = new THREE.MeshStandardMaterial({ color: 0x0044aa, roughness: 0.3, metalness: 0.1 });
      satGroup.add(new THREE.Mesh(solarGeo, solarMat));

      const trussGeo = new THREE.BoxGeometry(3.6, 0.08, 0.08);
      const trussMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
      satGroup.add(new THREE.Mesh(trussGeo, trussMat));

    } else if (satData.id === 'jwst') {
      // JWST: hexagonal mirror + sunshield
      const mirrorGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.06, 6);
      const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.05 });
      const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
      mirror.rotation.x = Math.PI / 2;
      satGroup.add(mirror);

      const shieldGeo = new THREE.BoxGeometry(1.8, 0.04, 1.0);
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0xc8c890, metalness: 0.3, roughness: 0.8 });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(0, -0.25, 0);
      satGroup.add(shield);

    } else if (satData.id === 'hubble') {
      // Hubble: cylinder with solar panels
      const tubeGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.2, 16);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, metalness: 0.6, roughness: 0.4 });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.x = Math.PI / 2;
      satGroup.add(tube);

      const panelGeo = new THREE.BoxGeometry(1.8, 0.04, 0.35);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, metalness: 0.2, roughness: 0.5 });
      satGroup.add(new THREE.Mesh(panelGeo, panelMat));

    } else {
      // Generic satellite
      const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 });
      satGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

      const panelGeo = new THREE.BoxGeometry(1.6, 0.05, 0.3);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x0033aa, metalness: 0.3 });
      satGroup.add(new THREE.Mesh(panelGeo, panelMat));
    }

    satGroup.userData = {
      objectId: satData.id,
      id: satData.id,
      type: satData.objectType || 'ARTIFICIAL SATELLITE',
      data: satData,
      category: satData.category
    };

    // Invisible pick sphere for raycasting
    const pickGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    const pickMesh = new THREE.Mesh(pickGeo, pickMat);
    pickMesh.userData = satGroup.userData;
    satGroup.add(pickMesh);

    return { group: satGroup, pickMesh };
  }
}

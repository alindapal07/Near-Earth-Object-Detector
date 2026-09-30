import * as THREE from "three";

export default class LightingManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.sunLight = null;
    this.ambientLight = null;
    this.sunMesh = null;
    this.coronaGroup = new THREE.Group();
    this.scene.add(this.coronaGroup);

    // Animated sun surface shader uniforms
    this._sunUniforms = null;

    this._setupRenderer();
    this._setupLights();
  }

  _setupRenderer() {
    if (!this.renderer) return;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  _setupLights() {
    // Primary Sun PointLight — physically placed at origin
    this.sunLight = new THREE.PointLight(0xfff4dc, 5.0, 0, 0.12);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width  = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias        = -0.0002;
    this.sunLight.shadow.normalBias  = 0.02;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far  = 8000;
    this.scene.add(this.sunLight);

    // Very subtle deep-space ambient — preserves day/night crisp terminator
    this.ambientLight = new THREE.AmbientLight(0x0a1428, 0.12);
    this.scene.add(this.ambientLight);
  }

  /**
   * Creates a shader-animated Sun surface with multi-layer corona/glow system.
   * ZERO rectangular artifacts — uses Sprite radial textures only.
   */
  createRadialSun(radius = 5.5, _texture = null) {
    // === Layer 1: Animated Emissive Surface (GLSL shader) ===
    this._sunUniforms = {
      uTime: { value: 0 },
      uRadius: { value: radius }
    };

    const sunVertShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const sunFragShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;

      // Pseudo-random hash
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      // Smooth noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        // Slow turbulence for solar granulation
        float t = uTime * 0.04;
        float n1 = noise(vUv * 6.0  + vec2(t, t * 0.7));
        float n2 = noise(vUv * 12.0 - vec2(t * 0.5, t));
        float n3 = noise(vUv * 22.0 + vec2(-t * 0.3, t * 0.6));
        float granule = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        // Limb darkening
        float limb = 1.0 - (1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0))) * 0.45;

        // Core temp color ramp (cool=orange → hot=white)
        vec3 coolColor = vec3(1.0, 0.55, 0.05);
        vec3 hotColor  = vec3(1.0, 0.94, 0.75);
        vec3 surfColor = mix(coolColor, hotColor, granule * 0.7 + 0.3);

        surfColor *= limb;

        gl_FragColor = vec4(surfColor, 1.0);
      }
    `;

    const sunGeo = new THREE.SphereGeometry(radius, 64, 64);
    const sunMat = new THREE.ShaderMaterial({
      vertexShader:   sunVertShader,
      fragmentShader: sunFragShader,
      uniforms: this._sunUniforms,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.name = 'sun_surface';
    this.scene.add(this.sunMesh);

    // === Layer 2: Inner Corona (warm yellow, tight) ===
    const coronaTex1 = this._createRadialGlowTexture(512, '#ffcc44', 0.9);
    const corona1Mat = new THREE.SpriteMaterial({
      map: coronaTex1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const corona1 = new THREE.Sprite(corona1Mat);
    corona1.scale.set(radius * 3.8, radius * 3.8, 1);
    this.coronaGroup.add(corona1);

    // === Layer 3: Mid Corona (orange, wider) ===
    const coronaTex2 = this._createRadialGlowTexture(512, '#ff8800', 0.55);
    const corona2Mat = new THREE.SpriteMaterial({
      map: coronaTex2,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const corona2 = new THREE.Sprite(corona2Mat);
    corona2.scale.set(radius * 7.5, radius * 7.5, 1);
    this.coronaGroup.add(corona2);

    // === Layer 4: Outer Soft Halo (very faint, deep space glow) ===
    const coronaTex3 = this._createRadialGlowTexture(512, '#ff5500', 0.22);
    const corona3Mat = new THREE.SpriteMaterial({
      map: coronaTex3,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const corona3 = new THREE.Sprite(corona3Mat);
    corona3.scale.set(radius * 16.0, radius * 16.0, 1);
    this.coronaGroup.add(corona3);

    return this.sunMesh;
  }

  /**
   * Pure radial canvas gradient — zero rectangular edge artifacts.
   */
  _createRadialGlowTexture(size = 512, colorHex = '#ffaa00', maxOpacity = 0.8) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

    const col = new THREE.Color(colorHex);
    const r = Math.round(col.r * 255);
    const g = Math.round(col.g * 255);
    const b = Math.round(col.b * 255);

    gradient.addColorStop(0.0,  `rgba(${r},${g},${b},${maxOpacity})`);
    gradient.addColorStop(0.15, `rgba(${r},${g},${b},${(maxOpacity * 0.75).toFixed(3)})`);
    gradient.addColorStop(0.40, `rgba(${r},${g},${b},${(maxOpacity * 0.35).toFixed(3)})`);
    gradient.addColorStop(0.70, `rgba(${r},${g},${b},${(maxOpacity * 0.08).toFixed(3)})`);
    gradient.addColorStop(0.90, `rgba(${r},${g},${b},${(maxOpacity * 0.01).toFixed(3)})`);
    gradient.addColorStop(1.0,  `rgba(${r},${g},${b},0.0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Called every frame — advances sun shader clock.
   */
  update(timeDays) {
    if (this._sunUniforms) {
      // Slow, cinematic time — visible granulation movement without shimmering
      this._sunUniforms.uTime.value = timeDays * 50.0;
    }
  }

  dispose() {
    this.coronaGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    this.scene.remove(this.coronaGroup);
    if (this.sunMesh) {
      this.sunMesh.geometry.dispose();
      this.sunMesh.material.dispose();
      this.scene.remove(this.sunMesh);
    }
    if (this.sunLight)    this.scene.remove(this.sunLight);
    if (this.ambientLight) this.scene.remove(this.ambientLight);
  }
}

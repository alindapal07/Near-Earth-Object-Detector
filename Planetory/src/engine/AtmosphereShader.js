/**
 * AtmosphereShader.js — GLSL Fresnel-based atmosphere system.
 */
import * as THREE from "three";

export const ATMOSPHERE_PROFILES = {
  earth:   { dayColor: [0.3, 0.6, 1.0],  nightColor: [0.0, 0.05, 0.15], rimPower: 3.5, intensity: 0.85, scale: 1.045 },
  venus:   { dayColor: [1.0, 0.85, 0.3], nightColor: [0.3, 0.15, 0.0],  rimPower: 2.5, intensity: 0.9,  scale: 1.06  },
  mars:    { dayColor: [0.9, 0.4, 0.15], nightColor: [0.1, 0.02, 0.0],  rimPower: 5.0, intensity: 0.35, scale: 1.025 },
  jupiter: { dayColor: [0.9, 0.78, 0.55],nightColor: [0.1, 0.07, 0.04], rimPower: 4.5, intensity: 0.40, scale: 1.020 },
  saturn:  { dayColor: [0.9, 0.82, 0.65],nightColor: [0.1, 0.07, 0.04], rimPower: 4.5, intensity: 0.35, scale: 1.018 },
  uranus:  { dayColor: [0.4, 0.9, 0.9],  nightColor: [0.0, 0.1, 0.15],  rimPower: 4.0, intensity: 0.50, scale: 1.030 },
  neptune: { dayColor: [0.1, 0.3, 1.0],  nightColor: [0.0, 0.02, 0.2],  rimPower: 4.0, intensity: 0.55, scale: 1.030 },
  titan:   { dayColor: [0.85, 0.5, 0.1], nightColor: [0.1, 0.03, 0.0],  rimPower: 2.8, intensity: 0.70, scale: 1.10  },
};

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uDayColor;
  uniform vec3 uNightColor;
  uniform vec3 uSunDirectionLocal;
  uniform float uRimPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rimDot   = 1.0 - max(0.0, dot(vNormal, vViewDir));
    float rim      = pow(rimDot, uRimPower);
    float sunDot   = dot(normalize(vNormal), normalize(uSunDirectionLocal));
    float sunFactor = clamp(sunDot * 0.5 + 0.5, 0.0, 1.0);
    vec3 atmColor  = mix(uNightColor, uDayColor, sunFactor);
    float alpha    = rim * uIntensity * (0.3 + 0.7 * sunFactor);
    gl_FragColor   = vec4(atmColor, clamp(alpha, 0.0, 1.0));
  }
`;

export function createAtmosphereMesh(planetId, radius) {
  const profile = ATMOSPHERE_PROFILES[planetId] || ATMOSPHERE_PROFILES.mars;
  const uniforms = {
    uDayColor:          { value: new THREE.Vector3(...profile.dayColor) },
    uNightColor:        { value: new THREE.Vector3(...profile.nightColor) },
    uSunDirectionLocal: { value: new THREE.Vector3(1, 0, 0) },
    uRimPower:          { value: profile.rimPower },
    uIntensity:         { value: profile.intensity },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
  });
  const scale = profile.scale ?? 1.04;
  const geo   = new THREE.SphereGeometry(radius * scale, 48, 48);
  const mesh  = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  mesh.name = planetId + "_atmosphere";
  mesh.userData = { objectId: planetId + "_atmos", isAtmosphere: true };
  return { mesh, uniforms };
}

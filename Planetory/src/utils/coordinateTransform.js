/**
 * Transforms standard ecliptic astronomy coordinates (where Z is "up")
 * to Three.js coordinates (where Y is "up").
 * 
 * Ecliptic coordinates:
 * X: Points towards vernal equinox
 * Y: In ecliptic plane
 * Z: Ecliptic North pole
 * 
 * Three.js coordinates:
 * X: Right
 * Y: Up
 * Z: Towards viewer
 */
export function eclipticToThree(astronomyVector) {
  return {
    x: astronomyVector.x,
    y: astronomyVector.z, // Z becomes Y
    z: -astronomyVector.y // Y becomes -Z
  };
}

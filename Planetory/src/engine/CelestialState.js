/**
 * CelestialState.js - Central Astronomical State Vector Data Structure
 * Encapsulates position, velocity, acceleration, reference frame, epoch, precision, and provenance.
 */

import { REFERENCE_FRAMES } from '../utils/referenceFrameUtils';

export default class CelestialState {
  constructor({
    objectId,
    timestamp = new Date().toISOString(),
    epoch = 0, // simTimeDays or Julian Date
    position = { x: 0, y: 0, z: 0 },
    velocity = { vx: 0, vy: 0, vz: 0 },
    acceleration = { ax: 0, ay: 0, az: 0 },
    referenceFrame = REFERENCE_FRAMES.HELIOCENTRIC_ECLIPTIC,
    center = 'SUN',
    source = 'ANALYTICAL-KEPLER',
    precision = 'STANDARD', // 'HIGH', 'STANDARD', 'ESTIMATED'
    confidence = 1.0,
    accuracy = '1.0km',
    units = { position: 'AU', velocity: 'km/s', acceleration: 'm/s²' },
    isFallback = false
  } = {}) {
    this.objectId = objectId;
    this.timestamp = timestamp;
    this.epoch = epoch;
    this.position = position;
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.referenceFrame = referenceFrame;
    this.center = center;
    this.source = source;
    this.precision = precision;
    this.confidence = confidence;
    this.accuracy = accuracy;
    this.units = units;
    this.isFallback = isFallback;
  }

  /**
   * Computes position magnitude (distance from origin/center)
   */
  getDistance() {
    return Math.sqrt(this.position.x ** 2 + this.position.y ** 2 + this.position.z ** 2);
  }

  /**
   * Computes velocity magnitude (speed)
   */
  getSpeed() {
    return Math.sqrt(this.velocity.vx ** 2 + this.velocity.vy ** 2 + this.velocity.vz ** 2);
  }

  /**
   * Returns formatted telemetry provenance label for HUD
   */
  getProvenanceBadge() {
    if (this.source.includes('JPL')) {
      return { label: 'JPL HORIZONS', type: 'high-precision', color: '#00f0ff' };
    }
    if (this.source.includes('NASA')) {
      return { label: 'NASA SBDB', type: 'high-precision', color: '#00ff88' };
    }
    if (this.source.includes('LOCAL')) {
      return { label: 'LOCAL EPHEMERIS', type: 'standard', color: '#ffb703' };
    }
    return { label: 'ANALYTICAL KEPLER', type: 'analytical', color: '#94a3b8' };
  }
}

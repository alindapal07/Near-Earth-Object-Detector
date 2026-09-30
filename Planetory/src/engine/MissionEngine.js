/**
 * MissionEngine.js - Central Spacecraft Mission & Trajectory Manager
 * Handles spacecraft states, orbital trajectory calculations, maneuvers, relative analytics, and mission timelines.
 */

import { SPACECRAFT_MISSIONS } from '../data/spacecraftMissions';
import EphemerisEngine from './EphemerisEngine';
import { CONSTANTS } from '../utils/epochUtils';

class MissionEngine {
  constructor() {
    this.missions = SPACECRAFT_MISSIONS;
  }

  /**
   * Returns list of all registered spacecraft missions.
   */
  getMissions() {
    return this.missions;
  }

  /**
   * Finds a spacecraft by ID.
   * @param {string} id 
   */
  getSpacecraft(id) {
    if (!id) return null;
    return this.missions.find(m => m.id.toLowerCase() === id.toLowerCase()) || null;
  }

  /**
   * Gets current state vector for a spacecraft at simTimeDays.
   * @param {string} spacecraftId 
   * @param {number} simTimeDays 
   */
  getSpacecraftState(spacecraftId, simTimeDays = 0) {
    return EphemerisEngine.getBodyState(spacecraftId, simTimeDays);
  }

  /**
   * Computes relative motion analytics between a spacecraft and a target celestial body.
   * @param {string} spacecraftId 
   * @param {string} targetBodyId 
   * @param {number} simTimeDays 
   */
  calculateRelativeAnalytics(spacecraftId, targetBodyId, simTimeDays = 0) {
    const scState = this.getSpacecraftState(spacecraftId, simTimeDays);
    const bodyState = EphemerisEngine.getBodyState(targetBodyId, simTimeDays);

    if (!scState || !bodyState) return null;

    // Relative position vector dx, dy, dz (AU)
    const dx = scState.position.x - bodyState.position.x;
    const dy = scState.position.y - bodyState.position.y;
    const dz = scState.position.z - bodyState.position.z;
    const distAu = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const distKm = distAu * CONSTANTS.AU_IN_KM;

    // Relative velocity vector dvx, dvy, dvz (km/s)
    const dvx = (scState.velocity.vx || 0) - (bodyState.velocity.vx || 0);
    const dvy = (scState.velocity.vy || 0) - (bodyState.velocity.vy || 0);
    const dvz = (scState.velocity.vz || 0) - (bodyState.velocity.vz || 0);
    const relSpeed = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

    // Closing velocity v_closing = - (r_rel . v_rel) / |r_rel|
    const dotProduct = (dx * dvx + dy * dvy + dz * dvz);
    const closingVelocity = distAu > 0 ? -(dotProduct / distAu) : 0;

    return {
      spacecraftId,
      targetBodyId,
      distanceAu: distAu,
      distanceKm: distKm,
      relativeSpeedKmS: relSpeed,
      closingVelocityKmS: closingVelocity,
      relPosAu: { x: dx, y: dy, z: dz },
      relVelKmS: { vx: dvx, vy: dvy, vz: dvz }
    };
  }

  /**
   * Generates discrete 3D trajectory points for spacecraft visualization over a time window.
   * @param {string} spacecraftId 
   * @param {number} centerSimDays 
   * @param {number} rangeDays 
   * @param {number} steps 
   */
  generateTrajectoryPoints(spacecraftId, centerSimDays = 0, rangeDays = 365, steps = 60) {
    const points = [];
    const startDays = centerSimDays - rangeDays / 2;
    const stepSize = rangeDays / steps;

    for (let i = 0; i <= steps; i++) {
      const t = startDays + (i * stepSize);
      const st = this.getSpacecraftState(spacecraftId, t);
      if (st && st.position) {
        points.push({ x: st.position.x, y: st.position.y, z: st.position.z, epoch: t });
      }
    }

    return points;
  }
}

export default new MissionEngine();
